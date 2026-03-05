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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const now = new Date()
    let clientSent = 0
    let psychSent = 0

    // ─────────────────────────────────────────────────────────
    // 1. RECORDATORIO AL CLIENTE — 12 horas antes
    //
    //    Ventana: sesiones que empiezan entre ahora+11.5h y ahora+12.5h
    //    1 hora de margen para que el cron de 5 min nunca pierda una sesión
    // ─────────────────────────────────────────────────────────
    const clientFrom = new Date(now.getTime() + 11.5 * 60 * 60 * 1000)
    const clientTo   = new Date(now.getTime() + 12.5 * 60 * 60 * 1000)

    const { data: clientAppts, error: cErr } = await supabase
      .from('appointments')
      .select('id, start_time, patient_id, psychologist_id')
      .in('status', ['pending', 'confirmed'])
      .is('client_reminder_sent_at', null)
      .gte('start_time', clientFrom.toISOString())
      .lte('start_time', clientTo.toISOString())

    if (cErr) console.error('Error fetching client reminders:', cErr)

    for (const appt of clientAppts || []) {
      try {
        // Obtener nombre del cliente
        const { data: clientProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', appt.patient_id)
          .single()

        // Obtener nombre del psicólogo (appointments.psychologist_id → psychologist_profiles.id)
        const { data: psychProfile } = await supabase
          .from('psychologist_profiles')
          .select('first_name, last_name')
          .eq('id', appt.psychologist_id)
          .single()

        const sessionDate = new Date(appt.start_time)
        const psychName = [psychProfile?.first_name, psychProfile?.last_name].filter(Boolean).join(' ') || 'tu psicólogo'

        const { error: sendErr } = await supabase.functions.invoke('send-notification-email', {
          body: {
            notification_type: 'session_reminder',
            recipient_user_id: appt.patient_id,
            variables: {
              recipient_name: clientProfile?.full_name?.split(' ')[0] || 'Hola',
              other_party_name: psychName,
              session_date: sessionDate.toLocaleDateString('es-MX', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }),
              session_time: sessionDate.toLocaleTimeString('es-MX', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              }),
            },
          },
        })

        if (!sendErr) {
          await supabase
            .from('appointments')
            .update({ client_reminder_sent_at: now.toISOString() })
            .eq('id', appt.id)
          clientSent++
          console.log(`✅ Client reminder → appt ${appt.id}`)
        } else {
          console.error(`❌ Client reminder failed → appt ${appt.id}:`, sendErr)
        }
      } catch (err) {
        console.error(`❌ Client reminder error → appt ${appt.id}:`, err)
      }
    }

    // ─────────────────────────────────────────────────────────
    // 2. RECORDATORIO AL PSICÓLOGO — 10 minutos antes
    //
    //    Ventana: sesiones que empiezan entre ahora+5min y ahora+15min
    //    10 minutos de margen para que el cron de 5 min lo capture
    // ─────────────────────────────────────────────────────────
    const psychFrom = new Date(now.getTime() +  5 * 60 * 1000)
    const psychTo   = new Date(now.getTime() + 15 * 60 * 1000)

    const { data: psychAppts, error: pErr } = await supabase
      .from('appointments')
      .select('id, start_time, patient_id, psychologist_id')
      .in('status', ['pending', 'confirmed'])
      .is('psych_reminder_sent_at', null)
      .gte('start_time', psychFrom.toISOString())
      .lte('start_time', psychTo.toISOString())

    if (pErr) console.error('Error fetching psych reminders:', pErr)

    for (const appt of psychAppts || []) {
      try {
        // Obtener user_id del psicólogo (necesario para send-notification-email)
        const { data: psychProfile } = await supabase
          .from('psychologist_profiles')
          .select('user_id, first_name')
          .eq('id', appt.psychologist_id)
          .single()

        if (!psychProfile?.user_id) continue

        // Obtener nombre del paciente
        const { data: clientProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', appt.patient_id)
          .single()

        const sessionDate = new Date(appt.start_time)

        const { error: sendErr } = await supabase.functions.invoke('send-notification-email', {
          body: {
            notification_type: 'session_reminder_soon',
            recipient_user_id: psychProfile.user_id,
            variables: {
              recipient_name: psychProfile.first_name || 'Psicólogo',
              other_party_name: clientProfile?.full_name || 'un paciente',
              session_time: sessionDate.toLocaleTimeString('es-MX', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              }),
            },
          },
        })

        if (!sendErr) {
          await supabase
            .from('appointments')
            .update({ psych_reminder_sent_at: now.toISOString() })
            .eq('id', appt.id)
          psychSent++
          console.log(`✅ Psych reminder → appt ${appt.id}`)
        } else {
          console.error(`❌ Psych reminder failed → appt ${appt.id}:`, sendErr)
        }
      } catch (err) {
        console.error(`❌ Psych reminder error → appt ${appt.id}:`, err)
      }
    }

    // ─────────────────────────────────────────────────────────
    // Resultado
    // ─────────────────────────────────────────────────────────
    const summary = {
      success: true,
      ts: now.toISOString(),
      client: { found: clientAppts?.length || 0, sent: clientSent },
      psych:  { found: psychAppts?.length  || 0, sent: psychSent },
    }
    console.log('📋 Reminders:', JSON.stringify(summary))

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('❌ send-session-reminders error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
