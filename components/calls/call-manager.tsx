"use client";

import { useTerminalStore } from "@/lib/terminal-store";
import { VoiceCall } from "./voice-call";
import { VideoCall } from "./video-call";
import { IncomingCall } from "./incoming-call";
import { Phone, Video } from "lucide-react";
import { useEffect } from "react";
import { useWindowStore } from "@/lib/window-store";

export function CallManager() {
  const { call, endCall, activeTabId, setActiveTab } = useTerminalStore();

  // CRITICAL FIX: Open windows IMMEDIATELY when call becomes active (not just IN_CALL)
  // This ensures receiver sees the window when they receive the call
  useEffect(() => {
    if (call.active && call.roomId && call.type) {
      if (call.type === "voice") {
        useWindowStore.getState().openWindow(`voice-${call.roomId}`, "voice");
      }
      if (call.type === "video") {
        useWindowStore.getState().openWindow(`video-${call.roomId}`, "video");
      }
    }
  }, [call.active, call.roomId, call.type]);

  // Check if we're on the call's tab
  const isOnCallTab = call.tabId === activeTabId;

  // CRITICAL FIX: Show incoming call UI when call is incoming and ringing
  const isIncomingCall = call.active && call.isIncoming && call.status === "RINGING";

  // CRITICAL: Handle incoming call accept/reject
  const handleAcceptCall = () => {
    console.log("📞 Accepting call...");
    
    // Update call status to IN_CALL
    useTerminalStore.setState((s) => ({
      call: {
        ...s.call,
        status: "IN_CALL",
        isIncoming: false,
      },
    }));
  };

  const handleRejectCall = () => {
    console.log("📞 Rejecting call...");
    endCall();
  };

  // CRITICAL: Show incoming call UI FIRST if call is incoming and ringing
  if (isIncomingCall && call.type && call.peerName) {
    return (
      <IncomingCall
        callerName={call.peerName}
        callType={call.type}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
      />
    );
  }

  // Don't show anything if no active call or missing info
  if (!call.active || !call.type || !call.peerName) return null;

  // If on a different tab, show a floating indicator (only when IN_CALL)
  if (!isOnCallTab && call.status === "IN_CALL") {
    return (
      <div className="fixed top-4 right-4 z-[9998]">
        <button
          onClick={() => call.tabId && setActiveTab(call.tabId)}
          className="flex items-center gap-3 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-lg transition-all duration-200 animate-pulse"
        >
          {call.type === "voice" ? <Phone size={20} /> : <Video size={20} />}
          <div className="text-left">
            <div className="font-semibold text-sm">
              {call.type === "voice" ? "Voice" : "Video"} call active
            </div>
            <div className="text-xs opacity-90">with {call.peerName}</div>
          </div>
        </button>
      </div>
    );
  }

  // CRITICAL FIX: Render call UI when:
  // 1. Status is IN_CALL (normal flow)
  // 2. Status is RINGING and NOT incoming (caller waiting for answer)
  const shouldShowCallUI = 
    call.status === "IN_CALL" || 
    (call.status === "RINGING" && !call.isIncoming);

  if (!shouldShowCallUI) return null;

  return (
    <>
      {call.type === "voice" && call.roomId && (
        <VoiceCall
          mateId={call.roomId}
          mateName={call.peerName}
          onCallEnd={endCall}
        />
      )}

      {call.type === "video" && call.roomId && (
        <VideoCall
          mateId={call.roomId}
          mateName={call.peerName}
          onCallEnd={endCall}
        />
      )}
    </>
  );
}