import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import VideoCall from '@/components/VideoCall'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Video } from 'lucide-react'

export default function VideoSession() {
  const { appointmentId } = useParams<{ appointmentId: string }>()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [roomUrl, setRoomUrl] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/')
    }
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (user && appointmentId) {
      initCall()
    }
  }, [user, appointmentId])

  const initCall = async () => {
    if (!appointmentId) return
    try {
      setLoading(true)

      const { data: appt, error: apptError } = await supabase
        .from('appointments')
        .select('id, start_time, status')
        .eq('id', appointmentId)
        .single()

      if (apptError || !appt) {
        setError('Cita no encontrada')
        setLoading(false)
        return
      }

      if (appt.status !== 'pending' && appt.status !== 'confirmed') {
        setError('Esta cita no está activa')
        setLoading(false)
        return
      }

      const diffMin = (new Date(appt.start_time).getTime() - Date.now()) / (1000 * 60)

      if (diffMin > 15) {
        const minutesLeft = Math.ceil(diffMin - 15)
        setError(`La sesión aún no está disponible. Puedes unirte en ${minutesLeft} minuto(s).`)
        setLoading(false)
        return
      }

      if (diffMin < -30) {
        setError('El tiempo de la sesión ha expirado')
        setLoading(false)
        return
      }

      const { data, error: fnError } = await supabase.functions.invoke('create-video-room', {
        body: { appointment_id: appointmentId },
      })

      if (fnError) throw fnError

      setRoomUrl(data.room_url)
      setToken(data.token)
    } catch (err: any) {
      console.error('Error initializing call:', err)
      setError(err.message || 'Error al iniciar la videollamada')
    } finally {
      setLoading(false)
    }
  }

  const handleLeave = () => {
    navigate(-1)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
          <p className="text-gray-300">Iniciando videollamada...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center space-y-4">
          <Video className="w-16 h-16 mx-auto text-gray-500" />
          <p className="text-lg font-medium text-white">{error}</p>
          <Button
            onClick={() => navigate(-1)}
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

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLeave}
          className="text-gray-300 hover:text-white hover:bg-gray-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Salir de la sesión
        </Button>
      </div>
      <div className="flex-1 min-h-0">
        {roomUrl && token && (
          <VideoCall roomUrl={roomUrl} token={token} onLeave={handleLeave} />
        )}
      </div>
    </div>
  )
}
