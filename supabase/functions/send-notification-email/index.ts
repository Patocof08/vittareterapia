import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FROM      = 'Vittare <hola@vittare.mx>'
const BASE_URL  = 'https://vittare.mx'

// ─── Branded email builder ─────────────────────────────────────────────────────

function buildEmail(body: string, previewText = ''): string {
  const preview = previewText
    ? `<div style="display:none;max-height:0;overflow:hidden;">${previewText}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>`
    : ''

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Vittare</title>
</head>
<body style="margin:0;padding:0;background-color:#F4F7F4;font-family:Arial,Helvetica,sans-serif;">
${preview}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F7F4;">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

  <!-- HEADER -->
  <tr>
    <td style="background-color:#1F4D2E;border-radius:12px 12px 0 0;padding:28px 40px;">
      <img src="https://vittare.mx/images/logo/vittare-logo-white.png" width="180" alt="Vittare — Reconecta Contigo" style="display:block;border:0;max-width:180px;height:auto;" />
    </td>
  </tr>

  <!-- BODY -->
  <tr>
    <td style="background-color:#FFFFFF;border-left:1px solid #E5E7EB;border-right:1px solid #E5E7EB;padding:40px 40px 32px;">
      ${body}
    </td>
  </tr>

  <!-- ACCENT LINE -->
  <tr><td style="background-color:#12A357;height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>

  <!-- FOOTER -->
  <tr>
    <td style="background-color:#F4F7F4;border-radius:0 0 12px 12px;border-left:1px solid #E5E7EB;border-right:1px solid #E5E7EB;border-bottom:1px solid #E5E7EB;padding:28px 40px;text-align:center;">
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#6B7280;margin:0 0 6px;">¿Tienes dudas? Estamos aquí para ayudarte.</p>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;margin:0 0 16px;">
        <a href="mailto:hola@vittare.mx" style="color:#12A357;text-decoration:none;">hola@vittare.mx</a>
        <span style="color:#D1D5DB;"> · </span>
        <a href="https://vittare.mx" style="color:#12A357;text-decoration:none;">vittare.mx</a>
      </p>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;margin:0 0 16px;">
        <a href="https://instagram.com/vittare.mx" style="color:#6B7280;text-decoration:none;">Instagram</a>
        <span style="color:#D1D5DB;">  ·  </span>
        <a href="https://tiktok.com/@vittare" style="color:#6B7280;text-decoration:none;">TikTok</a>
        <span style="color:#D1D5DB;">  ·  </span>
        <a href="https://linkedin.com/company/vittare" style="color:#6B7280;text-decoration:none;">LinkedIn</a>
      </p>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9CA3AF;margin:0 0 4px;">Vittare · Ciudad de México, México</p>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:11px;margin:0;">
        <a href="https://vittare.mx/privacidad" style="color:#9CA3AF;">Aviso de privacidad</a>
        <span style="color:#D1D5DB;"> · </span>
        <a href="https://vittare.mx/terminos" style="color:#9CA3AF;">Términos de uso</a>
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

// ─── Inline component helpers ──────────────────────────────────────────────────

function h1(t: string) {
  return `<h1 style="font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.3;color:#1F4D2E;font-weight:normal;margin:0 0 20px 0;">${t}</h1>`
}
function p(t: string, muted = false) {
  return `<p style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.7;color:${muted ? '#6B7280' : '#1F2937'};margin:0 0 16px 0;">${t}</p>`
}
function small(t: string) {
  return `<p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#6B7280;margin:0 0 12px 0;">${t}</p>`
}
function signOff(t: string) {
  return `<p style="font-family:Georgia,serif;font-size:15px;line-height:1.6;color:#6B7280;font-style:italic;margin:24px 0 0 0;">${t}</p>`
}
function btn(href: string, label: string, ghost = false) {
  return ghost
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td style="border-radius:8px;border:2px solid #12A357;"><a href="${href}" style="display:inline-block;padding:14px 28px;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;color:#12A357;text-decoration:none;border-radius:8px;">${label}</a></td></tr></table>`
    : `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td style="border-radius:8px;background-color:#12A357;"><a href="${href}" style="display:inline-block;padding:14px 28px;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;color:#FFFFFF;text-decoration:none;border-radius:8px;">${label}</a></td></tr></table>`
}
function hr() {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td style="border-top:1px solid #E5E7EB;font-size:0;line-height:0;">&nbsp;</td></tr></table>`
}
function highlight(rows: [string, string][]) {
  const inner = rows.map(([l, v]) =>
    `<tr><td style="font-family:Arial,sans-serif;font-size:14px;color:#6B7280;padding:6px 0;white-space:nowrap;padding-right:16px;">${l}</td><td style="font-family:Arial,sans-serif;font-size:14px;color:#1F2937;font-weight:600;padding:6px 0;">${v}</td></tr>`
  ).join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#E8F5EE;border-left:3px solid #12A357;border-radius:0 8px 8px 0;margin:20px 0;"><tr><td style="padding:16px 20px;"><table role="presentation" cellpadding="0" cellspacing="0">${inner}</table></td></tr></table>`
}
function alert(msg: string, variant: 'success'|'warning'|'info'|'danger' = 'info') {
  const c = { success: ['#E8F5EE','#12A357','#1F4D2E'], warning: ['#FEF9E7','#F5C243','#92400E'], info: ['#EFF6FF','#3B82F6','#1E3A5F'], danger: ['#FEF2F2','#EF4444','#991B1B'] }[variant]
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;"><tr><td style="background-color:${c[0]};border:1px solid ${c[1]};border-radius:8px;padding:14px 18px;"><p style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:${c[2]};margin:0;">${msg}</p></td></tr></table>`
}

// ─── Templates ────────────────────────────────────────────────────────────────

const EMAIL_TEMPLATES: Record<string, (v: Record<string, string>) => { subject: string; html: string }> = {

  new_booking: (v) => ({
    subject: 'Nueva sesión reservada',
    html: buildEmail(
      h1('Nueva sesión programada.') +
      p(`Hola ${v.recipient_name}, tienes una nueva sesión confirmada en Vittare.`) +
      highlight([['Paciente', v.patient_name||'—'],['Fecha', v.session_date||'—'],['Hora', v.session_time||'—']]) +
      btn(`${BASE_URL}/therapist/sessions`, 'Ver detalles de la sesión') +
      hr() +
      signOff('Gracias por ser parte de Vittare. — El equipo de Vittare'),
      `Nueva sesión con ${v.patient_name} el ${v.session_date}`
    ),
  }),

  session_reminder: (v) => ({
    subject: `Recordatorio: tu sesión de hoy a las ${v.session_time}`,
    html: buildEmail(
      h1('Tu sesión es hoy.') +
      p(`Hola ${v.recipient_name}, te recordamos que tienes una sesión programada hoy.`) +
      highlight([['Con', v.other_party_name||'—'],['Fecha', v.session_date||'—'],['Hora', (v.session_time||'—')+' (hora CDMX)']]) +
      btn(`${BASE_URL}/portal/sesiones`, 'Ver mi sesión') +
      alert('Recuerda entrar unos minutos antes y estar en un lugar tranquilo y privado.', 'info') +
      hr() +
      signOff('¡Nos vemos pronto! — El equipo de Vittare'),
      `Tu sesión con ${v.other_party_name} es hoy a las ${v.session_time}`
    ),
  }),

  session_reminder_soon: (v) => ({
    subject: 'Tu sesión comienza en 10 minutos',
    html: buildEmail(
      h1('Tu sesión está por comenzar.') +
      highlight([['Con', v.other_party_name||'—'],['Hora', v.session_time||'—']]) +
      p(`Hola ${v.recipient_name}, es momento de conectarte. Ingresa ahora para iniciar la videollamada.`) +
      btn(`${BASE_URL}/therapist/sessions`, 'Entrar a la sesión') +
      alert('💡 Asegúrate de tener buena conexión a internet y cámara y micrófono listos.', 'warning'),
      `Tu sesión comienza en 10 minutos — ${v.session_time}`
    ),
  }),

  new_message: (v) => ({
    subject: `Nuevo mensaje de ${v.sender_name}`,
    html: buildEmail(
      h1('Tienes un nuevo mensaje.') +
      p(`Hola ${v.recipient_name}, <strong>${v.sender_name}</strong> te envió un mensaje en Vittare.`) +
      btn(`${BASE_URL}/portal/mensajes`, 'Leer y responder') +
      hr() +
      small('Para evitar notificaciones de mensajes, puedes ajustar tus preferencias desde tu perfil.'),
      `${v.sender_name} te envió un mensaje`
    ),
  }),

  payment_update: (v) => ({
    subject: 'Actualización de pago — Vittare',
    html: buildEmail(
      h1('Actualización de pago.') +
      p(`Hola ${v.recipient_name}, ${v.payment_description||'hay una actualización en tu cuenta.'}`) +
      highlight([['Monto', v.amount||'—'],['Concepto', v.concept||'—']]) +
      btn(`${BASE_URL}/therapist/wallet`, 'Ver mi billetera') +
      hr() +
      small('Si tienes preguntas sobre este movimiento, escríbenos a hola@vittare.mx.'),
      `Actualización de pago: ${v.amount}`
    ),
  }),

  cancellation: (v) => ({
    subject: 'Sesión cancelada',
    html: buildEmail(
      h1('Una sesión ha sido cancelada.') +
      p(`Hola ${v.recipient_name}, te informamos que la siguiente sesión fue cancelada.`) +
      highlight([['Con', v.other_party_name||'—'],['Fecha original', v.session_date||'—'],['Hora original', v.session_time||'—']]) +
      alert('Si tienes crédito generado por esta cancelación, aparecerá disponible en tu cuenta.', 'warning') +
      btn(`${BASE_URL}/portal/sesiones`, 'Ver mis sesiones') +
      hr() +
      signOff('Lamentamos el inconveniente. — El equipo de Vittare'),
      `Sesión cancelada con ${v.other_party_name}`
    ),
  }),

  no_show: (v) => ({
    subject: 'Inasistencia registrada en tu sesión',
    html: buildEmail(
      h1('No registramos tu asistencia.') +
      p(`Hola ${v.recipient_name}, tu sesión programada fue marcada como inasistencia.`) +
      highlight([['Terapeuta', v.psychologist_name||'—'],['Fecha', v.session_date||'—'],['Hora', v.session_time||'—']]) +
      alert('Si crees que esto es un error, comunícate con tu psicólogo a través de la plataforma.', 'warning') +
      p('Recuerda que la constancia en tus sesiones es parte fundamental de tu proceso terapéutico.', true) +
      btn(`${BASE_URL}/portal/sesiones`, 'Ir a mis sesiones') +
      hr() +
      signOff('Estamos aquí para apoyarte. — El equipo de Vittare'),
      'Tu sesión fue marcada como inasistencia'
    ),
  }),

  task_assigned: (v) => ({
    subject: `Nueva tarea asignada — ${v.task_title||'Vittare'}`,
    html: buildEmail(
      h1('Tu terapeuta te asignó una tarea.') +
      p(`Hola ${v.recipient_name}, ${v.psychologist_name} te ha asignado una nueva actividad.`) +
      highlight([['Tarea', v.task_title||'—'],['Asignada por', v.psychologist_name||'—']]) +
      btn(`${BASE_URL}/portal/tareas`, 'Ver la tarea') +
      hr() +
      small('Completar las tareas entre sesiones refuerza tu proceso terapéutico.'),
      `Nueva tarea: ${v.task_title}`
    ),
  }),

  newsletter: (v) => ({
    subject: v.newsletter_subject||'Novedades de Vittare',
    html: buildEmail(
      h1(v.newsletter_subject||'Novedades de Vittare') +
      (v.newsletter_body||p('Tenemos novedades para ti. Ingresa a Vittare para conocerlas.')) +
      hr() +
      small('Recibiste este correo porque estás suscrito al newsletter de Vittare.'),
      v.newsletter_subject||'Novedades de Vittare'
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
        return new Response(JSON.stringify({ status: 'skipped', reason: 'user_disabled' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
      }
    }

    // Resolve recipient email
    let toEmail = recipient_email
    if (!toEmail) {
      const { data: profile } = await supabase.from('profiles').select('email').eq('id', recipient_user_id).single()
      toEmail = profile?.email
      if (!toEmail) {
        const { data: psychProfile } = await supabase.from('psychologist_profiles').select('email').eq('user_id', recipient_user_id).single()
        toEmail = psychProfile?.email
      }
    }

    if (!toEmail) {
      return new Response(JSON.stringify({ error: 'No email found for user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 })
    }

    const { subject, html } = templateFn(variables || {})

    // Create in-app notification
    const NOTIF_CONFIGS: Record<string, (v: Record<string, string>) => { title: string; body: string; link: string }> = {
      new_booking:           (v) => ({ title: `Nueva sesión con ${v.patient_name||'un paciente'}`, body: `${v.session_date} a las ${v.session_time}`, link: '/therapist/sessions' }),
      session_reminder:      (v) => ({ title: `Recordatorio: sesión hoy a las ${v.session_time}`, body: `Con ${v.other_party_name}`, link: '/portal/sesiones' }),
      session_reminder_soon: (v) => ({ title: 'Tu sesión comienza en 10 minutos', body: `Con ${v.other_party_name}`, link: '/therapist/sessions' }),
      new_message:           (v) => ({ title: `Nuevo mensaje de ${v.sender_name}`, body: 'Tienes un mensaje sin leer', link: '/portal/mensajes' }),
      payment_update:        (v) => ({ title: 'Actualización de pago', body: `${v.amount} — ${v.concept}`, link: '/portal/sesiones' }),
      cancellation:          (v) => ({ title: 'Sesión cancelada', body: `Con ${v.other_party_name} — ${v.session_date}`, link: '/portal/sesiones' }),
      no_show:               (v) => ({ title: 'Inasistencia registrada', body: `Sesión con ${v.psychologist_name||'tu psicólogo'}`, link: '/portal/sesiones' }),
      task_assigned:         (v) => ({ title: `Nueva tarea: ${v.task_title}`, body: `Asignada por ${v.psychologist_name}`, link: '/portal/tareas' }),
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

    // Send via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_API_KEY}` },
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
