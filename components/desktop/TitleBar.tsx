'use client';

import { useState, useEffect } from 'react';
import { Minus, X, Maximize2, Minimize2 } from 'lucide-react';
import { minimizeWindow, maximizeWindow, closeWindow, isWindowMaximized, isTauri } from '@/lib/tauri-utils';

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [mounted, setMounted] = useState(false); // Add this state

  useEffect(() => {
    setMounted(true); // Flag that we are now on the client
    
    if (isTauri()) {
      const checkMaximized = async () => {
        const maximized = await isWindowMaximized();
        setIsMaximized(maximized);
      };
      checkMaximized();
      const interval = setInterval(checkMaximized, 500);
      return () => clearInterval(interval);
    }
  }, []);

  // Use the mounted flag to ensure server and client initial render match (both null)
  if (!mounted || !isTauri()) {
    return null;
  }

  return (
    <div
      data-tauri-drag-region
      className="fixed top-0 left-0 right-0 h-10 bg-black/40 backdrop-blur-md border-b border-cyan-500/20 flex items-center justify-between px-4 z-50 select-none"
    >
      {/* Left: App Logo/Title */}
      <div data-tauri-drag-region className="flex items-center gap-3">
        <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-purple-600 rounded" />
        <span className="text-xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent mb-2">
          {">"} Clype
        </span>
      </div>

      {/* Right: Window Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={minimizeWindow}
          className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded transition-colors"
          aria-label="Minimize"
        >
          <Minus className="w-4 h-4 text-gray-400" />
        </button>
        <button
          onClick={maximizeWindow}
          className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded transition-colors"
          aria-label={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? (
            <Minimize2 className="w-4 h-4 text-gray-400" />
          ) : (
            <Maximize2 className="w-4 h-4 text-gray-400" />
          )}
        </button>
        <button
          onClick={closeWindow}
          className="w-8 h-8 flex items-center justify-center hover:bg-red-600/80 rounded transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
}