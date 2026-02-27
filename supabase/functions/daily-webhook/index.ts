import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }})
  }

  try {
    const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY')
    if (!DAILY_API_KEY) throw new Error('DAILY_API_KEY not configured')

    const body = await req.json()
    const eventType = body.type
    console.log('Daily webhook event:', eventType)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // ============================================================
    // TRANSCRIPT READY (Daily.co uses 'transcript.' prefix, not 'transcription.')
    // ============================================================
    if (eventType === 'transcript.ready-to-download' || eventType === 'transcript.stopped') {
      const roomName = body.room_name || body.payload?.room_name
      const transcriptId = body.transcript_id || body.payload?.transcript_id

      if (!roomName || !transcriptId) {
        console.log('Missing room_name or transcript_id')
        return new Response(JSON.stringify({ received: true }), { status: 200 })
      }

      console.log('Transcript ready:', transcriptId, 'room:', roomName)

      // Find appointment by room name
      const { data: appointment } = await supabase
        .from('appointments')
        .select('id, psychologist_id, patient_id, daily_room_name')
        .eq('daily_room_name', roomName)
        .single()

      if (!appointment) {
        console.error('No appointment found for room:', roomName)
        return new Response(JSON.stringify({ received: true }), { status: 200 })
      }

      // Save transcript_id on appointment
      await supabase
        .from('appointments')
        .update({ daily_transcript_id: transcriptId })
        .eq('id', appointment.id)

      // Upsert transcript record (idempotent)
      const { data: existing } = await supabase
        .from('session_transcripts')
        .select('id')
        .eq('appointment_id', appointment.id)
        .maybeSingle()

      let transcriptRecordId: string

      if (existing) {
        transcriptRecordId = existing.id
        await supabase
          .from('session_transcripts')
          .update({ status: 'transcribing', updated_at: new Date().toISOString() })
          .eq('id', existing.id)
      } else {
        const { data: inserted } = await supabase
          .from('session_transcripts')
          .insert({
            appointment_id: appointment.id,
            psychologist_id: appointment.psychologist_id,
            patient_id: appointment.patient_id,
            status: 'transcribing',
            language: 'es',
          })
          .select('id')
          .single()

        if (!inserted) {
          console.error('Failed to create transcript record')
          return new Response(JSON.stringify({ received: true }), { status: 200 })
        }
        transcriptRecordId = inserted.id
      }

      // Fetch transcript download link from Daily
      const linkRes = await fetch(
        `https://api.daily.co/v1/transcript/${transcriptId}/access-link`,
        { headers: { Authorization: 'Bearer ' + DAILY_API_KEY } }
      )
      const linkData = await linkRes.json()

      if (linkData.link) {
        const vttRes = await fetch(linkData.link)
        const vttText = await vttRes.text()

        const plainText = parseVttToText(vttText)
        const wordCount = plainText.split(/\s+/).filter(Boolean).length

        await supabase
          .from('session_transcripts')
          .update({
            transcript_raw: vttText,
            transcript_format: 'webvtt',
            word_count: wordCount,
            status: 'completed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', transcriptRecordId)

        console.log('Transcript saved:', transcriptRecordId, 'words:', wordCount)
      } else {
        console.error('No transcript link yet:', JSON.stringify(linkData))
        await supabase
          .from('session_transcripts')
          .update({
            status: 'pending',
            error_message: 'Transcript link not available yet',
            updated_at: new Date().toISOString(),
          })
          .eq('id', transcriptRecordId)
      }
    }

    // ============================================================
    // RECORDING READY
    // ============================================================
    else if (eventType === 'recording.ready-to-download') {
      const roomName = body.room_name || body.payload?.room_name
      const recordingId = body.recording_id || body.payload?.recording_id

      if (roomName && recordingId) {
        await supabase
          .from('appointments')
          .update({ daily_recording_id: recordingId })
          .eq('daily_room_name', roomName)

        console.log('Recording ID saved:', recordingId, 'room:', roomName)
      }
    }

    // ============================================================
    // MEETING ENDED — update transcript duration
    // ============================================================
    else if (eventType === 'meeting.ended') {
      const roomName = body.room_name || body.payload?.room_name
      if (roomName) {
        const { data: appt } = await supabase
          .from('appointments')
          .select('id')
          .eq('daily_room_name', roomName)
          .single()

        if (appt) {
          const durationSeconds = body.payload?.duration || 0
          const durationMinutes = Math.round(durationSeconds / 60)

          await supabase
            .from('session_transcripts')
            .update({
              duration_minutes: durationMinutes,
              updated_at: new Date().toISOString(),
            })
            .eq('appointment_id', appt.id)

          console.log('Meeting ended:', roomName, 'duration:', durationMinutes, 'min')
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Daily webhook error:', error)
    // Always return 200 so Daily doesn't retry
    return new Response(JSON.stringify({ received: true }), { status: 200 })
  }
})

function parseVttToText(vtt: string): string {
  const lines = vtt.split('\n')
  const textLines: string[] = []
  let currentSpeaker = ''

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed === 'WEBVTT' || trimmed.includes('-->') || /^\d+$/.test(trimmed)) {
      continue
    }
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
