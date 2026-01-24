'use client'

import { useRouter } from 'next/navigation'
import { useTerminalStore } from '@/lib/terminal-store'
import { useAuthStore } from '@/lib/auth-store'
import { TerminalTabBar } from './terminal-tab-bar'
import { TerminalEditor } from './terminal-editor'
import { Button } from '@/components/ui/button'
import { useRef, useEffect } from 'react'
import { CallManager } from '../calls/call-manager'

export function TerminalWorkspace() {
  const router = useRouter()
  const { tabs, activeTabId, clearTabs, addTab } = useTerminalStore()
  const { logout } = useAuthStore()
  const activeTab = tabs.find((t) => t.id === activeTabId)

  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current && tabs.length === 0) {
      initialized.current = true
      addTab('chat')
    }
  }, [tabs.length, addTab])

  const handleClose = () => {
    clearTabs()
    logout()
    router.push('/login')
  }

  return (
    <div className="h-screen w-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <CallManager />
      <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold font-mono bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          &gt; Clype
        </h1>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleClose}
          className="font-mono"
        >
          exit
        </Button>
      </div>

      {/* Tab Bar */}
      <TerminalTabBar />

      {/* Terminal Content */}
      <div className="flex-1 overflow-hidden">
        {tabs.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-muted-foreground space-y-4">
              <p className="text-lg font-mono">No tabs open</p>
              <p className="text-sm">Click the + button to start a new session</p>
            </div>
          </div>
        ) : activeTab ? (
          <TerminalEditor tab={activeTab} />
        ) : null}
      </div>
    </div>
  )
}
