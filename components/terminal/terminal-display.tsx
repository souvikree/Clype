'use client'

import { forwardRef } from 'react'
import { TerminalTab } from '@/lib/terminal-store'

export const Terminal = forwardRef<
  HTMLDivElement,
  {
    tab: TerminalTab
  }
>(({ tab }, ref) => {
  const getLineColor = (type: string) => {
    switch (type) {
      case 'prompt':
        return 'text-foreground font-mono'
      case 'error':
        return 'text-destructive font-mono'
      case 'system':
        return 'text-muted-foreground font-mono'
      case 'message':
        return 'text-accent font-mono'
      default:
        return 'text-foreground font-mono'
    }
  }

  return (
    <div
      ref={ref}
      className="flex-1 overflow-y-auto bg-background p-4 space-y-1 font-mono text-sm"
    >
      {tab.history.map((line) => (
        <div key={line.id} className={getLineColor(line.type)}>
          {line.type === 'prompt' ? (
            <span>{line.content}</span>
          ) : (
            <>
              {line.author && <span className="text-primary">[{line.author}]</span>}
              <span> {line.content}</span>
            </>
          )}
        </div>
      ))}
    </div>
  )
})

Terminal.displayName = 'Terminal'
