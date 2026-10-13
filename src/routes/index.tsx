import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  // Check if user is logged in
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null
  
  if (token) {
    return <Navigate to="/dashboard" />
  }
  
  return <Navigate to="/login" />
}
