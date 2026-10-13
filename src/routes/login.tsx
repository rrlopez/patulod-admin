import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'

export const Route = createFileRoute('/login')({
  component: Login,
})

function Login() {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }
    setIsLoading(true)
    setTimeout(() => {
      if (email === 'admin@patulod.com' && password === 'admin123') {
        localStorage.setItem('adminToken', 'mock-token')
        navigate({ to: '/dashboard' })
      } else {
        setError('Invalid email or password')
      }
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="btn btn-ghost btn-sm fixed top-4 right-4"
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M18.364 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        )}
      </button>

      <div className="w-full max-w-5xl flex gap-8 items-center">
        {/* Branding */}
        <div className="hidden lg:flex flex-1 flex-col justify-center">
          <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-secondary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
          </div>
          <h1 className="text-6xl font-bold text-primary mb-2">PATULOD</h1>
          <p className="text-2xl font-medium text-base-content mb-1">Admin Portal</p>
          <p className="text-lg text-primary/70 mb-4">
            Patulod, Kaluganan a gayyem mo.
          </p>
          <div className="h-1 w-24 rounded-full bg-secondary mb-4" />
          <p className="text-base-content/60 text-lg leading-relaxed max-w-md">
            Safer Rides, Stronger Livelihoods.
            <br />A Greener Tomorrow.
          </p>
        </div>

        {/* Form card */}
        <div className="flex-1 max-w-md w-full">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-secondary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-primary">PATULOD</h1>
            <p className="text-sm text-primary/70 mt-1">Admin Portal</p>
          </div>

          <div className="card bg-base-200 border border-base-300 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-2xl text-primary">Welcome Back</h2>
              <p className="text-base-content/60 text-sm mb-2">
                Sign in to access the admin dashboard
              </p>

              {error && (
                <div role="alert" className="alert alert-error py-2 text-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Email Address</legend>
                  <input
                    type="email"
                    placeholder="admin@patulod.com"
                    className="input input-bordered w-full"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </fieldset>

                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Password</legend>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className="input input-bordered w-full pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowPassword((s) => !s)}
                    >
                      {showPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </fieldset>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary checkbox-sm"
                    />
                    Remember me
                  </label>
                  <a href="#" className="link link-primary text-sm">
                    Forgot password?
                  </a>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              <div className="divider text-xs text-base-content/40">
                Demo Credentials
              </div>
              <div className="bg-base-300 rounded-lg p-3 text-xs font-mono space-y-1">
                <p>
                  <span className="text-primary font-semibold">Email:</span>{' '}
                  admin@patulod.com
                </p>
                <p>
                  <span className="text-primary font-semibold">Password:</span>{' '}
                  admin123
                </p>
              </div>
            </div>
          </div>

          <p className="text-center mt-4 text-xs text-base-content/40">
            Phase 0.5 • Mock UI
          </p>
        </div>
      </div>
    </div>
  )
}
