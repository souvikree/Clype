'use client'

import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { TerminalTab } from '@/lib/terminal-store'
import { useThemeStore } from '@/lib/theme-store'
import { CheckCircle2, Info, AlertTriangle, PhoneCall, Wifi } from 'lucide-react'

const iconMap = {
  success: <CheckCircle2 className="w-4 h-4 text-green-400 glow" />,
  info: <Info className="w-4 h-4 text-blue-400 glow" />,
  error: <AlertTriangle className="w-4 h-4 text-red-400 glow" />,
  call: <PhoneCall className="w-4 h-4 text-purple-400 glow" />,
  signal: <Wifi className="w-4 h-4 text-cyan-400 glow" />,
}

export const Terminal = forwardRef<HTMLDivElement, { tab: TerminalTab }>(
  ({ tab }, ref) => {
    const { reducedMotion } = useThemeStore()

    const getLineColor = (type: string) => {
      switch (type) {
        case 'prompt':
          return 'text-foreground'
        case 'error':
          return 'text-destructive'
        case 'system':
          return 'text-accent'
        case 'message':
          return 'text-primary'
        default:
          return 'text-foreground'
      }
    }

    return (
      <div
        ref={ref}
        className="flex-1 overflow-y-auto glass p-6 space-y-2 font-mono text-sm relative"
        style={{
          background: 'radial-gradient(circle at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 100%)',
        }}
      >
        {tab.history.map((line, index) => {
          const Component = reducedMotion ? 'div' : motion.div

          return (
            <Component
              key={line.id}
              initial={!reducedMotion ? { opacity: 0, x: -20 } : undefined}
              animate={!reducedMotion ? { opacity: 1, x: 0 } : undefined}
              transition={!reducedMotion ? { duration: 0.3, delay: index * 0.05 } : undefined}
              className={`${getLineColor(line.type)} leading-relaxed`}
            >
              {line.type === 'prompt' ? (
                <div className="flex items-center gap-2">
                  <span className="text-primary glow">▸</span>
                  <span>{line.content}</span>
                </div>
              ) : (
                <div className="flex items-start gap-2 pl-4">
                  {line.author && (
                    <span className="text-secondary font-bold glow min-w-fit">
                      [{line.author}]
                    </span>
                  )}
                  <div className="flex items-start gap-2 flex-1">
                    {line.icon && <span>{iconMap[line.icon]}</span>}
                    <span>{line.content}</span>
                  </div>

                  <span className="text-muted-foreground text-xs opacity-50">
                    {line.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              )}
            </Component>
          )
        })}

        {/* Blinking Cursor */}
        <div className="flex items-center gap-2 mt-4">
          <span className="text-primary glow">▸</span>
          <span className="terminal-cursor inline-block w-2 h-4 bg-primary"></span>
        </div>
      </div>
    )
  }
)

Terminal.displayName = 'Terminal'