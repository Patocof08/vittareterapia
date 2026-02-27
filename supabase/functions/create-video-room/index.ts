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

    // Get appointment + psychologist profile (user_id needed for role detection)
    // NOTE: psychologist_id in appointments = psychologist_profiles.id, NOT auth.users.id
    const { data: appointment } = await supabase
      .from('appointments')
      .select('*, psychologist:psychologist_profiles(first_name, last_name, user_id)')
      .eq('id', appointment_id)
      .single()

    if (!appointment) {
      return new Response(JSON.stringify({ error: 'Cita no encontrada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 })
    }

    // patient_id == auth.users.id directly
    // isPsychologist must check psychologist_profiles.user_id, not appointment.psychologist_id
    const isPatient = appointment.patient_id === user.id
    const isPsychologist = appointment.psychologist?.user_id === user.id

    if (!isPatient && !isPsychologist) {
      return new Response(JSON.stringify({ error: 'No tienes acceso a esta cita' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 })
    }

    // Fetch patient name via separate query (broken FK if joined directly)
    const { data: patientProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', appointment.patient_id)
      .single()

    const patientName = patientProfile?.full_name || 'Paciente'
    const psychologistName = appointment.psychologist
      ? (appointment.psychologist.first_name + ' ' + appointment.psychologist.last_name).trim()
      : 'Psicologo'

    // If room already exists, just issue a new token
    if (appointment.daily_room_url && appointment.daily_room_name) {
      const meetingToken = await createMeetingToken(
        DAILY_API_KEY,
        appointment.daily_room_name,
        isPsychologist,
        isPsychologist ? psychologistName : patientName
      )
      return new Response(JSON.stringify({
        room_url: appointment.daily_room_url,
        room_name: appointment.daily_room_name,
        token: meetingToken,
        is_owner: isPsychologist,
        patient_name: patientName,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    // Create new Daily room
    // Use timestamp suffix to avoid name conflicts with expired/deleted rooms
    const roomName = 'vit-' + appointment_id.replace(/-/g, '').slice(0, 12) + '-' + Date.now().toString(36).slice(-5)

    const startTime = new Date(appointment.start_time)
    const endTime = appointment.end_time
      ? new Date(appointment.end_time)
      : new Date(startTime.getTime() + 60 * 60 * 1000)
    const expiry = Math.floor(endTime.getTime() / 1000) + (30 * 60)
    const nbf = Math.floor(startTime.getTime() / 1000) - (15 * 60)

    const roomRes = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + DAILY_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: roomName,
        privacy: 'private',
        properties: {
          nbf,
          exp: expiry,
          max_participants: 2,
          enable_chat: true,
          enable_screenshare: true,
          enable_recording: 'cloud',
          start_cloud_recording_on_join: false,
          start_audio_off: false,
          start_video_off: false,
          lang: 'es',
        },
      }),
    })
    const room = await roomRes.json()
    if (room.error) throw new Error('Daily room error: ' + JSON.stringify(room.error))

    // Persist room info on appointment
    await supabase.from('appointments').update({
      daily_room_name: room.name,
      daily_room_url: room.url,
      video_link: room.url,
    }).eq('id', appointment_id)

    const meetingToken = await createMeetingToken(
      DAILY_API_KEY,
      room.name,
      isPsychologist,
      isPsychologist ? psychologistName : patientName
    )

    return new Response(JSON.stringify({
      room_url: room.url,
      room_name: room.name,
      token: meetingToken,
      is_owner: isPsychologist,
      patient_name: patientName,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })

  } catch (error) {
    console.error('create-video-room error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function createMeetingToken(
  apiKey: string,
  roomName: string,
  isOwner: boolean,
  userName: string
): Promise<string> {
  const tokenRes = await fetch('https://api.daily.co/v1/meeting-tokens', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        is_owner: isOwner,
        user_name: userName,
        enable_recording: isOwner ? 'cloud' : undefined,
        start_audio_off: false,
        start_video_off: false,
      },
    }),
  })
  const tokenData = await tokenRes.json()
  if (tokenData.error) throw new Error('Token error: ' + JSON.stringify(tokenData.error))
  return tokenData.token
}
