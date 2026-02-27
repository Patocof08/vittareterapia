import { useEffect, useRef, useState } from 'react'
import DailyIframe from '@daily-co/daily-js'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Video } from 'lucide-react'

interface VideoCallProps {
  appointmentId: string
  onLeave?: () => void
  onRoleDetected?: (role: 'owner' | 'participant', patientName: string) => void
}

export default function VideoCall({ appointmentId, onLeave, onRoleDetected }: VideoCallProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initCall()
    return () => {
      if (frameRef.current) {
        frameRef.current.destroy()
        frameRef.current = null
      }
    }
  }, [appointmentId])

  const initCall = async () => {
    try {
      setLoading(true)

      // Validate time window
      const { data: appt } = await supabase
        .from('appointments')
        .select('id, start_time, status')
        .eq('id', appointmentId)
        .single()

      if (!appt || (appt.status !== 'pending' && appt.status !== 'confirmed')) {
        setError('Esta cita no está activa')
        setLoading(false)
        return
      }

      const diffMin = (new Date(appt.start_time).getTime() - Date.now()) / (1000 * 60)
      if (diffMin > 15) {
        setError(`La sesión aún no está disponible. Puedes unirte en ${Math.ceil(diffMin - 15)} minuto(s).`)
        setLoading(false)
        return
      }
      if (diffMin < -120) {
        setError('El tiempo de la sesión ha expirado')
        setLoading(false)
        return
      }

      // Call edge function
      const { data, error: fnError } = await supabase.functions.invoke('create-video-room', {
        body: { appointment_id: appointmentId },
      })
      if (fnError) throw fnError

      // Notify parent of role
      onRoleDetected?.(
        data.is_owner ? 'owner' : 'participant',
        data.patient_name || 'Paciente'
      )

      setLoading(false)

      // Wait for container to be in DOM
      await new Promise<void>(resolve => setTimeout(resolve, 50))
      if (!containerRef.current) return

      const frame = DailyIframe.createFrame(containerRef.current, {
        iframeStyle: { width: '100%', height: '100%', border: 'none' },
        theme: { colors: { accent: '#059669', accentText: '#FFFFFF' } },
      })
      frameRef.current = frame

      frame.on('left-meeting', () => { onLeave?.() })
      frame.join({ url: data.room_url, token: data.token })
    } catch (err: any) {
      console.error('Error initializing call:', err)
      setError(err.message || 'Error al iniciar la videollamada')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
          <p className="text-gray-300">Iniciando videollamada...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="text-center space-y-4">
          <Video className="w-16 h-16 mx-auto text-gray-500" />
          <p className="text-lg font-medium text-white">{error}</p>
          <Button
            onClick={() => onLeave?.()}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>
    )
  }

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
