import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import VideoCall from '@/components/VideoCall'
import PostSessionDialog from '@/components/PostSessionDialog'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export default function VideoSession() {
  const { appointmentId } = useParams<{ appointmentId: string }>()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [showPostSession, setShowPostSession] = useState(false)
  const [isPsychologist, setIsPsychologist] = useState(false)
  const [patientName, setPatientName] = useState('')

  // Show loading spinner while auth initializes (prevents calling edge function without JWT)
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
      </div>
    )
  }

  // Redirect if not authenticated
  if (!user) {
    navigate('/')
    return null
  }

  if (!appointmentId) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <p className="text-white">Cita no encontrada</p>
      </div>
    )
  }

  const handleLeave = () => {
    if (isPsychologist) {
      setShowPostSession(true)
    } else {
      navigate(-1)
    }
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-950">
      {/* Barra superior con botón de salida */}
      {!showPostSession && (
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
          <span className="text-sm text-gray-400 font-medium">Vittare · Sesión en curso</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLeave}
            className="text-gray-300 hover:text-white hover:bg-red-900/50 gap-2"
          >
            <LogOut className="w-4 h-4" />
            Salir de la sesión
          </Button>
        </div>
      )}

      <div className="flex-1 min-h-0">
        {!showPostSession ? (
          <VideoCall
            appointmentId={appointmentId}
            onLeave={handleLeave}
            onRoleDetected={(role, patName) => {
              setIsPsychologist(role === 'owner')
              setPatientName(patName)
            }}
          />
        ) : (
          <PostSessionDialog
            appointmentId={appointmentId}
            patientName={patientName}
            onComplete={() => navigate('/therapist/sessions')}
          />
        )}
      </div>
    </div>
  )
}
