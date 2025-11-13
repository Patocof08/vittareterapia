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

    console.log('🔍 Buscando créditos expirados...');

    // Buscar créditos que ya expiraron y están disponibles
    const { data: expiredCredits, error: fetchError } = await supabase
      .from('client_credits')
      .select('id, amount, client_id, expires_at')
      .eq('status', 'available')
      .lte('expires_at', new Date().toISOString());

    if (fetchError) {
      console.error('❌ Error buscando créditos:', fetchError);
      throw fetchError;
    }

    if (!expiredCredits || expiredCredits.length === 0) {
      console.log('✅ No hay créditos expirados');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No hay créditos expirados',
          expired_count: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Encontrados ${expiredCredits.length} créditos expirados`);

    // Expirar cada crédito
    const results = [];
    for (const credit of expiredCredits) {
      console.log(`⏰ Expirando crédito ${credit.id} de $${credit.amount}`);
      
      const { error: expireError } = await supabase.rpc('expire_client_credit', {
        _credit_id: credit.id
      });

      if (expireError) {
        console.error(`❌ Error expirando crédito ${credit.id}:`, expireError);
        results.push({ 
          credit_id: credit.id, 
          success: false, 
          error: expireError.message 
        });
      } else {
        console.log(`✅ Crédito ${credit.id} expirado exitosamente`);
        results.push({ 
          credit_id: credit.id, 
          success: true, 
          amount: credit.amount 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Proceso completado: ${successCount}/${expiredCredits.length} créditos expirados`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        expired_count: successCount,
        total_found: expiredCredits.length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error en el proceso de expiración:', error);
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
