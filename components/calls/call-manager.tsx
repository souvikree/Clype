'use client'

import { useTerminalStore } from '@/lib/terminal-store'
import { VoiceCall } from './voice-call'
import { VideoCall } from './video-call'

export function CallManager() {
  const { call, endCall } = useTerminalStore()

  if (!call.active || !call.type || !call.peerName) return null

  return (
    <div className="fixed inset-0 z-40 bg-black/90">
      {call.type === 'voice' && (
        <VoiceCall
          mateId={call.roomId!}
          mateName={call.peerName}
          onCallEnd={endCall}
        />
      )}

      {call.type === 'video' && (
        <VideoCall
          mateId={call.roomId!}
          mateName={call.peerName}
          onCallEnd={endCall}
        />
      )}
    </div>
  )
}
