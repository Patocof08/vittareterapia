# Email Audit — Vittare

## Sistema

- **Provider:** Resend (llamadas directas via `fetch` a `api.resend.com`)
- **From address:** `Vittare <hola@vittare.mx>` (actualizado de vittareterapia.com)
- **Runtime:** Deno (Supabase Edge Functions) — sin React, templates en TypeScript puro
- **Shared layout:** `supabase/functions/_shared/emailLayout.ts`
- **Shared components:** `supabase/functions/_shared/emailComponents.ts`

---

## Funciones Edge con emails

### 1. `send-notification-email` — 9 templates

Llamado desde: PostSessionDialog, ClientMessages, ClientSessions, TherapistTasks, TherapistMessages, TherapistSessions, BookingCalendar

| Template | Subject | Para | Variables |
|---|---|---|---|
| `new_booking` | Nueva sesión reservada | Psicólogo | recipient_name, patient_name, session_date, session_time |
| `session_reminder` | Recordatorio: sesión hoy a las {hora} | Cliente / Psicólogo | recipient_name, other_party_name, session_date, session_time |
| `session_reminder_soon` | Tu sesión comienza en 10 minutos | Psicólogo | recipient_name, other_party_name, session_time |
| `new_message` | Nuevo mensaje de {remitente} | Ambos | recipient_name, sender_name |
| `payment_update` | Actualización de pago | Ambos | recipient_name, payment_description, amount, concept |
| `cancellation` | Sesión cancelada | Ambos | recipient_name, other_party_name, session_date, session_time |
| `no_show` | Inasistencia registrada | Cliente | recipient_name, psychologist_name, session_date, session_time |
| `task_assigned` | Nueva tarea asignada | Cliente | recipient_name, psychologist_name, task_title |
| `newsletter` | Custom | Genérico | recipient_name, newsletter_subject, newsletter_body |

Respeta `notification_preferences` del usuario. Crea notificaciones in-app adicionales.

---

### 2. `send-contact-form` — 2 emails

Llamado desde: `src/pages/Contact.tsx`

| Email | Para | Subject | Variables |
|---|---|---|---|
| Notificación interna | hola@vittare.mx | [Contacto] {motivo} — {nombre} | name, email, subject, message |
| Confirmación al usuario | Email del contacto | Recibimos tu mensaje — Vittare | name, message |

---

### 3. `send-newsletter` — masivo

Llamado desde: `src/pages/marketing/MarketingPostEditor.tsx`

| Email | Para | Subject | Variables |
|---|---|---|---|
| Newsletter | Todos los suscriptores activos | Título del post | title, excerpt, cover_image_url, slug |

Verifica rol admin/marketing. Marca el post como enviado con timestamp.

---

## Archivos

```
supabase/functions/
├── _shared/
│   ├── emailLayout.ts        ← Wrapper HTML base (header, body, footer)
│   └── emailComponents.ts    ← emailH1, emailP, emailButton, emailHighlight, emailAlert, emailDivider, emailSignOff
├── send-notification-email/
│   └── index.ts              ← 9 templates actualizados
├── send-contact-form/
│   └── index.ts              ← 2 emails actualizados
└── send-newsletter/
    └── index.ts              ← Newsletter actualizado
```

## Deploy

```bash
supabase functions deploy send-notification-email
supabase functions deploy send-contact-form
supabase functions deploy send-newsletter
```

## Verificación en Resend

Asegúrate de que `vittare.mx` esté verificado como dominio en Resend Dashboard → Domains.
