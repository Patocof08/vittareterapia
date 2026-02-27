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
