"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useTerminalStore } from "@/lib/terminal-store";
import { useAuthStore } from "@/lib/auth-store";
import { TerminalTabBar } from "./terminal-tab-bar";
import { TerminalEditor } from "./terminal-editor";
import { CallManager } from "../calls/call-manager";
import { ThemeSwitcher } from "../theme-switcher";
import { Button } from "@/components/ui/button";
import { Power, Wifi, Cpu, Activity } from "lucide-react";
import { Radar, Shield } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { MessageSquare, Mic, Video, Lock, Zap, Gamepad2 } from 'lucide-react'
import { WebSocketClient } from "@/lib/websocket-client";

export function TerminalWorkspace() {
  const router = useRouter();
  const { tabs, activeTabId, clearTabs, addTab } = useTerminalStore();
  const { logout, user } = useAuthStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const initialized = useRef(false);
  const [time, setTime] = useState(new Date());
  const [fps, setFps] = useState(0);
  const [ping, setPing] = useState(0);
  const [wsClient, setWsClient] = useState<WebSocketClient | null>(null);
  const call = useTerminalStore((s) => s.call);

  useEffect(() => {
  const interval = setInterval(() => {
    setPing(wsClient?.getPing() || 0)
  }, 1000)
  return () => clearInterval(interval)
}, [])

  useEffect(() => {
    let frames = 0;
    let last = performance.now();

    const loop = (now: number) => {
      frames++;
      if (now - last >= 1000) {
        setFps(frames);
        frames = 0;
        last = now;
      }
      requestAnimationFrame(loop);
    };

    const id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!initialized.current && tabs.length === 0) {
      initialized.current = true;
      addTab("chat");
    }
  }, [tabs.length, addTab]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClose = () => {
    clearTabs();
    logout();
    router.push("/login");
  };

  return (
    <div className="h-screen w-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Call Manager */}
      <CallManager />

      {/* Header */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="glass border-b border-primary/30 px-6 py-3 flex items-center justify-between relative z-10"
      >
        {/* Left: Logo & Status */}
        <div className="flex items-center gap-6">
          <motion.h1
            className="text-2xl font-bold font-mono neon-text glow"
            animate={{
              textShadow: [
                "0 0 10px currentColor",
                "0 0 20px currentColor",
                "0 0 10px currentColor",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            &gt; CLYPE
          </motion.h1>

          {/* Status Indicators */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1 text-cyan-400">
              <Cpu size={12} />
              <span>v2.077</span>
            </div>
            <div className="flex items-center gap-1 text-purple-400">
              <Activity size={12} className="animate-pulse" />
              <span>{tabs.length} SESSIONS</span>
            </div>
          </div>
        </div>

        {/* Center: User Info */}
        <div className="font-mono text-sm text-muted-foreground">
          <span className="text-primary">
            {user?.displayName || user?.email}
          </span>
          <span className="mx-2">|</span>
          <span>{time.toLocaleTimeString()}</span>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          <ThemeSwitcher />

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="gap-2 cyber-button hover:bg-destructive/20 hover:text-destructive font-mono"
          >
            <Power size={16} />
            SHUTDOWN
          </Button>
        </div>
      </motion.div>

      {/* Tab Bar */}
      <TerminalTabBar />

      {/* Terminal Content */}
      <div className="flex-1 overflow-hidden relative">
        {tabs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex items-center justify-center"
          >
            <div className="text-center space-y-6 max-w-md">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl mb-4"
              >
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent mb-2">
                Clype
              </h1>
              </motion.div>
              <div className="font-mono">
                <p className="text-2xl font-bold mb-2 neon-text">
                  NO ACTIVE SESSIONS
                </p>
                <p className="text-sm text-muted-foreground">
                  Initialize a new terminal session to begin
                </p>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Create new chat tabs with code-based pairing</span>
              </div>
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-accent" />
                <span className="text-sm text-muted-foreground">Launch voice calls with peer-to-peer encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-secondary" />
                <span className="text-sm text-muted-foreground">Start video sessions with full privacy</span>
              </div>
            </div>
          </motion.div>
        ) : activeTab ? (
          <TerminalEditor tab={activeTab} />
        ) : null}
      </div>

      {/* Footer Status Bar */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="glass border-t border-primary/30 px-4 py-2 flex items-center justify-between text-xs font-mono text-muted-foreground"
      >
        <div className="flex items-center gap-3">
          <Wifi size={14} className="text-green-400" />
          <span>ONLINE</span>

          <Radar size={14} className="text-cyan-400" />
          <span>{ping} ms</span>

          <Cpu size={14} className="text-purple-400" />
          <span>{fps} FPS</span>

          <Shield size={14} className="text-green-500" />
          <span>SECURE</span>
        </div>

        <div className="flex items-center gap-2 text-primary">
          <span>STATUS:</span>
          <span className="glow">{call.status || "READY"}</span>
        </div>
      </motion.div>
    </div>
  );
}
