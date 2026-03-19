import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { emailLayout } from '../_shared/emailLayout.ts'
import {
  emailH1, emailP, emailSmall, emailButton,
  emailDivider, emailHighlight, emailAlert, emailSignOff,
} from '../_shared/emailComponents.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FROM = 'Vittare <hola@vittare.mx>'
const BASE_URL = 'https://vittare.mx'

// ─── Templates ────────────────────────────────────────────────────────────────

const EMAIL_TEMPLATES: Record<string, (v: Record<string, string>) => { subject: string; html: string }> = {

  new_booking: (v) => ({
    subject: 'Nueva sesión reservada',
    html: emailLayout(
      emailH1('Nueva sesión programada.') +
      emailP(`Hola ${v.recipient_name}, tienes una nueva sesión confirmada en Vittare.`) +
      emailHighlight([
        ['Paciente', v.patient_name || '—'],
        ['Fecha',    v.session_date || '—'],
        ['Hora',     v.session_time || '—'],
      ]) +
      emailButton(`${BASE_URL}/therapist/sessions`, 'Ver detalles de la sesión') +
      emailDivider() +
      emailSignOff('Gracias por ser parte de Vittare. — El equipo de Vittare'),
      { previewText: `Nueva sesión con ${v.patient_name} el ${v.session_date}` }
    ),
  }),

  session_reminder: (v) => ({
    subject: `Recordatorio: tu sesión de hoy a las ${v.session_time}`,
    html: emailLayout(
      emailH1('Tu sesión es hoy.') +
      emailP(`Hola ${v.recipient_name}, te recordamos que tienes una sesión programada hoy.`) +
      emailHighlight([
        ['Con',   v.other_party_name || '—'],
        ['Fecha', v.session_date || '—'],
        ['Hora',  v.session_time + ' (hora CDMX)' || '—'],
      ]) +
      emailButton(`${BASE_URL}/portal/sesiones`, 'Ver mi sesión') +
      emailAlert('Recuerda entrar unos minutos antes y estar en un lugar tranquilo y privado.', 'info') +
      emailDivider() +
      emailSignOff('¡Nos vemos pronto! — El equipo de Vittare'),
      { previewText: `Tu sesión con ${v.other_party_name} es hoy a las ${v.session_time}` }
    ),
  }),

  session_reminder_soon: (v) => ({
    subject: 'Tu sesión comienza en 10 minutos',
    html: emailLayout(
      emailH1('Tu sesión está por comenzar.') +
      emailHighlight([
        ['Con',  v.other_party_name || '—'],
        ['Hora', v.session_time || '—'],
      ]) +
      emailP(`Hola ${v.recipient_name}, es momento de conectarte. Ingresa ahora para iniciar la videollamada.`) +
      emailButton(`${BASE_URL}/therapist/sessions`, 'Entrar a la sesión') +
      emailAlert('💡 Asegúrate de tener buena conexión a internet y cámara y micrófono listos.', 'warning'),
      { previewText: `Tu sesión comienza en 10 minutos — ${v.session_time}` }
    ),
  }),

  new_message: (v) => ({
    subject: `Nuevo mensaje de ${v.sender_name}`,
    html: emailLayout(
      emailH1('Tienes un nuevo mensaje.') +
      emailP(`Hola ${v.recipient_name}, <strong>${v.sender_name}</strong> te envió un mensaje en Vittare.`) +
      emailButton(`${BASE_URL}/portal/mensajes`, 'Leer y responder') +
      emailDivider() +
      emailSmall('Para evitar notificaciones de mensajes, puedes ajustar tus preferencias desde tu perfil en Vittare.'),
      { previewText: `${v.sender_name} te envió un mensaje` }
    ),
  }),

  payment_update: (v) => ({
    subject: 'Actualización de pago — Vittare',
    html: emailLayout(
      emailH1('Actualización de pago.') +
      emailP(`Hola ${v.recipient_name}, ${v.payment_description || 'hay una actualización en tu cuenta.'}`) +
      emailHighlight([
        ['Monto',   v.amount   || '—'],
        ['Concepto', v.concept || '—'],
      ]) +
      emailButton(`${BASE_URL}/therapist/wallet`, 'Ver mi billetera') +
      emailDivider() +
      emailSmall('Si tienes preguntas sobre este movimiento, escríbenos a hola@vittare.mx.'),
      { previewText: `Actualización de pago: ${v.amount}` }
    ),
  }),

  cancellation: (v) => ({
    subject: 'Sesión cancelada',
    html: emailLayout(
      emailH1('Una sesión ha sido cancelada.') +
      emailP(`Hola ${v.recipient_name}, te informamos que la siguiente sesión fue cancelada.`) +
      emailHighlight([
        ['Con',            v.other_party_name || '—'],
        ['Fecha original', v.session_date     || '—'],
        ['Hora original',  v.session_time     || '—'],
      ]) +
      emailAlert('Si tienes crédito generado por esta cancelación, aparecerá disponible en tu cuenta.', 'warning') +
      emailButton(`${BASE_URL}/portal/sesiones`, 'Ver mis sesiones') +
      emailDivider() +
      emailSignOff('Lamentamos el inconveniente. — El equipo de Vittare'),
      { previewText: `Sesión cancelada con ${v.other_party_name}` }
    ),
  }),

  no_show: (v) => ({
    subject: 'Inasistencia registrada en tu sesión',
    html: emailLayout(
      emailH1('No registramos tu asistencia.') +
      emailP(`Hola ${v.recipient_name}, tu sesión programada fue marcada como inasistencia.`) +
      emailHighlight([
        ['Terapeuta', v.psychologist_name || '—'],
        ['Fecha',     v.session_date      || '—'],
        ['Hora',      v.session_time      || '—'],
      ]) +
      emailAlert('Si crees que esto es un error, comunícate con tu psicólogo a través de la plataforma.', 'warning') +
      emailP('Recuerda que la constancia en tus sesiones es parte fundamental de tu proceso terapéutico.', true) +
      emailButton(`${BASE_URL}/portal/sesiones`, 'Ir a mis sesiones') +
      emailDivider() +
      emailSignOff('Estamos aquí para apoyarte. — El equipo de Vittare'),
      { previewText: 'Tu sesión fue marcada como inasistencia' }
    ),
  }),

  task_assigned: (v) => ({
    subject: `Nueva tarea asignada — ${v.task_title || 'Vittare'}`,
    html: emailLayout(
      emailH1('Tu terapeuta te asignó una tarea.') +
      emailP(`Hola ${v.recipient_name}, ${v.psychologist_name} te ha asignado una nueva actividad.`) +
      emailHighlight([
        ['Tarea',      v.task_title        || '—'],
        ['Asignada por', v.psychologist_name || '—'],
      ]) +
      emailButton(`${BASE_URL}/portal/tareas`, 'Ver la tarea') +
      emailDivider() +
      emailSmall('Completar las tareas entre sesiones refuerza tu proceso terapéutico.'),
      { previewText: `Nueva tarea: ${v.task_title}` }
    ),
  }),

  newsletter: (v) => ({
    subject: v.newsletter_subject || 'Novedades de Vittare',
    html: emailLayout(
      emailH1(v.newsletter_subject || 'Novedades de Vittare') +
      (v.newsletter_body || emailP('Tenemos novedades para ti. Ingresa a Vittare para conocerlas.')) +
      emailDivider() +
      emailSmall('Recibiste este correo porque estás suscrito al newsletter de Vittare. Puedes darte de baja en cualquier momento desde tu perfil.'),
      { previewText: v.newsletter_subject || 'Novedades de Vittare' }
    ),
  }),
}

// ─── Preference column map ────────────────────────────────────────────────────

const TYPE_TO_PREF_COLUMN: Record<string, string> = {
  new_booking:           'email_new_booking',
  session_reminder:      'email_session_reminder',
  session_reminder_soon: 'email_session_reminder',
  new_message:           'email_new_message',
  payment_update:        'email_payment_update',
  cancellation:          'email_cancellation',
  no_show:               'email_no_show',
  task_assigned:         'email_task_assigned',
  newsletter:            'email_newsletter',
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      return new Response(JSON.stringify({ error: 'Email service not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { notification_type, recipient_user_id, recipient_email, variables } = await req.json()

    if (!notification_type || !recipient_user_id) {
      return new Response(JSON.stringify({ error: 'notification_type and recipient_user_id required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    const templateFn = EMAIL_TEMPLATES[notification_type]
    if (!templateFn) {
      return new Response(JSON.stringify({ error: `Unknown notification type: ${notification_type}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    // Check user notification preferences
    const prefColumn = TYPE_TO_PREF_COLUMN[notification_type]
    if (prefColumn) {
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select(prefColumn)
        .eq('user_id', recipient_user_id)
        .single()

      if (prefs && prefs[prefColumn] === false) {
        console.log(`User ${recipient_user_id} has ${notification_type} emails disabled. Skipping.`)
        return new Response(JSON.stringify({ status: 'skipped', reason: 'user_disabled' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
      }
    }

    // Resolve recipient email
    let toEmail = recipient_email
    if (!toEmail) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', recipient_user_id)
        .single()

      toEmail = profile?.email

      if (!toEmail) {
        const { data: psychProfile } = await supabase
          .from('psychologist_profiles')
          .select('email')
          .eq('user_id', recipient_user_id)
          .single()
        toEmail = psychProfile?.email
      }
    }

    if (!toEmail) {
      console.error('Could not resolve email for user:', recipient_user_id)
      return new Response(JSON.stringify({ error: 'No email found for user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 })
    }

    const { subject, html } = templateFn(variables || {})

    // Create in-app notification
    const NOTIF_CONFIGS: Record<string, (v: Record<string, string>) => { title: string; body: string; link: string }> = {
      new_booking:           (v) => ({ title: `Nueva sesión con ${v.patient_name || 'un paciente'}`,      body: `${v.session_date} a las ${v.session_time}`,   link: '/therapist/sessions' }),
      session_reminder:      (v) => ({ title: `Recordatorio: sesión hoy a las ${v.session_time}`,         body: `Con ${v.other_party_name}`,                   link: '/portal/sesiones' }),
      session_reminder_soon: (v) => ({ title: 'Tu sesión comienza en 10 minutos',                         body: `Con ${v.other_party_name}`,                   link: '/therapist/sessions' }),
      new_message:           (v) => ({ title: `Nuevo mensaje de ${v.sender_name}`,                        body: 'Tienes un mensaje sin leer',                  link: '/portal/mensajes' }),
      payment_update:        (v) => ({ title: 'Actualización de pago',                                    body: `${v.amount} — ${v.concept}`,                 link: '/portal/sesiones' }),
      cancellation:          (v) => ({ title: 'Sesión cancelada',                                         body: `Con ${v.other_party_name} — ${v.session_date}`, link: '/portal/sesiones' }),
      no_show:               (v) => ({ title: 'Inasistencia registrada',                                  body: `Sesión con ${v.psychologist_name || 'tu psicólogo'}`, link: '/portal/sesiones' }),
      task_assigned:         (v) => ({ title: `Nueva tarea: ${v.task_title}`,                             body: `Asignada por ${v.psychologist_name}`,         link: '/portal/tareas' }),
    }

    const notifConfig = NOTIF_CONFIGS[notification_type]
    if (notifConfig) {
      const { title: notifTitle, body: notifBody, link: notifLink } = notifConfig(variables || {})
      const { error: notifError } = await supabase.from('notifications').insert({
        user_id: recipient_user_id,
        type: notification_type,
        title: notifTitle,
        body: notifBody,
        link: notifLink,
      })
      if (notifError) console.error('Error creating in-app notification:', notifError)
    }

    // Send email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({ from: FROM, to: [toEmail], subject, html }),
    })

    if (!resendResponse.ok) {
      const errText = await resendResponse.text()
      console.error('Resend error:', resendResponse.status, errText)
      return new Response(JSON.stringify({ error: 'Failed to send email', details: errText }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 })
    }

    const resendData = await resendResponse.json()
    console.log('Email sent:', notification_type, 'to:', toEmail, 'id:', resendData.id)

    return new Response(
      JSON.stringify({ status: 'sent', email_id: resendData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('send-notification-email error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
