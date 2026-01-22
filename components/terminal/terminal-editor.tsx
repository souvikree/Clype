'use client'

import { useEffect, useRef, useState } from 'react'
import { TerminalTab } from '@/lib/terminal-store'
import { useTerminalStore } from '@/lib/terminal-store'
import { useAuthStore } from '@/lib/auth-store'
import { Terminal } from './terminal-display'
import { TerminalInput } from './terminal-input'

export function TerminalEditor({ tab }: { tab: TerminalTab }) {
  const { addLine, setCommandInput, updateTab } = useTerminalStore()
  const { user, token } = useAuthStore()
  const [sessionCode, setSessionCode] = useState<string | null>(tab.sessionCode || null)
  const [connectedMate, setConnectedMate] = useState<string | null>(tab.mateUsername || null)
  const terminalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Auto-scroll to bottom
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [tab.history])

  const handleCommand = async (input: string) => {
    if (!input.trim()) return

    // Add user's command to history
    addLine(tab.id, {
      id: `line-${Date.now()}`,
      content: `${tab.username} : ${tab.type} > ${input}`,
      type: 'prompt',
      author: tab.username,
      timestamp: new Date(),
    })

    const command = input.toLowerCase().trim()

    // Parse and execute command
    if (command === 'my-address') {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/rooms/my-address/${tab.type}`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        const data = await response.json()
        const code = data.sessionCode

        addLine(tab.id, {
          id: `line-${Date.now()}`,
          content: `Server generated code: ${code}`,
          type: 'system',
          timestamp: new Date(),
        })

        setSessionCode(code)
        updateTab(tab.id, { sessionCode: code, sessionId: data.sessionId })
      } catch (error) {
        addLine(tab.id, {
          id: `line-${Date.now()}`,
          content: `Error: Failed to generate address`,
          type: 'error',
          timestamp: new Date(),
        })
      }
    } else if (command.startsWith('connect-mate ')) {
      const mateCode = command.substring('connect-mate '.length)
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/rooms/connect/${mateCode}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              sessionType: tab.type,
              mySessionId: tab.sessionId,
            }),
          }
        )

        if (response.ok) {
          const data = await response.json()
          addLine(tab.id, {
            id: `line-${Date.now()}`,
            content: `Connected! RoomID: ${data.roomId}`,
            type: 'system',
            timestamp: new Date(),
          })
          setConnectedMate('Mate')
          updateTab(tab.id, { roomId: data.roomId, mateUsername: 'Mate' })
        } else {
          addLine(tab.id, {
            id: `line-${Date.now()}`,
            content: `Error: Invalid or expired code`,
            type: 'error',
            timestamp: new Date(),
          })
        }
      } catch (error) {
        addLine(tab.id, {
          id: `line-${Date.now()}`,
          content: `Error: Connection failed`,
          type: 'error',
          timestamp: new Date(),
        })
      }
    } else if (command === 'help') {
      addLine(tab.id, {
        id: `line-${Date.now()}`,
        content: `Available commands:\n  my-address          - Get your session code\n  connect-mate <code> - Connect with peer's code\n  exit-${tab.type}       - Close this session`,
        type: 'system',
        timestamp: new Date(),
      })
    } else if (command === `exit-${tab.type}`) {
      addLine(tab.id, {
        id: `line-${Date.now()}`,
        content: `Session closed.`,
        type: 'system',
        timestamp: new Date(),
      })
    } else {
      addLine(tab.id, {
        id: `line-${Date.now()}`,
        content: `Unknown command. Type 'help' for commands.`,
        type: 'error',
        timestamp: new Date(),
      })
    }

    setCommandInput(tab.id, '')
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <Terminal ref={terminalRef} tab={tab} />
      <div className="border-t border-border bg-card p-4">
        <TerminalInput tab={tab} onCommand={handleCommand} />
      </div>
    </div>
  )
}
