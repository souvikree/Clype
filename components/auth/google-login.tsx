'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'

declare global {
  interface Window {
    google: any
  }
}

export function GoogleLoginComponent() {
  const router = useRouter()
  const { login, isLoading } = useAuthStore()

  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: async (response: any) => {
            try {
              const decoded = JSON.parse(atob(response.credential.split('.')[1]))
              await login(
                decoded.sub,
                decoded.email,
                decoded.name || decoded.email,
                decoded.picture || ''
              )
              router.push('/dashboard')
            } catch (error) {
              console.error('Login error:', error)
            }
          },
        })

        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          {
            type: 'standard',
            theme: 'filled_black',
            size: 'large',
            text: 'signin_with',
            width: '100%',
          }
        )
      }
    }

    const checkGoogleScript = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(checkGoogleScript)
        initializeGoogleSignIn()
      }
    }, 100)


    return () => clearInterval(checkGoogleScript)
  }, [login, router])

  return (
    <div className="space-y-4">
      <div id="google-signin-button" className="flex justify-center" />
      {isLoading && (
        <div className="text-center text-sm text-muted-foreground">Signing in...</div>
      )}
    </div>
  )
}
