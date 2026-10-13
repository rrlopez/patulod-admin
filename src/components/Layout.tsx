import { Link, useRouterState } from '@tanstack/react-router'

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouterState()
  const currentPath = router.location.pathname
  
  // Mock session - in production this would come from better-auth
  const session = {
    user: {
      name: 'Admin User',
      email: 'admin@patulod.com',
    },
  }

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path + '/')

  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Users', path: '/users', icon: '👥' },
    { name: 'Bookings', path: '/bookings', icon: '📋' },
    { name: 'Drivers', path: '/drivers', icon: '🚗' },
    { name: 'Support', path: '/support', icon: '💬' },
    { name: 'Financials', path: '/financials', icon: '💰' },
    { name: 'Policies', path: '/policies', icon: '📜' },
    { name: 'Settings', path: '/settings', icon: '⚙️' },
  ]

  return (
    <div className="min-h-screen bg-base-100">
      {/* Navigation Sidebar */}
      <div className="drawer lg:drawer-open">
        <input id="main-drawer" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content flex flex-col">
          {/* Top Bar */}
          <div className="w-full navbar bg-base-200 border-b border-base-300">
            <div className="flex-none lg:hidden">
              <label htmlFor="main-drawer" className="btn btn-square btn-ghost">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="inline-block w-5 h-5 stroke-current"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </label>
            </div>
            <div className="flex-1 px-2 mx-2">
              <span className="text-lg font-bold text-primary">PATULOD Admin</span>
            </div>
            <div className="flex-none gap-2">
              {session?.user && (
                <div className="dropdown dropdown-end">
                  <label tabIndex={0} className="btn btn-ghost btn-circle avatar placeholder">
                    <div className="bg-primary text-primary-content rounded-full w-10">
                      <span className="text-xs">{session.user.name?.[0] || 'A'}</span>
                    </div>
                  </label>
                  <ul
                    tabIndex={0}
                    className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-200 rounded-box w-52"
                  >
                    <li>
                      <a className="justify-between">
                        Profile
                        <span className="badge">New</span>
                      </a>
                    </li>
                    <li>
                      <Link to="/settings">Settings</Link>
                    </li>
                    <li>
                      <a
                        onClick={() => {
                          localStorage.removeItem('adminToken')
                          window.location.href = '/login'
                        }}
                      >
                        Logout
                      </a>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="p-4 md:p-6">
            {children}
          </div>
        </div>

        {/* Sidebar */}
        <div className="drawer-side">
          <label htmlFor="main-drawer" className="drawer-overlay" />
          <aside className="bg-base-200 w-64 min-h-screen border-r border-base-300">
            <div className="p-4 border-b border-base-300">
              <h1 className="text-xl font-bold text-primary">PATULOD</h1>
              <p className="text-xs text-base-content/60">Admin Dashboard</p>
            </div>
            <ul className="menu p-4 space-y-1">
              {navigation.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 ${
                      isActive(item.path)
                        ? 'bg-primary text-primary-content'
                        : 'hover:bg-base-300'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </div>
  )
}
