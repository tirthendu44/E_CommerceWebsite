import React from 'react'
import { Navigate } from 'react-router-dom'

function getStoredUser() {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default function AdminRoute({ children }) {
  const user = getStoredUser()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!user.isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}