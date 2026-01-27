"use client";

import { useEffect, useState } from "react";
import { WebRTCClient } from "@/lib/webrtc-client";
import { Signal, SignalHigh, SignalMedium, SignalLow, AlertTriangle } from "lucide-react";

interface QualityMonitorProps {
  webrtcPeer: WebRTCClient | undefined;
  className?: string;
}

interface QualityStats {
  packetLoss: number;
  jitter: number;
  bandwidth: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

export function QualityMonitor({ webrtcPeer, className = "" }: QualityMonitorProps) {
  const [stats, setStats] = useState<QualityStats>({
    packetLoss: 0,
    jitter: 0,
    bandwidth: 0,
    quality: 'good'
  });

  useEffect(() => {
    if (!webrtcPeer) return;

    const interval = setInterval(async () => {
      try {
        const quality = await webrtcPeer.getQualityStats();
        setStats(quality);
      } catch (err) {
        console.error("Quality stats failed:", err);
      }
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [webrtcPeer]);

  const getQualityIcon = () => {
    switch (stats.quality) {
      case 'excellent':
        return <SignalHigh className="text-green-400" size={16} />;
      case 'good':
        return <Signal className="text-green-400" size={16} />;
      case 'fair':
        return <SignalMedium className="text-yellow-400" size={16} />;
      case 'poor':
        return <SignalLow className="text-red-400" size={16} />;
    }
  };

  const getQualityColor = () => {
    switch (stats.quality) {
      case 'excellent':
      case 'good':
        return 'text-green-400';
      case 'fair':
        return 'text-yellow-400';
      case 'poor':
        return 'text-red-400';
    }
  };

  const getQualityBg = () => {
    switch (stats.quality) {
      case 'excellent':
      case 'good':
        return 'bg-green-400/10 border-green-400/30';
      case 'fair':
        return 'bg-yellow-400/10 border-yellow-400/30';
      case 'poor':
        return 'bg-red-400/10 border-red-400/30';
    }
  };

  const showWarning = stats.quality === 'poor' || stats.packetLoss > 5;

  return (
    <div className={`glass px-3 py-2 rounded border font-mono text-xs space-y-1 ${getQualityBg()} ${className}`}>
      {/* Quality Indicator */}
      <div className="flex items-center gap-2 font-semibold">
        {getQualityIcon()}
        <span className={getQualityColor()}>
          {stats.quality.toUpperCase()}
        </span>
      </div>

      {/* Detailed Stats */}
      <div className="space-y-0.5 text-[10px]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Packet Loss:</span>
          <span className={stats.packetLoss > 3 ? 'text-red-400 font-bold' : 'text-white'}>
            {stats.packetLoss.toFixed(1)}%
          </span>
        </div>
        
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Jitter:</span>
          <span className={stats.jitter > 50 ? 'text-yellow-400' : 'text-white'}>
            {stats.jitter}ms
          </span>
        </div>
        
        {stats.bandwidth > 0 && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Bandwidth:</span>
            <span className="text-white">{stats.bandwidth}kbps</span>
          </div>
        )}
      </div>

      {/* Warning */}
      {showWarning && (
        <div className="flex items-center gap-1 text-red-400 pt-1 border-t border-red-400/30">
          <AlertTriangle size={12} />
          <span className="text-[10px]">Poor connection</span>
        </div>
      )}
    </div>
  );
}