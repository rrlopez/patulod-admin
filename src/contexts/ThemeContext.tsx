import { createContext, useContext, useEffect, useState } from 'react'

interface ThemeContextType {
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme')
      if (saved) {
        return saved === 'dark'
      }
      // Default to light mode (not system preference)
      return false
    }
    return false
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const html = document.documentElement
      if (isDark) {
        html.setAttribute('data-theme', 'patulod-dark')
        localStorage.setItem('theme', 'dark')
      } else {
        html.setAttribute('data-theme', 'patulod')
        localStorage.setItem('theme', 'light')
      }
    }
  }, [isDark])

  // Set initial theme on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const html = document.documentElement
      html.setAttribute('data-theme', isDark ? 'patulod-dark' : 'patulod')
    }
  }, [])

  const toggleTheme = () => setIsDark(prev => !prev)

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
