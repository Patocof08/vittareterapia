import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')

    // Cliente con service role para escritura
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Cliente con JWT del usuario para verificar identidad
    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: authHeader ?? '' } },
      }
    )

    const { data: { user }, error: authError } = await userSupabase.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const { appointment_id, reason } = await req.json()

    if (!appointment_id) {
      return new Response(
        JSON.stringify({ error: 'appointment_id requerido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // ─── 1. Verificar que el usuario es el psicólogo de esta cita ─────────────
    const { data: psychProfile } = await supabase
      .from('psychologist_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!psychProfile) {
      return new Response(
        JSON.stringify({ error: 'No se encontró perfil de psicólogo' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    const { data: appointment } = await supabase
      .from('appointments')
      .select('id, patient_id, psychologist_id, status, start_time, subscription_id')
      .eq('id', appointment_id)
      .single()

    if (!appointment) {
      return new Response(
        JSON.stringify({ error: 'Cita no encontrada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    if (appointment.psychologist_id !== psychProfile.id) {
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

    // Belt-and-suspenders: verificar > 12h desde el servidor también
    const hoursUntil = (new Date(appointment.start_time).getTime() - Date.now()) / (1000 * 60 * 60)
    if (hoursUntil < 12) {
      return new Response(
        JSON.stringify({ error: 'No se puede cancelar con menos de 12 horas de anticipación' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // ─── 2. Obtener monto pagado ──────────────────────────────────────────────
    let creditAmount = 0

    // Primero buscar en deferred_revenue (cubre paquetes y sesiones individuales)
    const { data: deferred } = await supabase
      .from('deferred_revenue')
      .select('price_per_session')
      .eq('appointment_id', appointment_id)
      .maybeSingle()

    if (deferred?.price_per_session) {
      creditAmount = Number(deferred.price_per_session)
    } else {
      // Fallback: buscar en payments directamente
      const { data: payment } = await supabase
        .from('payments')
        .select('base_amount, amount')
        .eq('appointment_id', appointment_id)
        .maybeSingle()

      if (payment) {
        creditAmount = Number(payment.base_amount || payment.amount || 0)
      }
    }

    // ─── 3. Cancelar la cita ─────────────────────────────────────────────────
    const { error: cancelError } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        cancellation_reason: reason || 'Cancelado por psicólogo',
        cancelled_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', appointment_id)

    if (cancelError) throw cancelError

    // ─── 4. Crear crédito para el cliente ────────────────────────────────────
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
          reason: reason
            ? `Sesión cancelada por psicólogo: ${reason}`
            : 'Sesión cancelada por psicólogo',
          original_appointment_id: appointment_id,
          status: 'available',
          expires_at: expiresAt.toISOString(),
        })

      if (creditError) {
        console.error('Error creating credit (appointment already cancelled):', creditError)
        // La cita ya fue cancelada — no revertimos, solo logueamos
      }
    }

    console.log('Psychologist cancelled appointment:', {
      appointment_id,
      psychologist_id: psychProfile.id,
      patient_id: appointment.patient_id,
      credit_amount: creditAmount,
    })

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
    console.error('psychologist-cancel-session error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
