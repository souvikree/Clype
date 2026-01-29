'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { useTerminalStore } from '@/lib/terminal-store'
import { TerminalWorkspace } from '@/components/terminal/terminal-workspace'

export default function WorkspacePage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const { username } = useTerminalStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated || !user || !username) {
    return null
  }

  return <TerminalWorkspace />
}
