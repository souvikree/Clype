'use client'

import { useTerminalStore } from '@/lib/terminal-store'
import { VoiceCall } from './voice-call'
import { VideoCall } from './video-call'
import { Phone, Video } from 'lucide-react'

export function CallManager() {
  const { call, endCall, activeTabId, setActiveTab } = useTerminalStore()

  // 🔥 Only show full-screen call UI if we're on the call's tab
  const isOnCallTab = call.tabId === activeTabId

  if (!call.active || !call.type || !call.peerName) return null

  // If on a different tab, show a floating indicator 
  if (!isOnCallTab) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => call.tabId && setActiveTab(call.tabId)}
          className="flex items-center gap-3 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-lg transition-all duration-200 animate-pulse"
        >
          {call.type === 'voice' ? <Phone size={20} /> : <Video size={20} />}
          <div className="text-left">
            <div className="font-semibold text-sm">
              {call.type === 'voice' ? 'Voice' : 'Video'} call active
            </div>
            <div className="text-xs opacity-90">with {call.peerName}</div>
          </div>
        </button>
      </div>
    )
  }

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