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
      <div className="h-screen flex items-center justify-center" style={{ background: '#0D2117' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#12A357' }} />
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
      <div className="h-screen flex items-center justify-center" style={{ background: '#0D2117' }}>
        <p style={{ color: '#E8F7F3' }}>Cita no encontrada</p>
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
    <div className="h-screen w-screen flex flex-col" style={{ background: '#0D2117' }}>
      {/* Barra superior con botón de salida */}
      {!showPostSession && (
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b" style={{ background: '#1F4D2E', borderColor: '#2A5A3C' }}>
          <span className="text-sm font-medium" style={{ color: '#6AB7AB' }}>Vittare · Sesión en curso</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLeave}
            className="gap-2 hover:bg-red-900/40"
            style={{ color: '#BFE9E2' }}
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
