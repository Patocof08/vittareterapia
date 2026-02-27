import { useEffect, useRef } from 'react'
import DailyIframe from '@daily-co/daily-js'

interface VideoCallProps {
  roomUrl: string
  token?: string
  onLeave?: () => void
}

export default function VideoCall({ roomUrl, token, onLeave }: VideoCallProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const frame = DailyIframe.createFrame(containerRef.current, {
      iframeStyle: {
        width: '100%',
        height: '100%',
        border: 'none',
      },
      theme: {
        colors: {
          accent: '#059669',
          accentText: '#FFFFFF',
        },
      },
    })

    frame.on('left-meeting', () => {
      onLeave?.()
    })

    frame.join({ url: roomUrl, ...(token ? { token } : {}) })

    return () => {
      frame.destroy()
    }
  }, [roomUrl, token, onLeave])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
