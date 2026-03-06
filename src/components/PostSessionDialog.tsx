import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { CheckCircle, UserX } from 'lucide-react'

interface PostSessionDialogProps {
  appointmentId: string
  patientName: string
  onComplete: () => void
}

export default function PostSessionDialog({ appointmentId, patientName, onComplete }: PostSessionDialogProps) {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'attendance' | 'done'>('attendance')

  const handleComplete = async (attended: boolean) => {
    setLoading(true)
    try {
      const newStatus = attended ? 'completed' : 'no_show'

      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', appointmentId)

      if (error) throw error

      // Revenue recognition en ambos casos — el paciente ya pagó, asista o no
      await supabase.rpc('recognize_session_revenue', {
        _appointment_id: appointmentId,
      })

      // Notificar al psicólogo que recibió pago
      try {
        const { data: apptData } = await supabase
          .from('appointments')
          .select('psychologist_id, subscription_id')
          .eq('id', appointmentId)
          .single()

        // Obtener precio por sesión desde deferred_revenue
        const { data: deferredData } = await supabase
          .from('deferred_revenue')
          .select('price_per_session')
          .eq(apptData?.subscription_id ? 'subscription_id' : 'appointment_id',
             apptData?.subscription_id || appointmentId)
          .maybeSingle()

        // Fallback: usar base_amount del payment si no hay price_per_session en deferred_revenue
        const { data: paymentData } = !deferredData?.price_per_session ? await supabase
          .from('payments')
          .select('base_amount')
          .eq('appointment_id', appointmentId)
          .maybeSingle() : { data: null }

        const sessionPrice = Number(deferredData?.price_per_session || paymentData?.base_amount || 0)

        if (apptData && sessionPrice > 0) {
          const psychCut = Math.round(sessionPrice * 0.85 * 100) / 100
          const { data: psychProfile } = await supabase
            .from('psychologist_profiles')
            .select('user_id, first_name')
            .eq('id', apptData.psychologist_id)
            .single()

          if (psychProfile?.user_id) {
            const { data: { session: authSession } } = await supabase.auth.getSession()
            if (authSession) {
              fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notification-email`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${authSession.access_token}`,
                  'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                },
                body: JSON.stringify({
                  notification_type: 'payment_update',
                  recipient_user_id: psychProfile.user_id,
                  variables: {
                    recipient_name: psychProfile.first_name || 'Psicólogo',
                    payment_description: `Sesión ${attended ? 'completada' : 'registrada como inasistencia'}. El pago ha sido acreditado a tu cuenta.`,
                    amount: `${psychCut.toLocaleString('es-MX', { minimumFractionDigits: 0 })} MXN`,
                    concept: `Tu parte (85%) de la sesión con ${patientName}`,
                  },
                }),
              }).catch(() => {})
            }
          }
        }
      } catch {
        // Best-effort
      }

      // Fetch transcript from Daily.co in background (fire and forget)
      if (attended) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-session-transcript`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ appointment_id: appointmentId }),
          }).catch(() => { /* silent — transcript can be fetched later from SessionDetail */ })
        }
      } else {
        // No-show: enviar email de notificación al paciente
        try {
          const { data: appointment } = await supabase
            .from('appointments')
            .select('patient_id, start_time')
            .eq('id', appointmentId)
            .single()

          if (appointment?.patient_id) {
            const sessionDate = new Date(appointment.start_time)

            await supabase.functions.invoke('send-notification-email', {
              body: {
                notification_type: 'no_show',
                recipient_user_id: appointment.patient_id,
                variables: {
                  recipient_name: patientName?.split(' ')[0] || 'Hola',
                  psychologist_name: 'tu psicólogo',
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
          }
        } catch {
          // Silent — la notificación es best-effort, no debe bloquear el flujo
        }
      }

      setStep('done')
    } catch (err) {
      console.error('Error registering session:', err)
    } finally {
      setLoading(false)
    }
  }

  if (step === 'done') {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Sesión registrada
          </h2>
          <p className="text-gray-500 mb-6">
            Los datos de la sesión han sido guardados correctamente.
          </p>
          <button
            onClick={onComplete}
            className="w-full px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium transition-colors"
          >
            Volver al dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">
          Sesión finalizada
        </h2>
        <p className="text-gray-500 mb-8 text-center">
          ¿{patientName} asistió a la sesión?
        </p>

        <div className="space-y-3">
          <button
            onClick={() => handleComplete(true)}
            disabled={loading}
            className="w-full flex items-center gap-3 px-5 py-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl hover:bg-emerald-100 hover:border-emerald-400 transition-all text-left group disabled:opacity-50"
          >
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center group-hover:bg-emerald-200 flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Sí, asistió</p>
              <p className="text-sm text-gray-500">Marcar sesión como completada</p>
            </div>
          </button>

          <button
            onClick={() => handleComplete(false)}
            disabled={loading}
            className="w-full flex items-center gap-3 px-5 py-4 bg-red-50 border-2 border-red-200 rounded-xl hover:bg-red-100 hover:border-red-400 transition-all text-left group disabled:opacity-50"
          >
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center group-hover:bg-red-200 flex-shrink-0">
              <UserX className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">No asistió</p>
              <p className="text-sm text-gray-500">Marcar como inasistencia</p>
            </div>
          </button>
        </div>

        {loading && (
          <div className="mt-6 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" />
          </div>
        )}
      </div>
    </div>
  )
}
