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
    const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY')
    if (!DAILY_API_KEY) throw new Error('DAILY_API_KEY not configured')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Auth check
    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 })
    }

    const { appointment_id } = await req.json()
    if (!appointment_id) {
      return new Response(JSON.stringify({ error: 'appointment_id requerido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    // Get appointment with psychologist info for auth check
    const { data: appointment } = await supabase
      .from('appointments')
      .select('id, patient_id, psychologist_id, daily_room_name, psychologist:psychologist_profiles(user_id)')
      .eq('id', appointment_id)
      .single()

    if (!appointment) {
      return new Response(JSON.stringify({ error: 'Cita no encontrada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 })
    }

    const isPatient = appointment.patient_id === user.id
    const isPsychologist = (appointment.psychologist as any)?.user_id === user.id
    if (!isPatient && !isPsychologist) {
      return new Response(JSON.stringify({ error: 'Sin acceso' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 })
    }

    const roomName = appointment.daily_room_name
    if (!roomName) {
      return new Response(JSON.stringify({ status: 'no_room', message: 'Esta cita no tiene sala de video' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    // Query Daily.co for transcripts associated with this room
    const listRes = await fetch(
      `https://api.daily.co/v1/transcript?roomName=${encodeURIComponent(roomName)}&limit=5`,
      { headers: { Authorization: 'Bearer ' + DAILY_API_KEY } }
    )
    const listData = await listRes.json()
    console.log('Daily transcript list:', JSON.stringify(listData))

    const transcripts = listData.data || listData.transcripts || []

    if (transcripts.length === 0) {
      // No transcript found yet — mark as pending in our DB
      await supabase
        .from('session_transcripts')
        .upsert({
          appointment_id: appointment.id,
          psychologist_id: appointment.psychologist_id,
          patient_id: appointment.patient_id,
          status: 'pending',
          language: 'es',
          error_message: 'Transcripción aún no disponible en Daily.co',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'appointment_id' })

      return new Response(JSON.stringify({ status: 'pending', message: 'Transcripción aún no lista' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    // Take the most recent transcript
    const latest = transcripts[0]
    const transcriptId = latest.id || latest.transcriptId

    console.log('Found transcript:', transcriptId)

    // Get access link
    const linkRes = await fetch(
      `https://api.daily.co/v1/transcript/${transcriptId}/access-link`,
      { headers: { Authorization: 'Bearer ' + DAILY_API_KEY } }
    )
    const linkData = await linkRes.json()
    console.log('Access link response:', JSON.stringify(linkData))

    if (!linkData.link) {
      return new Response(
        JSON.stringify({ status: 'pending', message: 'Enlace de transcripción no disponible aún', detail: linkData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Download VTT
    const vttRes = await fetch(linkData.link)
    const vttText = await vttRes.text()
    const plainText = parseVttToText(vttText)
    const wordCount = plainText.split(/\s+/).filter(Boolean).length

    // Upsert transcript record
    const { error: upsertErr } = await supabase
      .from('session_transcripts')
      .upsert({
        appointment_id: appointment.id,
        psychologist_id: appointment.psychologist_id,
        patient_id: appointment.patient_id,
        transcript_raw: vttText,
        transcript_format: 'webvtt',
        word_count: wordCount,
        status: 'completed',
        language: 'es',
        error_message: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'appointment_id' })

    if (upsertErr) throw upsertErr

    // Also save transcript_id on appointment
    await supabase
      .from('appointments')
      .update({ daily_transcript_id: transcriptId })
      .eq('id', appointment_id)

    console.log('Transcript saved, words:', wordCount)

    return new Response(
      JSON.stringify({ status: 'completed', word_count: wordCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('fetch-session-transcript error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function parseVttToText(vtt: string): string {
  const lines = vtt.split('\n')
  const textLines: string[] = []
  let currentSpeaker = ''
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed === 'WEBVTT' || trimmed.includes('-->') || /^\d+$/.test(trimmed)) continue
    const speakerMatch = trimmed.match(/<v\s+([^>]+)>(.*)$/)
    if (speakerMatch) {
      const speaker = speakerMatch[1]
      const text = speakerMatch[2].replace(/<\/v>/g, '').trim()
      if (speaker !== currentSpeaker) {
        currentSpeaker = speaker
        textLines.push('\n' + speaker + ':')
      }
      if (text) textLines.push(text)
    } else if (!trimmed.startsWith('<') && !trimmed.startsWith('NOTE')) {
      textLines.push(trimmed)
    }
  }
  return textLines.join(' ').replace(/\s+/g, ' ').trim()
}
