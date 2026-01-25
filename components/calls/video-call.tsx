"use client";

import { useEffect, useRef, useState } from "react";
import { PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { useTerminalStore } from "@/lib/terminal-store";

interface VideoCallProps {
  mateId: string;
  mateName: string;
  onCallEnd: () => void;
}

export function VideoCall({ mateId, mateName, onCallEnd }: VideoCallProps) {
  const { call } = useTerminalStore();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [remoteConnected, setRemoteConnected] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!call.webrtcPeer) return;

    //local stream
    const localStream = call.webrtcPeer.getLocalStream();
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }

    // remote stream
    const remoteStream = call.webrtcPeer.getRemoteStream();
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      setRemoteConnected(true);
    }

    
    const interval = setInterval(() => {
      const stream = call.webrtcPeer!.getRemoteStream();
      if (stream && stream.getTracks().length > 0) {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
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

  const toggleVideo = () => {
    const localStream = call.webrtcPeer?.getLocalStream();
    const tracks = localStream?.getVideoTracks() || [];
    tracks.forEach((t) => (t.enabled = !t.enabled));
    setIsVideoOn(!isVideoOn);
  };

  return (
    <div className="w-full h-full bg-black flex flex-col relative">
      {/* Remote video (full screen) */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="flex-1 object-cover w-full h-full"
      />

      {/* Local video (picture-in-picture) */}
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        className="absolute bottom-24 right-4 w-40 h-40 rounded-lg border-2 border-white object-cover"
      />

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 p-6 bg-gradient-to-t from-black/80 to-transparent">
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
          onClick={toggleVideo}
          className="p-4 rounded-full bg-secondary hover:bg-secondary/80"
          aria-label={isVideoOn ? "Turn off camera" : "Turn on camera"}
        >
          {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
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

      {/* Connection status */}
      {!remoteConnected && (
        <div className="absolute top-4 left-4 text-white bg-black/60 px-4 py-2 rounded-lg">
          ⏳ Waiting for {mateName}...
        </div>
      )}
    </div>
  );
}