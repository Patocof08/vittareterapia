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
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
    if (!STRIPE_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: 'Stripe not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Auth: verify the user calling this
    const authHeader = req.headers.get('Authorization')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Also create a client with the user's JWT to verify identity
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

    const { appointment_id, payment_id } = await req.json()

    if (!appointment_id) {
      return new Response(
        JSON.stringify({ error: 'appointment_id requerido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // ─────────────────────────────────────────────────
    // 1. Verificar que la cita pertenece al usuario
    // ─────────────────────────────────────────────────
    const { data: appointment } = await supabase
      .from('appointments')
      .select('id, patient_id, psychologist_id, status, start_time')
      .eq('id', appointment_id)
      .single()

    if (!appointment) {
      return new Response(
        JSON.stringify({ error: 'Cita no encontrada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    if (appointment.patient_id !== user.id) {
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

    // Verificar que faltan > 24h (política de cancelación)
    const hoursUntil = (new Date(appointment.start_time).getTime() - Date.now()) / (1000 * 60 * 60)
    if (hoursUntil < 24) {
      return new Response(
        JSON.stringify({ error: 'No se puede reembolsar con menos de 24 horas de anticipación' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // ─────────────────────────────────────────────────
    // 2. Obtener el pago asociado
    // ─────────────────────────────────────────────────
    let paymentQuery = supabase
      .from('payments')
      .select('id, processor_payment_id, amount, platform_fee, payment_status, base_amount')

    if (payment_id) {
      paymentQuery = paymentQuery.eq('id', payment_id)
    } else {
      paymentQuery = paymentQuery.eq('appointment_id', appointment_id)
    }

    const { data: payment } = await paymentQuery.maybeSingle()

    if (!payment) {
      return new Response(
        JSON.stringify({ error: 'No se encontró pago asociado a esta cita' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    if (payment.payment_status === 'refunded') {
      return new Response(
        JSON.stringify({ error: 'Este pago ya fue reembolsado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!payment.processor_payment_id) {
      return new Response(
        JSON.stringify({ error: 'No se puede reembolsar: sin referencia de pago en Stripe' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // ─────────────────────────────────────────────────
    // 3. Llamar a Stripe para reembolsar
    // ─────────────────────────────────────────────────
    const refundResponse = await fetch('https://api.stripe.com/v1/refunds', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        payment_intent: payment.processor_payment_id,
        // Reembolso total — Stripe calcula el monto del PI automáticamente
      }),
    })

    const refundData = await refundResponse.json()

    if (!refundResponse.ok || refundData.error) {
      console.error('Stripe refund error:', JSON.stringify(refundData))
      return new Response(
        JSON.stringify({
          error: 'Error al procesar el reembolso en Stripe',
          details: refundData.error?.message || 'Unknown Stripe error',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      )
    }

    console.log('Stripe refund created:', refundData.id, 'amount:', refundData.amount)

    // ─────────────────────────────────────────────────
    // 4. Actualizar DB — usar el RPC existente + extras
    // ─────────────────────────────────────────────────

    // 4a. Llamar al RPC que maneja deferred_revenue + cancela la cita
    const { error: rpcError } = await supabase.rpc('cancel_session_with_refund', {
      _appointment_id: appointment_id,
      _payment_id: payment.id,
    })
    if (rpcError) {
      console.error('RPC error (refund already processed in Stripe):', rpcError)
      // No retornamos error — el reembolso en Stripe ya se hizo
    }

    // 4b. Guardar stripe_refund_id y refunded_at
    await supabase
      .from('payments')
      .update({
        stripe_refund_id: refundData.id,
        refunded_at: new Date().toISOString(),
      })
      .eq('id', payment.id)

    // 4c. Reversar platform_fee del admin wallet
    const platformFee = Number(payment.platform_fee || 0)
    if (platformFee > 0) {
      const { data: aw } = await supabase
        .from('admin_wallet')
        .select('id, balance')
        .single()

      if (aw) {
        const before = Number(aw.balance)
        const after = before - platformFee

        await supabase
          .from('admin_wallet')
          .update({ balance: after, updated_at: new Date().toISOString() })
          .eq('id', aw.id)

        await supabase.from('wallet_transactions').insert({
          transaction_type: 'refund',
          transaction_category: 'platform_fee',
          wallet_type: 'admin',
          payment_id: payment.id,
          psychologist_id: appointment.psychologist_id,
          amount: -platformFee,
          balance_before: before,
          balance_after: after,
          description: `Devolución cargo por servicio — Reembolso ${refundData.id}`,
        })
      }
    }

    // 4d. Si ya se reconoció revenue (sesión completada), reversar wallets
    // Esto es edge case — normalmente el reembolso es ANTES de la sesión
    const { data: revenueTransactions } = await supabase
      .from('wallet_transactions')
      .select('id, wallet_type, amount, psychologist_id')
      .eq('appointment_id', appointment_id)
      .eq('transaction_type', 'session_completed')

    if (revenueTransactions && revenueTransactions.length > 0) {
      for (const tx of revenueTransactions) {
        const amount = Number(tx.amount)
        if (tx.wallet_type === 'admin') {
          const { data: aw } = await supabase.from('admin_wallet').select('id, balance').single()
          if (aw) {
            const b = Number(aw.balance)
            await supabase.from('admin_wallet').update({ balance: b - amount }).eq('id', aw.id)
            await supabase.from('wallet_transactions').insert({
              transaction_type: 'refund', transaction_category: 'session_commission',
              wallet_type: 'admin', payment_id: payment.id, appointment_id,
              psychologist_id: tx.psychologist_id,
              amount: -amount, balance_before: b, balance_after: b - amount,
              description: `Reversión comisión 15% — Reembolso ${refundData.id}`,
            })
          }
        } else if (tx.wallet_type === 'psychologist') {
          const { data: pw } = await supabase
            .from('psychologist_wallets')
            .select('balance')
            .eq('psychologist_id', tx.psychologist_id)
            .single()
          if (pw) {
            const b = Number(pw.balance)
            await supabase.from('psychologist_wallets')
              .update({ balance: b - amount })
              .eq('psychologist_id', tx.psychologist_id)
            await supabase.from('wallet_transactions').insert({
              transaction_type: 'refund', transaction_category: 'session_commission',
              wallet_type: 'psychologist', payment_id: payment.id, appointment_id,
              psychologist_id: tx.psychologist_id,
              amount: -amount, balance_before: b, balance_after: b - amount,
              description: `Reversión pago sesión 85% — Reembolso ${refundData.id}`,
            })
          }
        }
      }
    }

    console.log('Refund complete:', {
      stripe_refund: refundData.id,
      payment_id: payment.id,
      appointment_id,
      amount: refundData.amount / 100,
    })

    return new Response(
      JSON.stringify({
        success: true,
        stripe_refund_id: refundData.id,
        amount_refunded: refundData.amount / 100,
        currency: refundData.currency,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('process-refund error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
