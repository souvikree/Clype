'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { useTerminalStore } from '@/lib/terminal-store'
import { Button } from '@/components/ui/button'
import { MessageSquare, Mic, Video, Lock, Zap, Gamepad2 } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuthStore()
  const { setUsername, addTab } = useTerminalStore()
  const [displayNameInput, setDisplayNameInput] = useState('')
  const [showUsernameModal, setShowUsernameModal] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    } else if (user?.displayName) {
      setDisplayNameInput(user.displayName)
      setUsername(user.displayName)
    }
  }, [isAuthenticated, user, router, setUsername])

  const handleStart = () => {
    if (displayNameInput.trim()) {
      setUsername(displayNameInput)
      router.push('/workspace')
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background flex flex-col items-center justify-center p-4">
     
      <div className="absolute top-4 right-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="text-muted-foreground hover:text-foreground bg-transparent"
        >
          Logout
        </Button>
      </div>

      <div className="w-full max-w-2xl">
        {/* Welcome Card */}
        <div className="bg-card border border-border rounded-lg p-12 shadow-2xl mb-8">
          <div className="text-center space-y-6">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent mb-2">
                {">"} Clype
              </h1>
              <p className="text-muted-foreground text-lg font-mono tracking-wide">
                Command-driven, privacy-first communication
              </p>
            </div>

            <div className="bg-background border border-border rounded p-4">
              <p className="text-sm text-muted-foreground font-mono tracking-wide mb-2">Logged in as:</p>
              <p className="text-foreground font-mono font-semibold tracking-wide">{user.email}</p>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="text-sm text-muted-foreground font-mono tracking-wide mb-2 block">
                  Your Display Name
                </span>
                <input
                  type="text"
                  value={displayNameInput}
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  placeholder="Enter your display name"
                  className="w-full px-4 py-2 bg-input border border-border rounded font-mono text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </label>

              <Button
                onClick={handleStart}
                size="lg"
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 
text-primary-foreground font-mono font-bold tracking-widest uppercase py-6
shadow-[0_0_30px_hsl(var(--primary)/0.5)]"
              >
                Start Terminal Workspace
              </Button>
            </div>

            {/* Feature Lines */}
            <div className="text-xs text-muted-foreground space-y-2 font-mono tracking-wide">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span>Create new chat tabs with code-based pairing</span>
              </div>
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-accent" />
                <span>Launch voice calls with peer-to-peer encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-secondary" />
                <span>Start video sessions with full privacy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Lock, title: 'Private', desc: 'No tracking, no logs' },
            { icon: Zap, title: 'Fast', desc: 'P2P encrypted' },
            { icon: Gamepad2, title: 'Built for Gamers', desc: 'Made for power users' },
          ].map((item, i) => {
            const Icon = item.icon
            return (
              <div
                key={i}
                className="bg-card/50 border border-border/50 rounded p-4 text-center hover:border-primary/50 transition"
              >
                <Icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                <h3 className="font-mono font-bold tracking-wider uppercase text-foreground text-sm">{item.title}</h3>
                <p className="text-xs text-muted-foreground font-mono tracking-wide">{item.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
