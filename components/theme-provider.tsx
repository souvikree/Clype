'use client'

import { useEffect } from 'react'
import { useThemeStore, themes } from '@/lib/theme-store'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { currentTheme } = useThemeStore()
  const theme = themes[currentTheme]

  useEffect(() => {
    const root = document.documentElement

    // Apply color variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
      root.style.setProperty(cssVar, value)
    })

    // Apply effects as data attributes
    root.dataset.glassEffect = String(theme.effects.glassEffect)
    root.dataset.scanlines = String(theme.effects.scanlines)
    root.dataset.glow = String(theme.effects.glow)
    root.dataset.pixelated = String(theme.effects.pixelated)
    root.dataset.blur = String(theme.effects.blur)

    // Apply theme class
    root.className = `theme-${theme.id}`
  }, [theme])

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=JetBrains+Mono:wght@400;500;700&family=Share+Tech+Mono&family=VT323&family=Audiowide&family=Fira+Code:wght@400;500;700&family=Space+Grotesk:wght@400;500;700&family=Source+Code+Pro:wght@400;500;700&display=swap');

        /* Scanline effect */
        [data-scanlines="true"]::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.15),
            rgba(0, 0, 0, 0.15) 1px,
            transparent 1px,
            transparent 2px
          );
          pointer-events: none;
          z-index: 9999;
          animation: scanline 8s linear infinite;
        }

        @keyframes scanline {
          0% { transform: translateY(0); }
          100% { transform: translateY(10px); }
        }

        /* Glow effect */
        [data-glow="true"] .glow {
          filter: drop-shadow(0 0 8px currentColor);
        }

        /* Glass effect */
        [data-glass-effect="true"] .glass {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* Pixelated effect */
        [data-pixelated="true"] {
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
        }

        /* Cyber cursor */
        .theme-cyberpunk,
        .theme-matrix,
        .theme-neon {
          cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="%23ff00ff" d="M3 3 L3 21 L11 13 L16 21 L19 19 L14 11 L21 11 L3 3 Z"/></svg>'), auto;
        }

        /* Smooth theme transitions */
        * {
          transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
        }

        /* Neon text glow */
        .neon-text {
          text-shadow: 
            0 0 10px currentColor,
            0 0 20px currentColor,
            0 0 30px currentColor;
        }

        /* Cyber button */
        .cyber-button {
          position: relative;
          overflow: hidden;
        }

        .cyber-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.5s;
        }

        .cyber-button:hover::before {
          left: 100%;
        }

        /* Terminal blink */
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }

        .terminal-cursor {
          animation: blink 1s infinite;
        }
      `}</style>
      {children}
    </>
  )
}