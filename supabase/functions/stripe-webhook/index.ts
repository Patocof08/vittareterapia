import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

async function verifyStripeSignature(payload: string, sigHeader: string, secret: string): Promise<boolean> {
  try {
    const parts = sigHeader.split(',')
    const timestamp = parts.find(p => p.startsWith('t='))?.split('=')[1]
    const signature = parts.find(p => p.startsWith('v1='))?.split('=')[1]
    if (!timestamp || !signature) return false
    if (Math.abs(Math.floor(Date.now() / 1000) - parseInt(timestamp)) > 300) return false
    const signedPayload = `${timestamp}.${payload}`
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload))
    const expectedSig = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
    return expectedSig === signature
  } catch { return false }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature' } })
  }

  try {
    const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    if (!STRIPE_WEBHOOK_SECRET) throw new Error('STRIPE_WEBHOOK_SECRET not configured')

    const body = await req.text()
    const sigHeader = req.headers.get('stripe-signature') ?? ''
    const isValid = await verifyStripeSignature(body, sigHeader, STRIPE_WEBHOOK_SECRET)
    if (!isValid) return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 })

    const event = JSON.parse(body)
    console.log('Stripe event:', event.type, event.id)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // ============================================================
    // PAYMENT_INTENT.SUCCEEDED — Single session payments only
    // ============================================================
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object
      if (pi.invoice) return new Response(JSON.stringify({ received: true }), { status: 200 })

      const { data: payment } = await supabase.from('payments').select('*').eq('processor_payment_id', pi.id).single()
      if (!payment || payment.payment_status === 'completed') return new Response(JSON.stringify({ received: true }), { status: 200 })

      const baseAmount = Number(payment.base_amount)
      const platformFee = Number(payment.platform_fee)
      let apptData: any = null
      try { apptData = payment.transaction_reference ? JSON.parse(payment.transaction_reference) : null } catch {}

      if (platformFee > 0) {
        const { data: aw } = await supabase.from('admin_wallet').select('id, balance').single()
        const before = Number(aw?.balance ?? 0)
        await supabase.from('admin_wallet').update({ balance: before + platformFee, updated_at: new Date().toISOString() }).eq('id', aw!.id)
        await supabase.from('wallet_transactions').insert({
          transaction_type: 'platform_fee', transaction_category: 'platform_fee', wallet_type: 'admin',
          payment_id: payment.id, psychologist_id: payment.psychologist_id,
          amount: platformFee, balance_before: before, balance_after: before + platformFee,
          description: `Cargo por servicio (${(Number(payment.platform_fee_rate) * 100).toFixed(0)}%) - ${payment.description}`,
        })
      }

      let appointmentId = null
      if (apptData?.appointment_start_time) {
        const { data: appt } = await supabase.from('appointments').insert({
          patient_id: payment.client_id, psychologist_id: payment.psychologist_id,
          start_time: apptData.appointment_start_time, end_time: apptData.appointment_end_time,
          status: 'pending', modality: 'Videollamada',
        }).select().single()
        if (appt) {
          appointmentId = appt.id
          await supabase.from('deferred_revenue').insert({
            psychologist_id: payment.psychologist_id, appointment_id: appointmentId,
            payment_id: payment.id, total_amount: baseAmount, deferred_amount: baseAmount, recognized_amount: 0,
          })
        }
      }

      await supabase.from('payments').update({ payment_status: 'completed', completed_at: new Date().toISOString(), appointment_id: appointmentId }).eq('id', payment.id)
      await supabase.from('invoices').insert({ payment_id: payment.id, client_id: payment.client_id, psychologist_id: payment.psychologist_id, amount: Number(payment.amount), invoice_number: `INV-${Date.now()}` })
      console.log('Single session processed:', payment.id)
    }

    // ============================================================
    // INVOICE.PAID — Subscription payments (initial + renewals)
    // ============================================================
    else if (event.type === 'invoice.paid') {
      const invoice = event.data.object
      const stripeSubId = invoice.subscription
      if (!stripeSubId) return new Response(JSON.stringify({ received: true }), { status: 200 })

      const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!
      const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${stripeSubId}`, { headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` } })
      const stripeSub = await subRes.json()
      const meta = stripeSub.metadata || {}

      const userId = meta.supabase_user_id
      const psychologistId = meta.psychologist_id
      const packageType = meta.package_type
      const baseAmount = Number(meta.base_amount || 0)
      const platformFee = Number(meta.platform_fee || 0)
      const totalAmount = baseAmount + platformFee
      const feeRate = Number(meta.platform_fee_rate || 0.05)
      const sessionsTotal = Number(meta.sessions_total || (packageType === 'package_4' ? 4 : 8))
      const discountPercentage = Number(meta.discount_percentage || 0)
      const sessionPrice = Number(meta.session_price || 0)

      if (!userId || !psychologistId) {
        console.error('Missing metadata on subscription:', stripeSubId)
        return new Response(JSON.stringify({ received: true }), { status: 200 })
      }

      // ── First payment ──
      if (invoice.billing_reason === 'subscription_create') {
        const { data: payment } = await supabase.from('payments').select('*').eq('processor_payment_id', invoice.payment_intent).single()
        if (!payment || payment.payment_status === 'completed') return new Response(JSON.stringify({ received: true }), { status: 200 })

        if (platformFee > 0) {
          const { data: aw } = await supabase.from('admin_wallet').select('id, balance').single()
          const before = Number(aw?.balance ?? 0)
          await supabase.from('admin_wallet').update({ balance: before + platformFee, updated_at: new Date().toISOString() }).eq('id', aw!.id)
          await supabase.from('wallet_transactions').insert({
            transaction_type: 'platform_fee', transaction_category: 'platform_fee', wallet_type: 'admin',
            payment_id: payment.id, psychologist_id: psychologistId,
            amount: platformFee, balance_before: before, balance_after: before + platformFee,
            description: `Cargo por servicio (${(feeRate * 100).toFixed(0)}%) - ${payment.description}`,
          })
        }

        let apptData: any = null
        try { apptData = payment.transaction_reference ? JSON.parse(payment.transaction_reference) : null } catch {}

        const periodStart = new Date()
        const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

        const { data: sub } = await supabase.from('client_subscriptions').insert({
          client_id: userId, psychologist_id: psychologistId,
          package_type: packageType === 'package_4' ? '4_sessions' : '8_sessions',
          session_price: sessionPrice, discount_percentage: discountPercentage,
          sessions_total: sessionsTotal, sessions_used: 0, sessions_remaining: sessionsTotal,
          rollover_sessions: 0, status: 'active', auto_renew: true,
          current_period_start: periodStart.toISOString(), current_period_end: periodEnd.toISOString(),
          next_billing_date: periodEnd.toISOString(), stripe_subscription_id: stripeSubId, stripe_invoice_id: invoice.id,
        }).select().single()
        if (!sub) throw new Error('Failed to create subscription')

        await supabase.from('deferred_revenue').insert({
          psychologist_id: psychologistId, subscription_id: sub.id, payment_id: payment.id,
          total_amount: baseAmount, deferred_amount: baseAmount, recognized_amount: 0,
          sessions_total: sessionsTotal, sessions_recognized: 0,
          price_per_session: Math.round((baseAmount / sessionsTotal) * 100) / 100,
        })

        let appointmentId = null
        if (apptData?.appointment_start_time) {
          const { data: appt } = await supabase.from('appointments').insert({
            patient_id: userId, psychologist_id: psychologistId,
            start_time: apptData.appointment_start_time, end_time: apptData.appointment_end_time,
            status: 'pending', modality: 'Videollamada', subscription_id: sub.id,
          }).select().single()
          if (appt) {
            appointmentId = appt.id
            await supabase.from('client_subscriptions').update({ sessions_used: 1, sessions_remaining: sessionsTotal - 1 }).eq('id', sub.id)
          }
        }

        await supabase.from('psychologist_wallets').upsert({ psychologist_id: psychologistId, balance: 0 }, { onConflict: 'psychologist_id', ignoreDuplicates: true })
        await supabase.from('payments').update({ payment_status: 'completed', completed_at: new Date().toISOString(), subscription_id: sub.id, appointment_id: appointmentId }).eq('id', payment.id)
        await supabase.from('invoices').insert({ payment_id: payment.id, client_id: userId, psychologist_id: psychologistId, amount: totalAmount, invoice_number: `INV-${Date.now()}` })
        console.log('Subscription created:', sub.id, 'stripe:', stripeSubId)
      }

      // ── Renewal ──
      else if (invoice.billing_reason === 'subscription_cycle') {
        const { data: existingSub } = await supabase.from('client_subscriptions').select('*').eq('stripe_subscription_id', stripeSubId).single()
        if (!existingSub) return new Response(JSON.stringify({ received: true }), { status: 200 })

        const { data: rolloverResult } = await supabase.rpc('calculate_rollover_sessions', { _sessions_total: existingSub.sessions_total, _sessions_used: existingSub.sessions_used })
        const rolloverSessions = rolloverResult ?? 0

        const { data: payment } = await supabase.from('payments').insert({
          client_id: userId, psychologist_id: psychologistId,
          base_amount: baseAmount, platform_fee_rate: feeRate, platform_fee: platformFee, amount: totalAmount,
          payment_type: packageType, payment_status: 'completed', payment_method: 'stripe', processor: 'stripe',
          processor_payment_id: invoice.payment_intent, subscription_id: existingSub.id,
          description: `Renovación: ${packageType === 'package_4' ? 'Paquete 4' : 'Paquete 8'} sesiones`,
          completed_at: new Date().toISOString(),
        }).select().single()

        if (platformFee > 0) {
          const { data: aw } = await supabase.from('admin_wallet').select('id, balance').single()
          const before = Number(aw?.balance ?? 0)
          await supabase.from('admin_wallet').update({ balance: before + platformFee, updated_at: new Date().toISOString() }).eq('id', aw!.id)
          await supabase.from('wallet_transactions').insert({
            transaction_type: 'platform_fee', transaction_category: 'platform_fee', wallet_type: 'admin',
            payment_id: payment?.id, psychologist_id: psychologistId,
            amount: platformFee, balance_before: before, balance_after: before + platformFee,
            description: `Cargo por servicio renovación (${(feeRate * 100).toFixed(0)}%)`,
          })
        }

        await supabase.from('deferred_revenue').insert({
          psychologist_id: psychologistId, subscription_id: existingSub.id, payment_id: payment?.id,
          total_amount: baseAmount, deferred_amount: baseAmount, recognized_amount: 0,
          sessions_total: sessionsTotal, sessions_recognized: 0,
          price_per_session: Math.round((baseAmount / sessionsTotal) * 100) / 100,
        })

        const newPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        await supabase.from('client_subscriptions').update({
          sessions_used: 0, sessions_remaining: sessionsTotal + rolloverSessions, rollover_sessions: rolloverSessions,
          current_period_start: new Date().toISOString(), current_period_end: newPeriodEnd.toISOString(),
          next_billing_date: newPeriodEnd.toISOString(), stripe_invoice_id: invoice.id,
          status: 'active', updated_at: new Date().toISOString(),
        }).eq('id', existingSub.id)

        await supabase.from('invoices').insert({ payment_id: payment?.id, client_id: userId, psychologist_id: psychologistId, amount: totalAmount, invoice_number: `INV-R-${Date.now()}` })
        console.log('Subscription renewed:', existingSub.id, 'rollover:', rolloverSessions)
      }
    }

    else if (event.type === 'invoice.payment_failed') {
      const inv = event.data.object
      if (inv.subscription) {
        const { data: sub } = await supabase.from('client_subscriptions').select('id').eq('stripe_subscription_id', inv.subscription).single()
        if (sub) await supabase.from('client_subscriptions').update({ status: 'payment_failed', updated_at: new Date().toISOString() }).eq('id', sub.id)
      }
    }

    else if (event.type === 'customer.subscription.deleted') {
      const { data: sub } = await supabase.from('client_subscriptions').select('id').eq('stripe_subscription_id', event.data.object.id).single()
      if (sub) await supabase.from('client_subscriptions').update({ status: 'expired', auto_renew: false, updated_at: new Date().toISOString() }).eq('id', sub.id)
    }

    else if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object
      if (!pi.invoice) await supabase.from('payments').update({ payment_status: 'failed' }).eq('processor_payment_id', pi.id)
    }

    return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' }, status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ received: true }), { status: 200 })
  }
})
