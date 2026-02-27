import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import VideoCall from '@/components/VideoCall'
import PostSessionDialog from '@/components/PostSessionDialog'

export default function VideoSession() {
  const { appointmentId } = useParams<{ appointmentId: string }>()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [showPostSession, setShowPostSession] = useState(false)
  const [isPsychologist, setIsPsychologist] = useState(false)
  const [patientName, setPatientName] = useState('')

  // Redirect if not authenticated
  if (!authLoading && !user) {
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
    <div className="h-screen w-screen bg-gray-950">
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
  )
}
