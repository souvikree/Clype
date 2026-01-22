'use client'

import React from "react"

import { TerminalTab } from '@/lib/terminal-store'
import { useTerminalStore } from '@/lib/terminal-store'

export function TerminalInput({
  tab,
  onCommand,
}: {
  tab: TerminalTab
  onCommand: (command: string) => void
}) {
  const { setCommandInput } = useTerminalStore()

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onCommand(tab.commandInput)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-primary font-mono font-bold">{tab.username} : {tab.type} {'>'}</span>
      <input
        type="text"
        value={tab.commandInput}
        onChange={(e) => setCommandInput(tab.id, e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type command..."
        autoFocus
        className="flex-1 bg-input border border-border rounded px-3 py-2 font-mono text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  )
}
