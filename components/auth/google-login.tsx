'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { 
  isTauri, 
  openOAuthUrl, 
  listenForOAuthCallback,
  getApiUrl
} from '@/lib/tauri-utils'

declare global {
  interface Window {
    google: any
  }
}

export function GoogleLoginComponent() {
  const router = useRouter()
  const { setUser, setToken, isLoading, setIsLoading } = useAuthStore()
  const [isDesktop, setIsDesktop] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>('')

  useEffect(() => {
    const tauri = isTauri()
    setIsDesktop(tauri)
    console.log('🖥️ Environment:', tauri ? 'Desktop (Tauri)' : 'Web')
  }, [])

  // ============================================================================
  // DESKTOP OAUTH: Listen for deep-link callback
  // ============================================================================
  useEffect(() => {
    if (!isDesktop) return

    let cleanupListener: (() => void) | null = null

    const setupDesktopOAuth = async () => {
      console.log('📡 Setting up desktop OAuth listener...')
      
      cleanupListener = await listenForOAuthCallback(async (url: string) => {
        try {
          console.log('🔗 Deep link received:', url)
          setDebugInfo('Processing login...')
          setIsLoading(true)

          // Parse: clype://oauth?data={"userId":"...","email":"...","name":"...","avatar":"...","token":"...","displayName":"..."}
          const urlObj = new URL(url)
          const dataParam = urlObj.searchParams.get('data')
          
          if (!dataParam) {
            console.error('❌ Missing data parameter in deep-link')
            setDebugInfo('Error: Invalid OAuth response')
            setIsLoading(false)
            return
          }

          // Decode and parse user data
          const userData = JSON.parse(decodeURIComponent(dataParam))
          
          console.log('✅ Parsed user data:', {
            userId: userData.userId,
            email: userData.email,
            name: userData.name,
            hasToken: !!userData.token
          })

          // CRITICAL FIX: Set auth state directly (bypass async login)
          // This prevents race condition with dashboard auth check
          setUser({
            id: userData.userId,
            email: userData.email,
            displayName: userData.displayName || userData.name,
            profilePicture: userData.avatar || ''
          })
          setToken(userData.token)
          
          console.log('✅ Auth state updated')
          console.log('✅ isAuthenticated:', useAuthStore.getState().isAuthenticated)
          
          // Wait for state to persist to localStorage
          await new Promise(resolve => setTimeout(resolve, 500))
          
          console.log('🚀 Redirecting to /dashboard...')
          setDebugInfo('Login successful!')
          setIsLoading(false)
          
          // Use window.location for guaranteed navigation
          router.push('/dashboard')
          
        } catch (error) {
          console.error('❌ Desktop OAuth error:', error)
          setDebugInfo('Login failed: ' + (error as Error).message)
          setIsLoading(false)
        }
      })

      console.log('✅ Desktop OAuth listener registered')
    }

    setupDesktopOAuth()

    return () => {
      if (cleanupListener) {
        console.log('🧹 Cleaning up OAuth listener')
        cleanupListener()
      }
    }
  }, [isDesktop, setUser, setToken, setIsLoading])

  // ============================================================================
  // WEB OAUTH: Google Sign-In button
  // ============================================================================
  useEffect(() => {
    if (isDesktop) return

    const initializeGoogleSignIn = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: async (response: any) => {
            try {
              const decoded = JSON.parse(atob(response.credential.split('.')[1]))
              
              // Call backend to create/login user
              const apiResponse = await fetch(`${getApiUrl()}/auth/google-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  googleId: decoded.sub,
                  email: decoded.email,
                  displayName: decoded.name || decoded.email,
                  profilePicture: decoded.picture || ''
                }),
              })

              if (!apiResponse.ok) throw new Error('Login failed')

              const data = await apiResponse.json()
              
              setUser({
                id: data.userId,
                email: data.email,
                displayName: data.displayName,
                profilePicture: data.profilePicture,
              })
              setToken(data.token)
              
              router.push('/dashboard')
            } catch (error) {
              console.error('Web login error:', error)
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
  }, [isDesktop, setUser, setToken, router])

  // ============================================================================
  // DESKTOP: Open browser for OAuth
  // ============================================================================
  const handleDesktopLogin = async () => {
    try {
      const apiUrl = getApiUrl()
      
      // Build OAuth URL that redirects to backend
      const authUrl = 
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(`${apiUrl}/auth/google/desktop`)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent('openid email profile')}&` +
        `access_type=offline&` +
        `prompt=select_account`
      
      console.log('🌐 Opening OAuth in browser...')
      console.log('📍 Redirect URI:', `${apiUrl}/auth/google/desktop`)
      setDebugInfo('Opening browser...')
      
      await openOAuthUrl(authUrl)
      
      console.log('✅ Browser opened')
      setDebugInfo('Complete login in browser...')
    } catch (error) {
      console.error('❌ Failed to open OAuth:', error)
      setDebugInfo('Failed to open browser')
    }
  }

  return (
    <div className="space-y-4">
      {isDesktop ? (
        <>
          <button
            onClick={handleDesktopLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isLoading ? 'Signing in...' : 'Sign in with Google'}
          </button>
          
          {process.env.NODE_ENV === 'development' && debugInfo && (
            <div className="text-xs text-gray-500 text-center p-2 bg-gray-800/50 rounded">
              {debugInfo}
            </div>
          )}
        </>
      ) : (
        <div id="google-signin-button" className="flex justify-center" />
      )}
      
      {isLoading && (
        <div className="text-center text-sm text-muted-foreground animate-pulse">
          Please wait...
        </div>
      )}
    </div>
  )
}