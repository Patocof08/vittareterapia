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

    // Extract user id from JWT (request is already JWT-verified by Functions)
    const token = authHeader.replace('Bearer ', '')
    let userId: string | null = null
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
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

    // LÓGICA FINANCIERA: una sola llamada atómica a la función SQL
    try {
      const { error: financialError } = await supabaseAdmin.rpc(
        'handle_account_deletion_financials',
        { _user_id: userId }
      )
      if (financialError) throw financialError

      // Cleanup de datos dependientes
      const { data: clientSubs } = await supabaseAdmin
        .from('client_subscriptions')
        .select('id')
        .eq('client_id', userId)

      const clientSubIds = (clientSubs ?? []).map((s: any) => s.id)
      if (clientSubIds.length) {
        await supabaseAdmin.from('subscription_history').delete().in('subscription_id', clientSubIds)
        await supabaseAdmin.from('deferred_revenue').delete().in('subscription_id', clientSubIds)
        await supabaseAdmin.from('client_subscriptions').delete().in('id', clientSubIds)
      }

      // Psychologist-related cleanup
      const { data: psychProfiles } = await supabaseAdmin
        .from('psychologist_profiles')
        .select('id')
        .eq('user_id', userId)

      const psychIds = (psychProfiles ?? []).map((p: any) => p.id)
      if (psychIds.length) {
        await supabaseAdmin.from('psychologist_documents').delete().in('psychologist_id', psychIds)
        await supabaseAdmin.from('psychologist_availability').delete().in('psychologist_id', psychIds)
        await supabaseAdmin.from('psychologist_pricing').delete().in('psychologist_id', psychIds)
        await supabaseAdmin.from('appointments').delete().in('psychologist_id', psychIds)
        await supabaseAdmin.from('session_clinical_notes').delete().in('psychologist_id', psychIds)
        await supabaseAdmin.from('psychologist_verifications').delete().in('psychologist_id', psychIds)
        await supabaseAdmin.from('wallet_transactions').delete().in('psychologist_id', psychIds)
        await supabaseAdmin.from('psychologist_wallets').delete().in('psychologist_id', psychIds)
        await supabaseAdmin.from('psychologist_profiles').delete().eq('user_id', userId)
      }

      // Appointments, payments, credits, messages donde user es cliente
      const { data: appts } = await supabaseAdmin
        .from('appointments')
        .select('id')
        .eq('patient_id', userId)

      const apptIds = (appts ?? []).map((a: any) => a.id)
      if (apptIds.length) {
        await supabaseAdmin.from('session_clinical_notes').delete().in('appointment_id', apptIds)
        await supabaseAdmin.from('payments').delete().in('appointment_id', apptIds)
        await supabaseAdmin.from('appointments').delete().in('id', apptIds)
      }
      
      await supabaseAdmin.from('session_clinical_notes').delete().eq('patient_id', userId)
      await supabaseAdmin.from('payments').delete().eq('client_id', userId)
      await supabaseAdmin.from('client_credits').delete().eq('client_id', userId)

      // Conversations and messages
      const { data: convos } = await supabaseAdmin
        .from('conversations')
        .select('id')
        .eq('client_id', userId)
      
      const convoIds = (convos ?? []).map((c: any) => c.id)
      if (convoIds.length) {
        await supabaseAdmin.from('messages').delete().in('conversation_id', convoIds)
        await supabaseAdmin.from('conversations').delete().in('id', convoIds)
      }

      // Preferences, profile, roles
      await supabaseAdmin.from('patient_preferences').delete().eq('user_id', userId)
      await supabaseAdmin.from('profiles').delete().eq('id', userId)
      await supabaseAdmin.from('user_roles').delete().eq('user_id', userId)
    } catch (cleanupError) {
      console.error('User data cleanup encountered issues:', cleanupError)
      throw cleanupError
    }

    // Try hard delete
    let { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    // Fallback to soft delete if hard delete fails due to DB constraints
    if (deleteError) {
      console.error('Error deleting user (hard delete):', deleteError)
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
      console.log('User deleted successfully:', userId)
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