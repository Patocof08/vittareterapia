import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const log = (step: string, data?: unknown) =>
    console.log(`[psychologist-cancel-session] ${step}`, data ?? '')

  try {
    const authHeader = req.headers.get('Authorization')
    log('START', { hasAuth: !!authHeader })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: authHeader ?? '' } },
      }
    )

    // ─── Auth ────────────────────────────────────────────────────────────────
    const { data: { user }, error: authError } = await userSupabase.auth.getUser()
    if (authError || !user) {
      log('AUTH_FAIL', authError?.message)
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }
    log('AUTH_OK', user.id)

    // ─── Body ────────────────────────────────────────────────────────────────
    const body = await req.json()
    const { appointment_id, reason } = body
    log('BODY', { appointment_id, reason })

    if (!appointment_id) {
      return new Response(
        JSON.stringify({ error: 'appointment_id requerido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // ─── Psicólogo ───────────────────────────────────────────────────────────
    const { data: psychProfile, error: psychError } = await supabase
      .from('psychologist_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    log('PSYCH_PROFILE', { id: psychProfile?.id, error: psychError?.message })

    if (!psychProfile) {
      return new Response(
        JSON.stringify({ error: 'No se encontró perfil de psicólogo' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // ─── Cita ────────────────────────────────────────────────────────────────
    const { data: appointment, error: apptError } = await supabase
      .from('appointments')
      .select('id, patient_id, psychologist_id, status, start_time, subscription_id')
      .eq('id', appointment_id)
      .maybeSingle()

    log('APPOINTMENT', { status: appointment?.status, psychologist_id: appointment?.psychologist_id, error: apptError?.message })

    if (!appointment) {
      return new Response(
        JSON.stringify({ error: `Cita no encontrada${apptError ? ': ' + apptError.message : ''}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    if (appointment.psychologist_id !== psychProfile.id) {
      log('OWNERSHIP_FAIL', { appt_psych: appointment.psychologist_id, my_psych: psychProfile.id })
      return new Response(
        JSON.stringify({ error: 'No tienes permiso para cancelar esta cita' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    if (appointment.status === 'cancelled' || appointment.status === 'completed') {
      return new Response(
        JSON.stringify({ error: 'Esta cita ya fue cancelada o completada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const hoursUntil = (new Date(appointment.start_time).getTime() - Date.now()) / (1000 * 60 * 60)
    log('HOURS_UNTIL', hoursUntil)
    if (hoursUntil < 12) {
      return new Response(
        JSON.stringify({ error: 'No se puede cancelar con menos de 12 horas de anticipación' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // ─── Monto ───────────────────────────────────────────────────────────────
    let creditAmount = 0

    if (appointment.subscription_id) {
      const { data: sub, error: subError } = await supabase
        .from('client_subscriptions')
        .select('session_price')
        .eq('id', appointment.subscription_id)
        .maybeSingle()

      log('SUBSCRIPTION', { session_price: sub?.session_price, error: subError?.message })

      if (sub?.session_price) {
        creditAmount = Number(sub.session_price)
      }
    }

    if (creditAmount === 0) {
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('base_amount, amount')
        .eq('appointment_id', appointment_id)
        .maybeSingle()

      log('PAYMENT_FALLBACK', { base_amount: payment?.base_amount, error: paymentError?.message })

      if (payment) {
        creditAmount = Number(payment.base_amount || payment.amount || 0)
      }
    }

    log('CREDIT_AMOUNT', creditAmount)

    // ─── Cancelar ────────────────────────────────────────────────────────────
    const { error: cancelError } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        cancellation_reason: reason || 'Cancelado por psicólogo',
        cancelled_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', appointment_id)

    log('CANCEL', { error: cancelError?.message })
    if (cancelError) throw new Error(`Error al cancelar cita: ${cancelError.message}`)

    // ─── Crédito ─────────────────────────────────────────────────────────────
    if (creditAmount > 0) {
      const expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + 6)

      const { error: creditError } = await supabase
        .from('client_credits')
        .insert({
          client_id: appointment.patient_id,
          psychologist_id: psychProfile.id,
          amount: creditAmount,
          currency: 'MXN',
          reason: reason ? `Sesión cancelada por psicólogo: ${reason}` : 'Sesión cancelada por psicólogo',
          original_appointment_id: appointment_id,
          status: 'available',
          expires_at: expiresAt.toISOString(),
        })

      log('CREDIT', { error: creditError?.message })
      if (creditError) {
        console.error('Credit insert failed (non-fatal):', creditError.message)
      }
    }

    log('SUCCESS', { credit_amount: creditAmount })

    return new Response(
      JSON.stringify({
        success: true,
        message: creditAmount > 0
          ? `Sesión cancelada. Se generó un crédito de $${creditAmount} MXN para el paciente.`
          : 'Sesión cancelada correctamente.',
        credit_amount: creditAmount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    console.error('[psychologist-cancel-session] CATCH:', msg)
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
