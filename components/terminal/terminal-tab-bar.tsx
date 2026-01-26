'use client'

import { useState } from 'react'
import { useTerminalStore } from '@/lib/terminal-store'
import { X, Plus, ChevronDown, Mic, Video, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const SESSION_TYPES = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'voice', label: 'Voice Call', icon: Mic },
  { id: 'video', label: 'Video Call', icon: Video },
]

export function TerminalTabBar() {
  const { tabs, activeTabId, addTab, removeTab, setActiveTab, call } = useTerminalStore()
  const [showDropdown, setShowDropdown] = useState(false)

  const handleAddTab = (type: 'chat' | 'voice' | 'video') => {
    addTab(type)
    setShowDropdown(false)
  }

  return (
    <div className="relative bg-background/80 backdrop-blur-xl border-b border-purple-500/20 px-3 py-2 flex items-center gap-2 overflow-x-auto shadow-[0_0_20px_rgba(168,85,247,0.15)]">
      
      {/* Neon Glow Line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-60" />

      {/* Tabs */}
      <div className="flex gap-2 flex-1">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId
          const hasActiveCall = call.active && call.tabId === tab.id
          const Icon =
            tab.type === 'chat' ? MessageSquare : tab.type === 'voice' ? Mic : Video

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'group relative flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-mono transition-all duration-200',
                'bg-black/40 backdrop-blur-md',
                isActive
                  ? 'border-purple-500 text-purple-300 shadow-[0_0_18px_rgba(168,85,247,0.45)]'
                  : 'border-border text-muted-foreground hover:border-purple-400/60 hover:text-purple-300'
              )}
            >
              {/* Active Glow */}
              {isActive && (
                <span className="absolute inset-0 rounded-lg bg-purple-500/10 blur-md" />
              )}

              <Icon size={16} className="relative z-10" />
              <span className="relative z-10 tracking-wide">
                {tab.type.charAt(0).toUpperCase() + tab.type.slice(1)}
              </span>

              {/* Call Pulse */}
              {hasActiveCall && (
                <span className="relative z-10 ml-1 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
              )}

              {/* Close */}
              <span
                onClick={(e) => {
                  e.stopPropagation()
                  removeTab(tab.id)
                }}
                className="relative z-10 ml-1 opacity-0 group-hover:opacity-100 transition hover:text-red-400"
              >
                <X size={14} />
              </span>

              {/* Active underline */}
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-2/3 bg-gradient-to-r from-purple-400 via-fuchsia-500 to-purple-400 shadow-[0_0_12px_rgba(217,70,239,0.9)]" />
              )}
            </button>
          )
        })}
      </div>

      {/* Add Tab */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-purple-300 hover:text-purple-200 hover:bg-purple-500/10"
          >
            <Plus size={18} />
            <ChevronDown size={14} />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="bg-black/90 backdrop-blur-xl border border-purple-500/30 shadow-[0_0_25px_rgba(168,85,247,0.4)]"
        >
          {SESSION_TYPES.map((type) => {
            const Icon = type.icon
            return (
              <DropdownMenuItem
                key={type.id}
                onSelect={() => handleAddTab(type.id as 'chat' | 'voice' | 'video')}
                className="font-mono cursor-pointer gap-2 text-purple-200 hover:bg-purple-500/20 focus:bg-purple-500/20"
              >
                <Icon size={16} />
                {type.label}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
