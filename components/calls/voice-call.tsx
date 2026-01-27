"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { PhoneOff, Mic, MicOff, Minimize2, Maximize2, X } from "lucide-react";
import { useTerminalStore } from "@/lib/terminal-store";
import { useWindowStore } from "@/lib/window-store";
import { motion, useDragControls } from "framer-motion";
import { Button } from "../ui/button";

interface VoiceCallProps {
  mateId: string;
  mateName: string;
  onCallEnd: () => void;
}

export function VoiceCall({ mateId, mateName, onCallEnd }: VoiceCallProps) {
  const { call } = useTerminalStore();
  const windowState = useWindowStore((s) =>
    s.windows.find((w) => w.id === `voice-${mateId}`),
  );
  const {
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    restoreWindow,
    bringToFront,
    updatePosition,
  } = useWindowStore();

  // CRITICAL: State must persist across minimize/maximize
  const [isMuted, setIsMuted] = useState(false);
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(20).fill(0));
  const [latency, setLatency] = useState(0);
  const [bitrate, setBitrate] = useState({ audio: 0, video: 0 });

  // CRITICAL: Refs must persist
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const dragControls = useDragControls();
  const windowRef = useRef<HTMLDivElement>(null);
  
  // CRITICAL: Store WebRTC peer in ref
  const webrtcPeerRef = useRef(call.webrtcPeer);

  // Open window on mount
  useEffect(() => {
    useWindowStore.getState().openWindow(`voice-${mateId}`, "voice");
    return () => {
      closeWindow(`voice-${mateId}`);
    };
  }, [mateId, closeWindow]);

  // CRITICAL FIX: Setup audio streams with proper error handling
  useEffect(() => {
    if (!call.webrtcPeer) return;

    webrtcPeerRef.current = call.webrtcPeer;

    // Setup LOCAL audio
    const setupLocalAudio = () => {
      const localStream = call.webrtcPeer!.getLocalStream();
      if (localStream && localAudioRef.current) {
        const audio = localAudioRef.current;
        
        // Only update if different stream
        if (audio.srcObject !== localStream) {
          console.log("🎤 Setting local audio stream", localStream.getAudioTracks());
          audio.srcObject = localStream;
        }
        
        audio.muted = true; // Must be muted to prevent echo
        audio.autoplay = true;
        
        // CRITICAL: Force play
        audio.play().catch((err) => {
          console.error("Local audio play failed:", err);
        });
      }
    };

    // Setup REMOTE audio
    const setupRemoteAudio = () => {
      const remoteStream = call.webrtcPeer!.getRemoteStream();
      if (remoteStream && remoteStream.getTracks().length > 0) {
        const audio = remoteAudioRef.current;
        if (audio) {
          // Only update if different stream
          if (audio.srcObject !== remoteStream) {
            console.log("🎤 Setting remote audio stream", remoteStream.getAudioTracks());
            audio.srcObject = remoteStream;
          }
          
          audio.autoplay = true;
          audio.volume = 1.0; // Ensure full volume
          
          // CRITICAL: Force play
          audio.play().catch((err) => {
            console.error("Remote audio play failed:", err);
          });
          
          setRemoteConnected(true);
        }
      }
    };

    setupLocalAudio();
    setupRemoteAudio();

    // CRITICAL: Poll for remote stream (it may arrive late)
    const interval = setInterval(() => {
      const stream = call.webrtcPeer!.getRemoteStream();
      if (stream && stream.getTracks().length > 0 && !remoteConnected) {
        setupRemoteAudio();
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [call.webrtcPeer, remoteConnected]);

  // Audio visualizer & metrics updater
  useEffect(() => {
    if (!webrtcPeerRef.current) return;

    const interval = setInterval(async () => {
      if (!webrtcPeerRef.current) return;

      try {
        const levels = webrtcPeerRef.current.getAudioData();
        setAudioLevels(levels);

        const lat = await webrtcPeerRef.current.getLatency();
        setLatency(lat);

        const br = await webrtcPeerRef.current.getBitrate();
        setBitrate(br);
      } catch (err) {
        console.error("Metrics update failed:", err);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // CRITICAL FIX: Toggle must use ref
  const toggleMute = useCallback(() => {
    if (!webrtcPeerRef.current) return;

    const localStream = webrtcPeerRef.current.getLocalStream();
    const tracks = localStream?.getAudioTracks() || [];
    
    tracks.forEach((t) => {
      t.enabled = !t.enabled;
    });
    
    setIsMuted((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    onCallEnd();
    closeWindow(`voice-${mateId}`);
  }, [onCallEnd, closeWindow, mateId]);

  const enterFullscreen = useCallback(() => {
    windowRef.current?.requestFullscreen?.();
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    }
  }, []);

  if (!windowState) return null;

  const isMinimized = windowState.isMinimized;
  const isMaximized = windowState.isMaximized;

  // CRITICAL FIX: Minimized state - keep audio functional
  if (isMinimized) {
    return (
      <>
        {/* CRITICAL: Audio elements MUST be mounted at root level, not inside conditional */}
        <audio ref={localAudioRef} autoPlay muted playsInline className="hidden" />
        <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
        
        <div className="fixed bottom-4 left-4 z-9999 glass px-4 py-2 rounded-lg flex items-center gap-3 font-mono border border-purple-400/50">
          <Mic size={16} className="text-purple-400" />
          <span>{mateName}</span>

          <Button
            size="sm"
            variant="ghost"
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
            title="Mute"
            className={isMuted ? "bg-red-600/20 text-red-400" : ""}
          >
            {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
          </Button>

          <Button
            size="sm"
            variant="destructive"
            onClick={handleClose}
            aria-label="End call"
            title="End Call"
          >
            <PhoneOff size={16} />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => restoreWindow(`voice-${mateId}`)}
            aria-label="Restore call window"
            title="Restore"
          >
            <Maximize2 size={16} />
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      {/* CRITICAL: Audio elements at root level, always mounted */}
      <audio ref={localAudioRef} autoPlay muted playsInline className="hidden" />
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      <motion.div
        ref={windowRef}
        drag={!isMaximized}
        dragControls={dragControls}
        dragMomentum={false}
        dragElastic={0}
        dragListener={false} // CRITICAL: Only title bar drags
        onDragEnd={(e, info) => {
          updatePosition(`voice-${mateId}`, {
            x: windowState.position.x + info.offset.x,
            y: windowState.position.y + info.offset.y,
          });
        }}
        style={{
          position: "fixed",
          left: isMaximized ? 0 : windowState.position.x,
          top: isMaximized ? 0 : windowState.position.y,
          width: isMaximized ? "100vw" : windowState.size.width,
          height: isMaximized ? "100vh" : windowState.size.height,
          zIndex: windowState.zIndex,
        }}
        onClick={() => bringToFront(`voice-${mateId}`)}
        className="glass border-2 border-primary/50 rounded-lg shadow-2xl overflow-hidden"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
      >
        {/* Title Bar */}
        <div
          onPointerDown={(e) => {
            if (!isMaximized) {
              dragControls.start(e);
            }
          }}
          className="bg-gradient-to-r from-purple-900/80 to-pink-900/80 backdrop-blur-sm px-4 py-2 flex items-center justify-between cursor-move border-b border-primary/30"
        >
          <div className="flex items-center gap-2 font-mono text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-white font-bold">VOICE CALL</span>
            <span className="text-purple-300">// {mateName}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => minimizeWindow(`voice-${mateId}`)}
              className="p-1 hover:bg-white/10 rounded transition"
              title="Minimize"
            >
              <Minimize2 size={16} />
            </button>
            <button
              onClick={() => {
                if (!isMaximized) {
                  maximizeWindow(`voice-${mateId}`);
                  enterFullscreen();
                } else {
                  restoreWindow(`voice-${mateId}`);
                  exitFullscreen();
                }
              }}
              className="p-1 hover:bg-white/10 rounded transition"
              title={isMaximized ? "Restore" : "Maximize"}
            >
              <Maximize2 size={16} />
            </button>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-red-500/20 rounded transition"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="h-[calc(100%-40px)] flex flex-col items-center justify-center bg-gradient-to-br from-black via-purple-950/20 to-pink-950/20 relative overflow-hidden">
          {/* Cyber Grid Background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,0,255,0.3) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,0,255,0.3) 1px, transparent 1px)
                `,
                backgroundSize: "40px 40px",
              }}
            />
          </div>

          {/* HUD Corners */}
          <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-cyan-400 pointer-events-none" />
          <div className="absolute top-4 right-4 w-12 h-12 border-r-2 border-t-2 border-cyan-400 pointer-events-none" />
          <div className="absolute bottom-20 left-4 w-12 h-12 border-l-2 border-b-2 border-cyan-400 pointer-events-none" />
          <div className="absolute bottom-20 right-4 w-12 h-12 border-r-2 border-b-2 border-cyan-400 pointer-events-none" />

          {/* Avatar */}
          <motion.div
            animate={{
              boxShadow: remoteConnected
                ? [
                    "0 0 20px rgba(255,0,255,0.5)",
                    "0 0 40px rgba(255,0,255,0.8)",
                    "0 0 20px rgba(255,0,255,0.5)",
                  ]
                : "0 0 10px rgba(100,100,100,0.3)",
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-2xl mb-6 border-4 border-cyan-400/50"
          >
            <span className="text-6xl font-bold text-white">
              {mateName.charAt(0).toUpperCase()}
            </span>
          </motion.div>

          {/* Name & Status */}
          <h2 className="text-3xl font-bold mb-2 neon-text text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            {mateName}
          </h2>
          <div className="flex items-center gap-2 mb-8 font-mono text-lg">
            {remoteConnected ? (
              <>
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400">CONNECTED</span>
              </>
            ) : (
              <>
                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                <span className="text-yellow-400">CONNECTING...</span>
              </>
            )}
          </div>

          {/* Audio Visualizer - 20 Bars */}
          <div className="flex items-end gap-1 h-32 mb-8">
            {audioLevels.map((level, i) => (
              <motion.div
                key={i}
                animate={{ height: `${Math.max(level * 100, 5)}%` }}
                transition={{ duration: 0.1 }}
                className="w-3 rounded-t-sm"
                style={{
                  backgroundColor:
                    level > 0.7
                      ? "#f0f" // Pink for high
                      : level > 0.4
                        ? "#0ff" // Cyan for medium
                        : "#a0a0a0", // Gray for low
                  boxShadow: level > 0.5 ? `0 0 10px currentColor` : "none",
                }}
              />
            ))}
          </div>

          {/* Network Metrics HUD */}
          <div className="absolute top-16 left-4 glass px-3 py-2 rounded border border-cyan-400/50 font-mono text-xs space-y-1 pointer-events-none">
            <div className="flex items-center gap-2 text-cyan-400">
              <span className="opacity-70">LATENCY:</span>
              <span className="font-bold">{latency}ms</span>
            </div>
            <div className="flex items-center gap-2 text-purple-400">
              <span className="opacity-70">AUDIO:</span>
              <span className="font-bold">
                {Math.round(bitrate.audio / 1000)}kbps
              </span>
            </div>
            <div className="flex items-center gap-2 text-green-400">
              <span className="opacity-70">STATUS:</span>
              <span className="font-bold">SECURE</span>
            </div>
          </div>

          {/* Controls */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-6">
            {/* Mute Button with Animation */}
            <motion.button
              type="button"
              onClick={toggleMute}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`relative p-5 rounded-full transition-all ${
                isMuted
                  ? "bg-red-600 shadow-lg shadow-red-500/50"
                  : "bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg shadow-purple-500/50"
              }`}
              aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
            >
              {isMuted ? <MicOff size={28} /> : <Mic size={28} />}

              {/* Mic Active Indicator (Google Meet style) */}
              {!isMuted && audioLevels.some((l) => l > 0.1) && (
                <motion.div
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="absolute inset-0 rounded-full border-4 border-green-400 pointer-events-none"
                />
              )}
            </motion.button>

            {/* End Call Button */}
            <motion.button
              type="button"
              onClick={handleClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-5 rounded-full bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/50 transition-all"
              aria-label="End call"
            >
              <PhoneOff size={28} />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  );
}