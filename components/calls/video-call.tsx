"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Minimize2,
  Maximize2,
  X,
  Move,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTerminalStore } from "@/lib/terminal-store";
import { useWindowStore } from "@/lib/window-store";
import { motion } from "framer-motion";
import Draggable from "react-draggable";

interface VideoCallProps {
  mateId: string;
  mateName: string;
  onCallEnd: () => void;
}

export function VideoCall({ mateId, mateName, onCallEnd }: VideoCallProps) {
  const { call } = useTerminalStore();
  const windowState = useWindowStore((s) =>
    s.windows.find((w) => w.id === `video-${mateId}`),
  );
  const {
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    restoreWindow,
    bringToFront,
    updatePosition,
  } = useWindowStore();

  // State
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [latency, setLatency] = useState(0);
  const [bitrate, setBitrate] = useState({ video: 0, audio: 0 });
  const [fps, setFps] = useState(0);
  const [pipPosition, setPipPosition] = useState({ x: 0, y: 0 });

  // Refs - CRITICAL: These must persist across minimize/maximize
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pipRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  // Store WebRTC peer in ref
  const webrtcPeerRef = useRef(call.webrtcPeer);

  // ✅ NEW: Store streams in refs (they persist even when video elements are destroyed)
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  // Open window on mount
  useEffect(() => {
    useWindowStore.getState().openWindow(`video-${mateId}`, "video");
    return () => {
      closeWindow(`video-${mateId}`);
    };
  }, [mateId, closeWindow]);

  // ✅ CRITICAL FIX: Setup media streams and store them in refs
  useEffect(() => {
    if (!call.webrtcPeer) return;

    webrtcPeerRef.current = call.webrtcPeer;

    // Setup LOCAL stream
    const setupLocalStream = () => {
      const localStream = call.webrtcPeer!.getLocalStream();
      if (localStream) {
        console.log("📹 Got local stream", localStream.getTracks());
        localStreamRef.current = localStream; // ✅ Store in ref

        // Attach to video element if it exists
        if (localVideoRef.current && localVideoRef.current.srcObject !== localStream) {
          localVideoRef.current.srcObject = localStream;
          localVideoRef.current.muted = true;
          localVideoRef.current.playsInline = true;
          localVideoRef.current.autoplay = true;
          localVideoRef.current.play().catch(console.error);
        }
      }
    };

    // Setup REMOTE stream
    const setupRemoteStream = () => {
      const remoteStream = call.webrtcPeer!.getRemoteStream();
      if (!remoteStream || remoteStream.getTracks().length === 0) return;

      console.log("📹 Got remote stream", remoteStream.getTracks());
      remoteStreamRef.current = remoteStream; // ✅ Store in ref

      // Attach to VIDEO element
      if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== remoteStream) {
        console.log("✅ Attaching remote stream to VIDEO element");
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch(console.warn);
      }

      // Attach to AUDIO element
      if (remoteAudioRef.current && remoteAudioRef.current.srcObject !== remoteStream) {
        console.log("✅ Attaching remote stream to AUDIO element");
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play().catch(console.warn);
      }

      setRemoteConnected(true);
    };

    setupLocalStream();
    setupRemoteStream();

    // Poll for remote stream
    const interval = setInterval(() => {
      const stream = call.webrtcPeer!.getRemoteStream();
      if (stream && stream.getTracks().length > 0 && !remoteConnected) {
        setupRemoteStream();
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [call.webrtcPeer, remoteConnected]);

  // ✅ CRITICAL FIX: Re-attach streams when video elements mount/remount
  useEffect(() => {
    // Re-attach local stream when localVideoRef becomes available
    if (localVideoRef.current && localStreamRef.current) {
      if (localVideoRef.current.srcObject !== localStreamRef.current) {
        console.log("🔄 Re-attaching local stream after restore");
        localVideoRef.current.srcObject = localStreamRef.current;
        localVideoRef.current.muted = true;
        localVideoRef.current.playsInline = true;
        localVideoRef.current.play().catch(console.error);
      }
    }
  }, [windowState?.isMinimized]); // Re-run when minimize state changes

  useEffect(() => {
    // Re-attach remote VIDEO stream when remoteVideoRef becomes available
    if (remoteVideoRef.current && remoteStreamRef.current) {
      if (remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
        console.log("🔄 Re-attaching remote VIDEO stream after restore");
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
        remoteVideoRef.current.play().catch(console.error);
      }
    }
  }, [windowState?.isMinimized]); // Re-run when minimize state changes

  useEffect(() => {
    // Re-attach remote AUDIO stream when remoteAudioRef becomes available
    if (remoteAudioRef.current && remoteStreamRef.current) {
      if (remoteAudioRef.current.srcObject !== remoteStreamRef.current) {
        console.log("🔄 Re-attaching remote AUDIO stream after restore");
        remoteAudioRef.current.srcObject = remoteStreamRef.current;
        remoteAudioRef.current.play().catch(console.error);
      }
    }
  }, [windowState?.isMinimized]); // Re-run when minimize state changes

  // Metrics updater
  useEffect(() => {
    if (!webrtcPeerRef.current) return;

    const interval = setInterval(async () => {
      if (!webrtcPeerRef.current) return;

      try {
        const lat = await webrtcPeerRef.current.getLatency();
        setLatency(lat);

        const br = await webrtcPeerRef.current.getBitrate();
        setBitrate(br);

        const f = await webrtcPeerRef.current.getFPS();
        setFps(f);
      } catch (err) {
        console.error("Metrics update failed:", err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Toggle functions
  const toggleMute = useCallback(() => {
    if (!webrtcPeerRef.current) return;

    const localStream = webrtcPeerRef.current.getLocalStream();
    const tracks = localStream?.getAudioTracks() || [];

    tracks.forEach((t) => {
      t.enabled = !t.enabled;
    });

    setIsMuted((prev) => !prev);
  }, []);

  const toggleVideo = useCallback(() => {
    if (!webrtcPeerRef.current) return;

    const localStream = webrtcPeerRef.current.getLocalStream();
    const tracks = localStream?.getVideoTracks() || [];

    tracks.forEach((t) => {
      t.enabled = !t.enabled;
    });

    setIsVideoOn((prev) => !prev);
  }, []);

  const restoreAndResumeAudio = useCallback(() => {
    restoreWindow(`video-${mateId}`);

    // Force audio resume on restore
    setTimeout(() => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.play().catch(console.error);
      }
    }, 100); // Small delay to ensure element is mounted
  }, [restoreWindow, mateId]);

  const handleClose = useCallback(() => {
    onCallEnd();
    closeWindow(`video-${mateId}`);
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

  // Minimized state
  if (isMinimized) {
    return (
      <>
        {/* ✅ Audio element ALWAYS renders */}
        <audio 
          ref={remoteAudioRef} 
          autoPlay 
          playsInline 
          className="hidden"
        />

        <div className="fixed bottom-4 left-4 z-[9999] glass px-4 py-2 rounded-lg flex items-center gap-3 border border-cyan-400/50">
          <Video size={16} className="text-cyan-400" />
          <span className="font-mono text-sm">{mateName}</span>

          <Button
            size="sm"
            variant="ghost"
            aria-label="Mute microphone"
            title="Mute"
            onClick={toggleMute}
            className={isMuted ? "bg-red-600/20 text-red-400" : ""}
          >
            {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            aria-label="Toggle camera"
            title="Camera"
            onClick={toggleVideo}
            className={!isVideoOn ? "bg-red-600/20 text-red-400" : ""}
          >
            {isVideoOn ? <Video size={16} /> : <VideoOff size={16} />}
          </Button>

          <Button
            size="sm"
            variant="destructive"
            aria-label="End call"
            title="End Call"
            onClick={handleClose}
          >
            <PhoneOff size={16} />
          </Button>

          <Button
            size="sm"
            variant="outline"
            aria-label="Restore window"
            title="Restore"
            onClick={restoreAndResumeAudio}
          >
            <Maximize2 size={16} />
          </Button>
        </div>
      </>
    );
  }

  // Full window state
  return (
    <>
      {/* ✅ Audio element ALWAYS renders */}
      <audio 
        ref={remoteAudioRef} 
        autoPlay 
        playsInline 
        className="hidden"
      />

      <motion.div
        ref={windowRef}
        drag={!isMaximized}
        dragMomentum={false}
        dragElastic={0}
        dragListener={false}
        onDragEnd={(e, info) => {
          updatePosition(`video-${mateId}`, {
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
        onClick={() => bringToFront(`video-${mateId}`)}
        className="glass border-2 border-cyan-400/50 rounded-lg shadow-2xl overflow-hidden"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
      >
        {/* Title Bar */}
        <div
          className="bg-gradient-to-r from-cyan-900/80 to-blue-900/80 backdrop-blur-sm px-4 py-2 flex items-center justify-between cursor-move border-b border-cyan-400/30"
        >
          <div className="flex items-center gap-2 font-mono text-sm">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            <span className="text-white font-bold">VIDEO CALL</span>
            <span className="text-cyan-300">// {mateName}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => minimizeWindow(`video-${mateId}`)}
              className="p-1 hover:bg-white/10 rounded transition"
              title="Minimize"
            >
              <Minimize2 size={16} />
            </button>
            <button
              onClick={() => {
                if (!isMaximized) {
                  maximizeWindow(`video-${mateId}`);
                  enterFullscreen();
                } else {
                  restoreWindow(`video-${mateId}`);
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

        {/* Video Content */}
        <div className="h-[calc(100%-40px)] relative bg-black overflow-hidden">
          {/* Remote Video - ✅ Key added to force re-render */}
          <video
            key={`remote-${isMinimized}`} // Force new element on restore
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-contain bg-black"
          />

          {/* Stats HUD */}
          <div className="absolute top-4 left-4 glass px-3 py-2 rounded border border-cyan-400/50 font-mono text-xs space-y-1 z-10 pointer-events-none">
            <div className="flex items-center gap-2 text-cyan-400">
              <span>PING</span>
              <span className="font-bold">
                {latency < 50 ? (
                  <span className="text-green-400">{latency}ms</span>
                ) : latency < 150 ? (
                  <span className="text-yellow-400">{latency}ms</span>
                ) : (
                  <span className="text-red-400">{latency}ms</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2 text-yellow-400">
              <span>FPS</span>
              <span className="font-bold">{fps}</span>
            </div>
            <div className="flex items-center gap-2 text-purple-400">
              <span>VID</span>
              <span className="font-bold">
                {Math.round(bitrate.video / 1000)}kbps
              </span>
            </div>
            <div className="flex items-center gap-2 text-pink-400">
              <span>AUD</span>
              <span className="font-bold">
                {Math.round(bitrate.audio / 1000)}kbps
              </span>
            </div>
          </div>

          {/* Draggable PiP - ✅ Key added to force re-render */}
          <Draggable
            nodeRef={pipRef}
            position={pipPosition}
            onDrag={(e, data) => {
              e.stopPropagation();
              setPipPosition({ x: data.x, y: data.y });
            }}
            bounds="parent"
          >
            <div
              ref={pipRef}
              className="absolute top-20 right-4 z-20"
              style={{
                pointerEvents: "auto",
                cursor: "move",
                touchAction: "none",
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="glass border-2 border-cyan-400/50 rounded-lg overflow-hidden shadow-2xl">
                <div className="relative group">
                  <video
                    key={`local-${isMinimized}`} // Force new element on restore
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-48 h-36 object-cover rounded-lg bg-black"
                  />

                  <div className="absolute top-2 left-2 p-1 bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <Move size={14} className="text-cyan-400" />
                  </div>

                  {!isVideoOn && (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center rounded-lg">
                      <VideoOff size={32} className="text-gray-400" />
                    </div>
                  )}

                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-xs text-white font-mono pointer-events-none">
                    You
                  </div>
                </div>
              </div>
            </div>
          </Draggable>

          {/* Connection Status */}
          {!remoteConnected && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10 pointer-events-none">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"
              />
              <div className="text-white font-mono text-lg">
                Waiting for {mateName}...
              </div>
            </div>
          )}

          {/* Controls Bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 z-10">
            <div className="flex items-center justify-center gap-4">
              <motion.button
                type="button"
                onClick={toggleMute}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`p-4 rounded-full transition-all ${
                  isMuted
                    ? "bg-red-600 shadow-lg shadow-red-500/50"
                    : "bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                }`}
                aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </motion.button>

              <motion.button
                type="button"
                onClick={toggleVideo}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`p-4 rounded-full transition-all ${
                  !isVideoOn
                    ? "bg-red-600 shadow-lg shadow-red-500/50"
                    : "bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                }`}
                aria-label={isVideoOn ? "Turn off camera" : "Turn on camera"}
              >
                {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
              </motion.button>

              <motion.button
                type="button"
                onClick={handleClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-4 rounded-full bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/50 transition-all"
                aria-label="End call"
              >
                <PhoneOff size={24} />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}