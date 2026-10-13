import { useSession } from './auth-client'
import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

/**
 * PublicRoute component for pages that should only be accessible when NOT logged in
 * (like login, register, forgot password)
 * If user is already logged in, redirects to dashboard
 */
export function PublicRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const { data: session, isPending } = useSession()

  useEffect(() => {
    if (!isPending && session) {
      // User is logged in, redirect to dashboard
      navigate({ to: '/dashboard', replace: true })
    }
  }, [session, isPending, navigate])

  // Show loading while checking session
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg text-primary" />
          <p className="text-base-content/60">Loading...</p>
        </div>
      </div>
    )
  }

  // If user is logged in, don't render the page (redirect handled above)
  if (session) {
    return null
  }

  // User is not logged in, show the public page
  return <>{children}</>
}
