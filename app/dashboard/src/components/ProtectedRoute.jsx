import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function ProtectedRoute({ children, viewId }) {
  const { user, can, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--text-muted)] font-mono text-xs uppercase tracking-widest">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (viewId && !can(viewId)) {
    return <ForbiddenView />
  }

  return children
}

function ForbiddenView() {
  const { user, logout } = useAuth()
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="font-display text-6xl text-[var(--accent)] mb-4">403</div>
        <h2 className="font-display text-2xl text-zinc-100 mb-3">Access Restricted</h2>
        <p className="text-[14px] text-[var(--text-secondary)] mb-2">
          Your role <span className="font-mono text-zinc-200">({user?.role})</span> doesn't have permission to view this page.
        </p>
        <p className="text-[12px] text-[var(--text-muted)] font-mono mb-6">
          Contact the Product Lead if you believe this is a mistake.
        </p>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 text-[12px] font-mono uppercase tracking-[0.15em] bg-[var(--bg-elevated)] hover:bg-zinc-700 border border-[var(--border)] rounded-sm"
          >← Go back</button>
          <button
            onClick={logout}
            className="px-4 py-2 text-[12px] font-mono uppercase tracking-[0.15em] bg-[var(--accent)] text-zinc-900 rounded-sm font-semibold"
          >Sign out</button>
        </div>
      </div>
    </div>
  )
}