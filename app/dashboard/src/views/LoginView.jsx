import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth, DEMO_HINTS } from '../lib/auth'

export default function LoginView() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login({ phone, password })
      if (user.role === 'staff') navigate('/scanner', { replace: true })
      else if (user.role === 'stadium-rep') navigate('/revenue', { replace: true })
      else navigate(from === '/login' ? '/' : from, { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed')
      setLoading(false)
    }
  }

  const fillDemo = (account) => {
    setPhone(account.phone)
    setPassword(account.password)
    setError('')
  }

  const quickLogin = async (account) => {
    setError('')
    setLoading(true)
    try {
      const user = await login({ phone: account.phone, password: account.password })
      if (user.role === 'staff') navigate('/scanner', { replace: true })
      else if (user.role === 'stadium-rep') navigate('/revenue', { replace: true })
      else navigate(from === '/login' ? '/' : from, { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative px-4 py-8">
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 800px 600px at 50% 30%, rgba(255, 120, 73, 0.12), transparent 70%)'
      }} />

      <div className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* LEFT: Login form */}
        <div>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--accent)] rounded-sm accent-glow mb-5">
              <svg width="32" height="32" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="5" height="5" fill="#0a0c10"/>
                <rect x="9" y="2" width="5" height="5" fill="#0a0c10"/>
                <rect x="2" y="9" width="5" height="5" fill="#0a0c10"/>
                <rect x="9" y="9" width="5" height="5" fill="#0a0c10"/>
              </svg>
            </div>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-zinc-50 leading-none">
              Zweho<span className="text-[var(--accent)]">.</span>Park
            </h1>
            <p className="text-[11px] font-mono uppercase tracking-[0.28em] text-[var(--text-muted)] mt-3">
              Smartpark · Amahoro · Kigali
            </p>
          </div>

          <div className="panel-surface bg-[var(--bg-panel)]/95 backdrop-blur-sm border border-[var(--border)] rounded p-7 shadow-2xl shadow-black/40">
            <div className="mb-6">
              <h2 className="font-display text-xl font-medium text-zinc-50">Operations Console</h2>
              <p className="text-[12px] font-mono uppercase tracking-[0.18em] text-[var(--text-muted)] mt-1">Sign in to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--text-muted)] mb-2 font-medium">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+250 7XX XXX XXX"
                  required
                  autoComplete="tel"
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-sm px-4 py-3 text-[14px] font-mono text-zinc-100 placeholder-[var(--text-muted)] focus:border-[var(--accent)] outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--text-muted)] mb-2 font-medium">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-sm px-4 py-3 text-[14px] font-mono text-zinc-100 placeholder-[var(--text-muted)] focus:border-[var(--accent)] outline-none transition-colors"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-sm px-3 py-2 text-[12px] text-red-400 font-mono">
                  ⚠ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 text-zinc-900 font-semibold py-3 rounded-sm transition-opacity text-[13px] font-mono uppercase tracking-[0.18em] mt-2"
              >
                {loading ? 'Signing in...' : 'Enter Console →'}
              </button>
            </form>
          </div>

          <div className="text-center mt-6 text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Zweho Park v1.0 · CMU Africa · Confidential
          </div>
        </div>

        {/* RIGHT: Demo accounts panel */}
        <div className="lg:mt-[88px]">
          <div className="panel-surface bg-[var(--bg-panel)]/95 backdrop-blur-sm border border-[var(--border)] rounded shadow-2xl shadow-black/40">
            <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <h3 className="font-display text-[15px] font-medium text-zinc-50">Quick Login</h3>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--text-muted)] mt-0.5">
                  Dev mode · click to sign in
                </p>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] px-2 py-1 rounded-sm border bg-amber-500/10 text-amber-400 border-amber-500/30 font-medium">
                Dev only
              </span>
            </div>

            <div className="p-3 space-y-2">
              {DEMO_HINTS.map((acc, i) => {
                const roleStyles = {
                  admin: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
                  staff: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
                  'stadium-rep': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                }
                const initials = acc.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
                const access = {
                  admin: 'All 5 views',
                  staff: 'QR Scanner only',
                  'stadium-rep': 'Revenue + Analytics',
                }[acc.role]
                return (
                  <div key={i} className="border border-[var(--border)] hover:border-[var(--border-strong)] rounded-sm p-3 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-[13px] font-semibold flex-shrink-0 ${
                        acc.role === 'admin' ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-zinc-900' :
                        acc.role === 'staff' ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-zinc-900' :
                        'bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-900'
                      }`}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13px] text-zinc-100 font-medium">{acc.name}</span>
                          <span className={`text-[9px] font-mono uppercase tracking-[0.15em] px-1.5 py-0.5 rounded-sm border font-medium ${roleStyles[acc.role]}`}>
                            {acc.role}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5">{acc.phone}</div>
                        <div className="text-[10px] font-mono text-[var(--text-secondary)] mt-1">Access: {access}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => fillDemo(acc)}
                        className="flex-1 text-[10px] font-mono uppercase tracking-[0.15em] py-2 bg-[var(--bg-elevated)] hover:bg-zinc-700 border border-[var(--border)] rounded-sm font-medium text-zinc-200"
                      >
                        Fill form
                      </button>
                      <button
                        onClick={() => quickLogin(acc)}
                        disabled={loading}
                        className="flex-1 text-[10px] font-mono uppercase tracking-[0.15em] py-2 bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 text-zinc-900 rounded-sm font-semibold"
                      >
                        Sign in →
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="px-5 py-3 border-t border-[var(--border)]">
              <p className="text-[10px] font-mono text-[var(--text-muted)] leading-relaxed">
                ⚠ Remove this panel before production deployment. The real auth flow uses phone-based OTP via Bruno's <span className="text-zinc-300">/auth/login</span> endpoint.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}