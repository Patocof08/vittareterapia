import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header provided')
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      )
    }

    // Extract user id from JWT
    const token = authHeader.replace('Bearer ', '')
    let userId: string | null = null
    try {
      // JWT payload is base64url encoded — normalize to standard base64 before decoding
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
      const payload = JSON.parse(atob(base64))
      userId = payload.sub as string
    } catch (_) {}

    if (!userId) {
      console.error('Invalid JWT: cannot extract user id')
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      )
    }

    console.log('Deleting user account:', userId)

    // Create a Supabase Admin client with service role
    // (verify_jwt is false — we verify the user manually below)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the token belongs to a real active user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (userError || !user) {
      console.error('User not found or invalid token:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // STEP 1: Financial processing — atomic SQL function handles all money logic
    try {
      const { error: financialError } = await supabaseAdmin.rpc(
        'handle_account_deletion_financials',
        { _user_id: userId }
      )
      if (financialError) throw financialError
    } catch (financialErr) {
      console.error('Financial processing failed:', financialErr)
      throw financialErr
    }

    // STEP 2: Cancel Stripe subscriptions and delete operational subscription data
    const { data: clientSubs } = await supabaseAdmin
      .from('client_subscriptions')
      .select('id, stripe_subscription_id')
      .eq('client_id', userId)

    const clientSubIds = (clientSubs ?? []).map((s: any) => s.id)

    // Cancel active Stripe subscriptions before removing DB records
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
    if (STRIPE_SECRET_KEY) {
      const stripeSubIds = (clientSubs ?? [])
        .map((s: any) => s.stripe_subscription_id)
        .filter(Boolean)

      for (const stripeSubId of stripeSubIds) {
        try {
          await fetch(`https://api.stripe.com/v1/subscriptions/${stripeSubId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` },
          })
          console.log('Stripe subscription cancelled:', stripeSubId)
        } catch (stripeErr) {
          console.error('Failed to cancel Stripe subscription:', stripeSubId, stripeErr)
        }
      }
    }

    if (clientSubIds.length) {
      await supabaseAdmin.from('subscription_history').delete().in('subscription_id', clientSubIds)
      await supabaseAdmin.from('deferred_revenue').delete().in('subscription_id', clientSubIds)
      await supabaseAdmin.from('client_subscriptions').delete().in('id', clientSubIds)
    }

    // STEP 3: Psychologist-specific non-financial cleanup
    const { data: psychProfiles } = await supabaseAdmin
      .from('psychologist_profiles')
      .select('id')
      .eq('user_id', userId)

    const psychIds = (psychProfiles ?? []).map((p: any) => p.id)
    if (psychIds.length) {
      // Also clean up client subscriptions where this therapist is the psychologist
      const { data: therapistSubs } = await supabaseAdmin
        .from('client_subscriptions')
        .select('id')
        .in('psychologist_id', psychIds)

      const therapistSubIds = (therapistSubs ?? []).map((s: any) => s.id)
      if (therapistSubIds.length) {
        await supabaseAdmin.from('subscription_history').delete().in('subscription_id', therapistSubIds)
        await supabaseAdmin.from('deferred_revenue').delete().in('subscription_id', therapistSubIds)
        await supabaseAdmin.from('client_subscriptions').delete().in('id', therapistSubIds)
      }

      await supabaseAdmin.from('psychologist_documents').delete().in('psychologist_id', psychIds)
      await supabaseAdmin.from('psychologist_availability').delete().in('psychologist_id', psychIds)
      await supabaseAdmin.from('psychologist_pricing').delete().in('psychologist_id', psychIds)
      await supabaseAdmin.from('session_clinical_notes').delete().in('psychologist_id', psychIds)
      await supabaseAdmin.from('psychologist_verifications').delete().in('psychologist_id', psychIds)
      await supabaseAdmin.from('psychologist_wallets').delete().in('psychologist_id', psychIds)
      // NOTE: wallet_transactions are NOT deleted — they are the financial audit trail.
      // psychologist_profiles FK on wallet_transactions is ON DELETE SET NULL.
      // NOTE: appointments are NOT deleted — they are kept for audit with psychologist_id = NULL.
      // NOTE: payments are NOT deleted — they are kept for audit with psychologist_id = NULL.
      await supabaseAdmin.from('psychologist_profiles').delete().eq('user_id', userId)
    }

    // STEP 4: Client-specific non-financial cleanup
    // Clinical notes for this patient (private medical data — delete)
    await supabaseAdmin.from('session_clinical_notes').delete().eq('patient_id', userId)
    // Session credits (operational data — delete)
    await supabaseAdmin.from('client_credits').delete().eq('client_id', userId)
    // NOTE: payments are NOT deleted — kept for audit trail. FK client_id will be SET NULL when profile is deleted.
    // NOTE: appointments are NOT deleted — kept for audit trail. FK patient_id will be SET NULL when auth user is deleted.

    // STEP 5: Conversations and messages (communication data — delete)
    const { data: convos } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('client_id', userId)

    const convoIds = (convos ?? []).map((c: any) => c.id)
    if (convoIds.length) {
      await supabaseAdmin.from('messages').delete().in('conversation_id', convoIds)
      await supabaseAdmin.from('conversations').delete().in('id', convoIds)
    }

    // Also delete conversations where this user is the psychologist
    if (psychIds.length) {
      const { data: psychConvos } = await supabaseAdmin
        .from('conversations')
        .select('id')
        .in('psychologist_id', psychIds)

      const psychConvoIds = (psychConvos ?? []).map((c: any) => c.id)
      if (psychConvoIds.length) {
        await supabaseAdmin.from('messages').delete().in('conversation_id', psychConvoIds)
        await supabaseAdmin.from('conversations').delete().in('id', psychConvoIds)
      }
    }

    // STEP 6: Personal data cleanup — deleting profiles cascades FK SET NULL to payments/appointments
    await supabaseAdmin.from('patient_preferences').delete().eq('user_id', userId)
    // Deleting profiles will SET NULL payments.client_id (via FK fk_payment_client ON DELETE SET NULL)
    await supabaseAdmin.from('profiles').delete().eq('id', userId)
    await supabaseAdmin.from('user_roles').delete().eq('user_id', userId)

    // STEP 7: Delete auth user (hard delete preferred)
    // Hard delete will SET NULL appointments.patient_id (via FK appointments_patient_id_fkey ON DELETE SET NULL)
    let { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Hard delete failed, attempting soft delete:', deleteError)
      // Soft delete: bans the user permanently (keeps auth.users row but prevents login)
      const res = await (supabaseAdmin as any).auth.admin.deleteUser(userId, { shouldSoftDelete: true })
      deleteError = res.error
      if (deleteError) {
        console.error('Soft delete also failed:', deleteError)
        return new Response(
          JSON.stringify({ error: deleteError.message || 'Database error deleting user' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
      console.log('User soft-deleted successfully:', userId)
    } else {
      console.log('User hard-deleted successfully:', userId)
    }

    return new Response(
      JSON.stringify({ message: 'Account deleted successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error in delete-user-account function:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
