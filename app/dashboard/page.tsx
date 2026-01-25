'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { useTerminalStore } from '@/lib/terminal-store'
import { Button } from '@/components/ui/button'

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
                Clype
              </h1>
              <p className="text-muted-foreground text-lg">
                Command-driven, privacy-first communication
              </p>
            </div>

            <div className="bg-background border border-border rounded p-4">
              <p className="text-sm text-muted-foreground mb-2">Logged in as:</p>
              <p className="text-foreground font-mono font-semibold">{user.email}</p>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="text-sm text-muted-foreground mb-2 block">
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
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-semibold py-6"
              >
                Start Terminal Workspace
              </Button>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>💬 Create new chat tabs with code-based pairing</p>
              <p>🎙️ Launch voice calls with peer-to-peer encryption</p>
              <p>📹 Start video sessions with full privacy</p>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: '🔐', title: 'Private', desc: 'No tracking, no logs' },
            { icon: '⚡', title: 'Fast', desc: 'P2P encrypted' },
            { icon: '🎮', title: 'Built for Gamers', desc: 'Made for power users' },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-card/50 border border-border/50 rounded p-4 text-center hover:border-primary/50 transition"
            >
              <div className="text-2xl mb-2">{item.icon}</div>
              <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
