'use client'

import { useState } from 'react'
import { useTerminalStore } from '@/lib/terminal-store'
import { X, Plus, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'


const SESSION_TYPES = [
  { id: 'chat', label: 'Chat', icon: '💬' },
  { id: 'voice', label: 'Voice Call', icon: '🎙️' },
  { id: 'video', label: 'Video Call', icon: '📹' },
]

export function TerminalTabBar() {
  const { tabs, activeTabId, addTab, removeTab, setActiveTab } = useTerminalStore()
  const [showDropdown, setShowDropdown] = useState(false)

  const handleAddTab = (type: 'chat' | 'voice' | 'video') => {
    addTab(type)
    setShowDropdown(false)
  }

  return (
    <div className="bg-card border-b border-border px-2 py-2 flex items-center gap-1 overflow-x-auto">
      {/* Tab List */}
      <div className="flex gap-1 flex-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded border transition-all
              ${tab.isActive
                ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/20'
                : 'bg-background border-border text-muted-foreground hover:border-accent hover:text-accent'
              }
            `}
          >
            <span>{tab.type === 'chat' ? '💬' : tab.type === 'voice' ? '🎙️' : '📹'}</span>
            <span className="font-mono text-sm font-semibold">
              {tab.type.charAt(0).toUpperCase() + tab.type.slice(1)}
            </span>
            <span
              role="button"
              title={`Close ${tab.type} tab`}
              onClick={(e) => {
                e.stopPropagation()
                removeTab(tab.id)
              }}
              className="ml-1 hover:text-destructive transition cursor-pointer flex items-center"
            >
              <X size={14} />
            </span>

          </button>
        ))}
      </div>

      {/* Add Tab Button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1">
            <Plus size={18} />
            <ChevronDown size={14} />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          {SESSION_TYPES.map((type) => (
            <DropdownMenuItem
              key={type.id}
              onSelect={() => handleAddTab(type.id as 'chat' | 'voice' | 'video')}
              className="font-mono cursor-pointer"
            >
              <span className="mr-2">{type.icon}</span>
              {type.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

    </div>
  )
}
