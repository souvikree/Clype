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
import { motion, useDragControls } from "framer-motion";
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

  // CRITICAL: State must persist across minimize/maximize
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [latency, setLatency] = useState(0);
  const [bitrate, setBitrate] = useState({ video: 0, audio: 0 });
  const [fps, setFps] = useState(0);
  const [pipPosition, setPipPosition] = useState({ x: 0, y: 0 });

  // CRITICAL: Refs must persist - don't recreate on re-render
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pipRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const windowRef = useRef<HTMLDivElement>(null);

  // CRITICAL: Store WebRTC peer in ref to prevent loss on re-render
  const webrtcPeerRef = useRef(call.webrtcPeer);

  // Open window on mount
  useEffect(() => {
    useWindowStore.getState().openWindow(`video-${mateId}`, "video");
    return () => {
      closeWindow(`video-${mateId}`);
    };
  }, [mateId, closeWindow]);

  // CRITICAL FIX: Setup media streams with proper error handling
  useEffect(() => {
    if (!call.webrtcPeer) return;

    webrtcPeerRef.current = call.webrtcPeer;

    // Setup LOCAL stream
    const setupLocalStream = () => {
      const localStream = call.webrtcPeer!.getLocalStream()
      if (localStream && localVideoRef.current) {
        const video = localVideoRef.current

        if (video.srcObject !== localStream) {
          video.srcObject = localStream
        }

        video.muted = true
        video.playsInline = true
        video.autoplay = true
      }
    }

    // Setup REMOTE stream
    const setupRemoteStream = () => {
      const remoteStream = call.webrtcPeer!.getRemoteStream()
      if (remoteStream && remoteStream.getTracks().length > 0 && remoteVideoRef.current) {
        const video = remoteVideoRef.current

        if (video.srcObject !== remoteStream) {
          video.srcObject = remoteStream
        }

        video.playsInline = true
        video.autoplay = true
        setRemoteConnected(true)
      }
    }

    // Setup immediately
    setupLocalStream();
    setupRemoteStream();

    // CRITICAL: Poll for remote stream (it may arrive late)
    const interval = setInterval(() => {
      const stream = call.webrtcPeer!.getRemoteStream();
      if (stream && stream.getTracks().length > 0 && !remoteConnected) {
        setupRemoteStream();
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [call.webrtcPeer, remoteConnected]);

  // Metrics updater
  useEffect(() => {
    if (!webrtcPeerRef.current) return;

    const interval = setInterval(async () => {
      if (!webrtcPeerRef.current) return;

      const lat = await webrtcPeerRef.current.getLatency();
      setLatency(lat);

      const br = await webrtcPeerRef.current.getBitrate();
      setBitrate(br);

      const f = await webrtcPeerRef.current.getFPS();
      setFps(f);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // CRITICAL FIX: Toggle functions must use ref, not state
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

  // CRITICAL FIX: Minimized state - keep all controls functional
  if (isMinimized) {
    return (
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
          onClick={() => restoreWindow(`video-${mateId}`)}
        >
          <Maximize2 size={16} />
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      ref={windowRef}
      drag={!isMaximized}
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0}
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
        onPointerDown={(e) => !isMaximized && dragControls.start(e)}
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
        {/* Remote Video (Full Screen) - FIXED object-fit */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-contain bg-black"
        />

        {/* CRITICAL FIX: Stats OUTSIDE draggable - Top Left HUD */}
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

        {/* CRITICAL FIX: Draggable PiP - ONLY video, no stats */}
        <Draggable
          nodeRef={pipRef}
          position={pipPosition}
          onDrag={(e, data) => setPipPosition({ x: data.x, y: data.y })}
          bounds="parent"
        >
          <div
            ref={pipRef}
            className="absolute top-20 right-4 cursor-move z-20"
            style={{ pointerEvents: 'auto' }}
          >
            <div className="glass border-2 border-cyan-400/50 rounded-lg overflow-hidden shadow-2xl">
              {/* PiP Video */}
              <div className="relative group">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-48 h-36 object-cover rounded-lg bg-black"
                />

                {/* Move Handle */}
                <div className="absolute top-2 left-2 p-1 bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <Move size={14} className="text-cyan-400" />
                </div>

                {/* Video Off Overlay */}
                {!isVideoOn && (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center rounded-lg">
                    <VideoOff size={32} className="text-gray-400" />
                  </div>
                )}

                {/* Local Video Label */}
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-xs text-white font-mono pointer-events-none">
                  You
                </div>
              </div>
            </div>
          </div>
        </Draggable>

        {/* Connection Status */}
        {!remoteConnected && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10">
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
            {/* Mute Button */}
            <motion.button
              type="button"
              onClick={toggleMute}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`p-4 rounded-full transition-all ${isMuted
                ? "bg-red-600 shadow-lg shadow-red-500/50"
                : "bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                }`}
              aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </motion.button>

            {/* Video Toggle */}
            <motion.button
              type="button"
              onClick={toggleVideo}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`p-4 rounded-full transition-all ${!isVideoOn
                ? "bg-red-600 shadow-lg shadow-red-500/50"
                : "bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                }`}
              aria-label={isVideoOn ? "Turn off camera" : "Turn on camera"}
            >
              {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
            </motion.button>

            {/* End Call Button */}
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
  );
}