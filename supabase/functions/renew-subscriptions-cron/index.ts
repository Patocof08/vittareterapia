import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔄 Iniciando proceso de renovación de suscripciones...');

    const today = new Date().toISOString().split('T')[0];

    // Buscar suscripciones que deben renovarse hoy
    const { data: subsToRenew, error: fetchError } = await supabase
      .from('client_subscriptions')
      .select(`
        id,
        client_id,
        psychologist_id,
        package_type,
        session_price,
        discount_percentage,
        sessions_total,
        sessions_used,
        sessions_remaining,
        current_period_start,
        current_period_end,
        next_billing_date,
        auto_renew
      `)
      .eq('status', 'active')
      .eq('auto_renew', true)
      .lte('next_billing_date', today);

    if (fetchError) {
      console.error('❌ Error buscando suscripciones:', fetchError);
      throw fetchError;
    }

    if (!subsToRenew || subsToRenew.length === 0) {
      console.log('✅ No hay suscripciones para renovar hoy');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No hay suscripciones para renovar',
          renewed_count: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Encontradas ${subsToRenew.length} suscripciones para renovar`);

    const results = [];

    for (const sub of subsToRenew) {
      console.log(`\n💳 Procesando suscripción ${sub.id} (${sub.package_type})`);
      
      try {
        // 1. Calcular rollover (25% de sesiones no usadas)
        const unusedSessions = sub.sessions_remaining;
        let rolloverSessions = 0;
        
        if (unusedSessions > 0) {
          const maxRollover = Math.round(sub.sessions_total * 0.25);
          rolloverSessions = Math.min(unusedSessions, maxRollover);
          console.log(`🔄 Rollover calculado: ${rolloverSessions} sesiones (${unusedSessions} sin usar, max ${maxRollover})`);
        }

        // 2. Calcular monto total del nuevo período
        const totalAmount = sub.session_price * sub.sessions_total;
        const discountedAmount = sub.discount_percentage > 0 
          ? totalAmount * (1 - sub.discount_percentage / 100)
          : totalAmount;

        console.log(`💰 Monto a cobrar: $${discountedAmount} (${sub.sessions_total} sesiones)`);

        // 3. Crear payment record
        const { data: payment, error: paymentError } = await supabase
          .from('payments')
          .insert({
            client_id: sub.client_id,
            psychologist_id: sub.psychologist_id,
            subscription_id: sub.id,
            base_amount: discountedAmount,
            platform_fee: 0,
            platform_fee_rate: 0,
            amount: discountedAmount,
            payment_type: 'subscription_renewal',
            payment_status: 'completed',
            payment_method: 'recurring',
            description: `Renovación ${sub.package_type} - Período ${new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}`,
            completed_at: new Date().toISOString()
          })
          .select()
          .single();

        if (paymentError) {
          console.error(`❌ Error creando payment:`, paymentError);
          throw paymentError;
        }

        console.log(`✅ Payment creado: ${payment.id}`);

        // 4. Procesar el pago (crear ingreso diferido)
        const { error: processError } = await supabase.rpc('recalculate_package_financials', {
          _subscription_id: sub.id,
          _payment_id: payment.id,
          _psychologist_id: sub.psychologist_id,
          _total_amount: discountedAmount,
          _sessions_total: sub.sessions_total,
          _discount_percentage: sub.discount_percentage || 0
        });

        if (processError) {
          console.error(`❌ Error procesando financials:`, processError);
          throw processError;
        }

        console.log(`✅ Ingreso diferido creado`);

        // 5. Actualizar suscripción con nuevo período y rollover
        const newPeriodStart = new Date();
        const newPeriodEnd = new Date();
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
        const newBillingDate = new Date(newPeriodEnd);

        const newSessionsTotal = sub.sessions_total + rolloverSessions;

        const { error: updateError } = await supabase
          .from('client_subscriptions')
          .update({
            sessions_used: 0,
            sessions_remaining: newSessionsTotal,
            rollover_sessions: rolloverSessions,
            current_period_start: newPeriodStart.toISOString(),
            current_period_end: newPeriodEnd.toISOString(),
            next_billing_date: newBillingDate.toISOString()
          })
          .eq('id', sub.id);

        if (updateError) {
          console.error(`❌ Error actualizando suscripción:`, updateError);
          throw updateError;
        }

        console.log(`✅ Suscripción actualizada: ${newSessionsTotal} sesiones totales (${rolloverSessions} rollover)`);

        // 6. Registrar en historial
        const { error: historyError } = await supabase
          .from('subscription_history')
          .insert({
            subscription_id: sub.id,
            event_type: 'renewal',
            sessions_added: newSessionsTotal,
            rollover_amount: rolloverSessions,
            amount_charged: discountedAmount,
            notes: `Renovación automática. Período: ${newPeriodStart.toLocaleDateString('es-MX')} - ${newPeriodEnd.toLocaleDateString('es-MX')}`
          });

        if (historyError) {
          console.error(`⚠️ Error registrando historial:`, historyError);
          // No lanzar error, solo log
        }

        console.log(`✅ Suscripción ${sub.id} renovada exitosamente`);
        
        results.push({
          subscription_id: sub.id,
          success: true,
          amount: discountedAmount,
          sessions_total: newSessionsTotal,
          rollover: rolloverSessions
        });

      } catch (subError) {
        console.error(`❌ Error renovando suscripción ${sub.id}:`, subError);
        results.push({
          subscription_id: sub.id,
          success: false,
          error: subError instanceof Error ? subError.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`\n✅ Proceso completado: ${successCount}/${subsToRenew.length} suscripciones renovadas`);

    return new Response(
      JSON.stringify({
        success: true,
        renewed_count: successCount,
        total_found: subsToRenew.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error en el proceso de renovación:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
