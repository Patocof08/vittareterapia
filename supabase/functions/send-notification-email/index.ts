import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EMAIL_TEMPLATES: Record<string, (vars: Record<string, string>) => { subject: string; html: string }> = {
  new_booking: (v) => ({
    subject: 'Nueva sesión reservada',
    html: buildEmail(
      `Hola ${v.recipient_name},`,
      `<p>Tienes una nueva sesión programada.</p>
       <div style="background:#f8f9fa;border-left:4px solid #6366f1;border-radius:0 8px 8px 0;padding:20px 24px;margin:20px 0;">
         <p style="margin:0 0 8px;"><strong>Paciente:</strong> ${v.patient_name}</p>
         <p style="margin:0 0 8px;"><strong>Fecha:</strong> ${v.session_date}</p>
         <p style="margin:0;"><strong>Hora:</strong> ${v.session_time}</p>
       </div>
       <p>Ingresa a la plataforma para ver los detalles.</p>`
    ),
  }),

  session_reminder: (v) => ({
    subject: `Recordatorio: sesión hoy a las ${v.session_time}`,
    html: buildEmail(
      `Hola ${v.recipient_name},`,
      `<p>Te recordamos que tienes una sesión programada en las próximas horas.</p>
       <div style="background:#f8f9fa;border-left:4px solid #6366f1;border-radius:0 8px 8px 0;padding:20px 24px;margin:20px 0;">
         <p style="margin:0 0 8px;"><strong>Con:</strong> ${v.other_party_name}</p>
         <p style="margin:0 0 8px;"><strong>Fecha:</strong> ${v.session_date}</p>
         <p style="margin:0;"><strong>Hora:</strong> ${v.session_time}</p>
       </div>
       <p>Ingresa a la plataforma unos minutos antes de la hora para estar listo.</p>`
    ),
  }),

  session_reminder_soon: (v) => ({
    subject: `Tu sesión comienza en 10 minutos`,
    html: buildEmail(
      `Hola ${v.recipient_name},`,
      `<p><strong>Tu sesión está por comenzar.</strong></p>
       <div style="background:#f0fdf4;border-left:4px solid #22c55e;border-radius:0 8px 8px 0;padding:20px 24px;margin:20px 0;">
         <p style="margin:0 0 8px;"><strong>Paciente:</strong> ${v.other_party_name}</p>
         <p style="margin:0;"><strong>Hora:</strong> ${v.session_time}</p>
       </div>
       <p>Ingresa a la plataforma ahora para iniciar la videollamada.</p>`
    ),
  }),

  new_message: (v) => ({
    subject: `Nuevo mensaje de ${v.sender_name}`,
    html: buildEmail(
      `Hola ${v.recipient_name},`,
      `<p>${v.sender_name} te envió un mensaje en la plataforma.</p>
       <p style="color:#666;">Ingresa a Vittare para leerlo y responder.</p>`
    ),
  }),

  payment_update: (v) => ({
    subject: 'Actualización de pago',
    html: buildEmail(
      `Hola ${v.recipient_name},`,
      `<p>${v.payment_description}</p>
       <div style="background:#f8f9fa;border-left:4px solid #22c55e;border-radius:0 8px 8px 0;padding:20px 24px;margin:20px 0;">
         <p style="margin:0 0 8px;"><strong>Monto:</strong> ${v.amount}</p>
         <p style="margin:0;"><strong>Concepto:</strong> ${v.concept}</p>
       </div>`
    ),
  }),

  cancellation: (v) => ({
    subject: 'Sesión cancelada',
    html: buildEmail(
      `Hola ${v.recipient_name},`,
      `<p>Una sesión ha sido cancelada.</p>
       <div style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:0 8px 8px 0;padding:20px 24px;margin:20px 0;">
         <p style="margin:0 0 8px;"><strong>Con:</strong> ${v.other_party_name}</p>
         <p style="margin:0 0 8px;"><strong>Fecha original:</strong> ${v.session_date}</p>
         <p style="margin:0;"><strong>Hora original:</strong> ${v.session_time}</p>
       </div>`
    ),
  }),

  no_show: (v) => ({
    subject: 'Registro de inasistencia a tu sesión',
    html: buildEmail(
      `Hola ${v.recipient_name},`,
      `<p>Te informamos que tu sesión programada no registró asistencia.</p>
       <div style="background:#f8f9fa;border-left:4px solid #6366f1;border-radius:0 8px 8px 0;padding:20px 24px;margin:20px 0;">
         <p style="margin:0 0 8px;"><strong>Sesión con:</strong> ${v.psychologist_name}</p>
         <p style="margin:0 0 8px;"><strong>Fecha:</strong> ${v.session_date}</p>
         <p style="margin:0;"><strong>Hora:</strong> ${v.session_time}</p>
       </div>
       <p>Si crees que esto es un error, comunícate con tu psicólogo a través de la plataforma.</p>
       <p>Recuerda que la constancia en tus sesiones es parte fundamental de tu proceso terapéutico.</p>`
    ),
  }),

  task_assigned: (v) => ({
    subject: 'Nueva tarea asignada',
    html: buildEmail(
      `Hola ${v.recipient_name},`,
      `<p>Tu terapeuta te ha asignado una nueva tarea.</p>
       <div style="background:#f8f9fa;border-left:4px solid #6366f1;border-radius:0 8px 8px 0;padding:20px 24px;margin:20px 0;">
         <p style="margin:0 0 8px;"><strong>Terapeuta:</strong> ${v.psychologist_name}</p>
         <p style="margin:0;"><strong>Tarea:</strong> ${v.task_title}</p>
       </div>
       <p>Ingresa a Vittare para ver los detalles y completarla.</p>`
    ),
  }),

  newsletter: (v) => ({
    subject: v.newsletter_subject || 'Novedades de Vittare',
    html: buildEmail(
      `Hola ${v.recipient_name},`,
      `${v.newsletter_body || '<p>Tenemos novedades para ti.</p>'}`
    ),
  }),
}

function buildEmail(greeting: string, body: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
    <div style="background:#1a1a2e;padding:28px 40px;text-align:center;">
      <h1 style="color:#fff;font-size:22px;margin:0;font-weight:600;">Vittare</h1>
    </div>
    <div style="padding:36px 40px;">
      <p style="font-size:16px;color:#333;margin:0 0 20px;line-height:1.6;">${greeting}</p>
      <div style="font-size:15px;color:#555;line-height:1.6;">${body}</div>
    </div>
    <div style="padding:20px 40px;background:#f8f9fa;border-top:1px solid #eee;text-align:center;">
      <p style="font-size:12px;color:#999;margin:0;">Este es un mensaje automático de Vittare. No responder a este correo.</p>
    </div>
  </div>
</body></html>`
}

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

    // Check user's notification preferences
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

    // ── Crear notificación in-app ──
    const NOTIF_CONFIGS: Record<string, (v: Record<string, string>) => { title: string; body: string; link: string }> = {
      new_booking: (v) => ({
        title: `Nueva sesión con ${v.patient_name || 'un paciente'}`,
        body: `${v.session_date} a las ${v.session_time}`,
        link: '/therapist/sessions',
      }),
      session_reminder: (v) => ({
        title: `Recordatorio: sesión hoy a las ${v.session_time}`,
        body: `Con ${v.other_party_name}`,
        link: '/portal/sesiones',
      }),
      session_reminder_soon: (v) => ({
        title: 'Tu sesión comienza en 10 minutos',
        body: `Con ${v.other_party_name}`,
        link: '/therapist/sessions',
      }),
      new_message: (v) => ({
        title: `Nuevo mensaje de ${v.sender_name}`,
        body: 'Tienes un mensaje sin leer',
        link: '/portal/mensajes',
      }),
      payment_update: (v) => ({
        title: 'Actualización de pago',
        body: `${v.amount} — ${v.concept}`,
        link: '/portal/sesiones',
      }),
      cancellation: (v) => ({
        title: 'Sesión cancelada',
        body: `Con ${v.other_party_name} — ${v.session_date}`,
        link: '/portal/sesiones',
      }),
      no_show: (v) => ({
        title: 'Inasistencia registrada',
        body: `Sesión con ${v.psychologist_name || 'tu psicólogo'}`,
        link: '/portal/sesiones',
      }),
      task_assigned: (v) => ({
        title: `Nueva tarea: ${v.task_title}`,
        body: `Asignada por ${v.psychologist_name}`,
        link: '/portal/tareas',
      }),
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

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Vittare <no-reply@vittareterapia.com>',
        to: [toEmail],
        subject,
        html,
      }),
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
