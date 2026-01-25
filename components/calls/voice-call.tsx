"use client";

import { useEffect, useRef, useState } from "react";
import { PhoneOff, Mic, MicOff } from "lucide-react";
import { useTerminalStore } from "@/lib/terminal-store";

interface VoiceCallProps {
  mateId: string;
  mateName: string;
  onCallEnd: () => void;
}

export function VoiceCall({ mateId, mateName, onCallEnd }: VoiceCallProps) {
  const { call } = useTerminalStore();
  const [isMuted, setIsMuted] = useState(false);
  const [remoteConnected, setRemoteConnected] = useState(false);

  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!call.webrtcPeer) return;

    const localStream = call.webrtcPeer.getLocalStream();
    if (localStream && localAudioRef.current) {
      localAudioRef.current.srcObject = localStream;
    }

    
    const remoteStream = call.webrtcPeer.getRemoteStream();
    if (remoteStream && remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
      setRemoteConnected(true);
    }

    
    const interval = setInterval(() => {
      const stream = call.webrtcPeer!.getRemoteStream();
      if (stream && stream.getTracks().length > 0) {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = stream;
        }
        setRemoteConnected(true);
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [call.webrtcPeer]);

  const toggleMute = () => {
    const localStream = call.webrtcPeer?.getLocalStream();
    const tracks = localStream?.getAudioTracks() || [];
    tracks.forEach((t) => (t.enabled = !t.enabled));
    setIsMuted(!isMuted);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-8 bg-background">
      <audio ref={localAudioRef} autoPlay muted hidden />
      <audio ref={remoteAudioRef} autoPlay hidden />

      <div className="text-4xl font-bold">{mateName}</div>
      <div className="text-lg text-muted-foreground">
        {remoteConnected ? "🟢 Connected" : "⏳ Connecting..."}
      </div>

      <div className="flex gap-6">
        <button
          type="button"
          onClick={toggleMute}
          className="p-4 rounded-full bg-secondary hover:bg-secondary/80"
          aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        <button
          type="button"
          onClick={onCallEnd}
          className="p-4 rounded-full bg-destructive hover:bg-destructive/80"
          aria-label="End call"
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
}