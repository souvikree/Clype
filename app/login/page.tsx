'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { GoogleLoginComponent } from '@/components/auth/google-login'

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent mb-2">
            <span className="text-6xl mr-2 mt-2">{">"}</span>
             Clype
          </h1>
          <p className="text-muted-foreground text-sm">
            Real-time Communication. Powered by Code.
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-8 shadow-2xl">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Welcome</h2>
              <p className="text-sm text-muted-foreground">
                Sign in with your Google account to get started
              </p>
            </div>

            <GoogleLoginComponent />

            <div className="text-xs text-muted-foreground text-center">
              <p>Your privacy is our priority. All communications are encrypted.</p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>Made for gamers and tech users who value privacy</p>
        </div>
      </div>
    </div>
  )
}
