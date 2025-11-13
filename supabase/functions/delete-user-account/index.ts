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

    // NUEVA LÓGICA FINANCIERA EN ELIMINACIÓN DE CUENTA
    try {
      // 1. Procesar citas pendientes del usuario como cliente
      const { data: upcomingAppts } = await supabaseAdmin
        .from('appointments')
        .select('id, start_time, psychologist_id, subscription_id, status')
        .eq('patient_id', userId)
        .eq('status', 'pending')
        .gte('start_time', new Date().toISOString())

      for (const appt of upcomingAppts ?? []) {
        const sessionTime = new Date(appt.start_time)
        const now = new Date()
        const hoursUntilSession = (sessionTime.getTime() - now.getTime()) / (1000 * 60 * 60)

        if (hoursUntilSession < 24) {
          // Sesión <24h: 15% Admin + 85% Psicólogo (usar process_late_cancellation)
          console.log(`Procesando sesión <24h: ${appt.id}`)
          await supabaseAdmin.rpc('process_late_cancellation', {
            _appointment_id: appt.id,
            _subscription_id: appt.subscription_id,
            _psychologist_id: appt.psychologist_id
          })
        } else {
          // Sesión >24h: 100% Admin
          console.log(`Procesando sesión >24h: ${appt.id}`)
          
          // Obtener el monto diferido de esta sesión
          const { data: deferredData } = await supabaseAdmin
            .from('deferred_revenue')
            .select('deferred_amount')
            .eq('appointment_id', appt.id)
            .maybeSingle()

          if (deferredData && deferredData.deferred_amount > 0) {
            // Mover todo el diferido a admin (100%)
            const { data: adminWallet } = await supabaseAdmin
              .from('admin_wallet')
              .select('id, balance')
              .single()

            if (adminWallet) {
              const newBalance = Number(adminWallet.balance) + Number(deferredData.deferred_amount)
              
              await supabaseAdmin
                .from('admin_wallet')
                .update({ balance: newBalance })
                .eq('id', adminWallet.id)

              await supabaseAdmin
                .from('wallet_transactions')
                .insert({
                  transaction_type: 'account_deletion',
                  wallet_type: 'admin',
                  psychologist_id: appt.psychologist_id,
                  appointment_id: appt.id,
                  amount: deferredData.deferred_amount,
                  balance_before: adminWallet.balance,
                  balance_after: newBalance,
                  description: 'Eliminación de cuenta - sesión >24h (100% Admin)'
                })

              // Actualizar deferred_revenue
              await supabaseAdmin
                .from('deferred_revenue')
                .update({ 
                  deferred_amount: 0,
                  recognized_amount: deferredData.deferred_amount 
                })
                .eq('appointment_id', appt.id)
            }
          }

          // Cancelar la cita
          await supabaseAdmin
            .from('appointments')
            .update({ 
              status: 'cancelled',
              cancellation_reason: 'Eliminación de cuenta (>24h)'
            })
            .eq('id', appt.id)
        }
      }

      // 2. Procesar suscripciones activas del usuario como cliente
      const { data: clientSubs } = await supabaseAdmin
        .from('client_subscriptions')
        .select('id, psychologist_id, package_type')
        .eq('client_id', userId)
        .eq('status', 'active')

      for (const sub of clientSubs ?? []) {
        // Obtener ingreso diferido de esta suscripción (sin sesiones)
        const { data: deferred } = await supabaseAdmin
          .from('deferred_revenue')
          .select('deferred_amount')
          .eq('subscription_id', sub.id)
          .single()

        if (deferred && deferred.deferred_amount > 0) {
          // Sin sesiones: 100% Admin
          console.log(`Procesando suscripción sin sesiones: ${sub.id}`)
          const { data: adminWallet } = await supabaseAdmin
            .from('admin_wallet')
            .select('id, balance')
            .limit(1)
            .single()

          if (adminWallet) {
            const newBalance = Number(adminWallet.balance) + Number(deferred.deferred_amount)
            
            await supabaseAdmin
              .from('admin_wallet')
              .update({ balance: newBalance })
              .eq('id', adminWallet.id)

            await supabaseAdmin
              .from('wallet_transactions')
              .insert({
                transaction_type: 'account_deletion',
                wallet_type: 'admin',
                subscription_id: sub.id,
                amount: deferred.deferred_amount,
                balance_before: adminWallet.balance,
                balance_after: newBalance,
                description: 'Eliminación de cuenta - sin sesiones (100% Admin)'
              })

            // Actualizar deferred_revenue
            await supabaseAdmin
              .from('deferred_revenue')
              .update({ 
                deferred_amount: 0,
                recognized_amount: deferred.deferred_amount 
              })
              .eq('subscription_id', sub.id)
          }
        }

        // Cancelar auto-renovación
        await supabaseAdmin
          .from('client_subscriptions')
          .update({ 
            auto_renew: false,
            cancelled_at: new Date().toISOString()
          })
          .eq('id', sub.id)
      }

      // 3. Procesar créditos pendientes del usuario
      const { data: credits } = await supabaseAdmin
        .from('client_credits')
        .select('id, amount, original_appointment_id')
        .eq('client_id', userId)
        .eq('status', 'available')

      for (const credit of credits ?? []) {
        if (credit.original_appointment_id) {
          // Obtener subscription del appointment original
          const { data: appt } = await supabaseAdmin
            .from('appointments')
            .select('subscription_id')
            .eq('id', credit.original_appointment_id)
            .single()

          if (appt?.subscription_id) {
            // El crédito no usado va al admin
            const { data: adminWallet } = await supabaseAdmin
              .from('admin_wallet')
              .select('id, balance')
              .limit(1)
              .single()

            if (adminWallet) {
              const newBalance = adminWallet.balance + credit.amount
              
              await supabaseAdmin
                .from('admin_wallet')
                .update({ balance: newBalance })
                .eq('id', adminWallet.id)

              await supabaseAdmin
                .from('wallet_transactions')
                .insert({
                  transaction_type: 'credit_expired',
                  wallet_type: 'admin',
                  amount: credit.amount,
                  balance_before: adminWallet.balance,
                  balance_after: newBalance,
                  description: 'Crédito no usado por eliminación de cuenta'
                })
            }
          }
        }

        // Marcar crédito como expirado
        await supabaseAdmin
          .from('client_credits')
          .update({ status: 'expired' })
          .eq('id', credit.id)
      }

      // 4. Cleanup de datos dependientes
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