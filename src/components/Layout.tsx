import { useState } from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useTheme } from '../contexts/ThemeContext'
import { useSession, signOut } from '../lib/auth-client'

interface LayoutProps {
  children: React.ReactNode
}

const menuItems = [
  { icon: '📊', label: 'Dashboard',           path: '/dashboard' },
  { icon: '👥', label: 'Users',               path: '/users' },
  { icon: '🚗', label: 'Driver Applications', path: '/drivers' },
  { icon: '📋', label: 'Bookings',            path: '/bookings' },
  { icon: '💬', label: 'Support Cases',       path: '/support' },
  { icon: '💰', label: 'Financial Reports',   path: '/financials' },
  { icon: '📄', label: 'Policies',            path: '/policies' },
  { icon: '⚙️', label: 'Settings',            path: '/settings' },
]

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate()
  const router = useRouterState()
  const currentPath = router.location.pathname
  const { isDark, toggleTheme } = useTheme()
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const isActive = (path: string) =>
    currentPath === path ||
    (path !== '/dashboard' && currentPath.startsWith(path))

  const handleLogout = async () => {
    await signOut()
    navigate({ to: '/login', replace: true })
  }

  return (
    <div className="min-h-screen bg-base-100 text-base-content">

      {/* ── Appbar ──────────────────────────────────────── */}
      <header className={`fixed top-0 left-0 right-0 h-14 z-20 flex items-center justify-between px-4 shadow-md ${isDark ? 'bg-base-300' : 'bg-primary'}`}>
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            aria-label="Toggle sidebar"
            className={`btn btn-ghost btn-sm hover:bg-base-content/10 ${isDark ? 'text-base-content' : 'text-primary-content'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <div>
              <p className={`text-lg font-bold leading-none ${isDark ? 'text-base-content' : 'text-primary-content'}`}>PATULOD</p>
              <p className="text-xs text-secondary leading-none">Admin Portal</p>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {session?.user && (
            <div className="text-right hidden md:block mr-1">
              <p className={`text-sm font-medium ${isDark ? 'text-base-content' : 'text-primary-content'}`}>
                {session.user.name}
              </p>
              <p className={`text-xs ${isDark ? 'text-base-content/60' : 'text-primary-content/60'}`}>
                {session.user.email}
              </p>
            </div>
          )}

          <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className={`btn btn-ghost btn-sm hover:bg-base-content/10 ${isDark ? 'text-base-content' : 'text-primary-content'}`}
          >
            {isDark ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M18.364 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z" />
              </svg>
            )}
          </button>

          <button
            onClick={handleLogout}
            className={`btn btn-ghost btn-sm hover:bg-base-content/10 ${isDark ? 'text-base-content' : 'text-primary-content'}`}
          >
            Logout
          </button>
        </div>
      </header>

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className={`fixed top-14 left-0 bottom-0 z-10 bg-base-100 border-r border-base-300 transition-all duration-300 overflow-hidden ${sidebarOpen ? 'w-56' : 'w-0'}`}>
        <nav className="p-2 space-y-0.5">
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-left transition-colors border-l-4
                ${isActive(item.path)
                  ? 'bg-primary/10 text-primary border-primary pl-2'
                  : 'text-base-content hover:bg-base-200 border-transparent pl-2'
                }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* ── Main content ────────────────────────────────── */}
      <main className={`transition-all duration-300 pt-14 min-h-screen ${sidebarOpen ? 'ml-56' : 'ml-0'}`}>
        <div className="p-4">
          {children}
        </div>
      </main>

    </div>
  )
}
