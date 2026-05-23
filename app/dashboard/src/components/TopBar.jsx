import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { Icons } from './Icons'

const ALL_VIEWS = [
  { id: 'occupancy',  label: 'Overview',     path: '/',           icon: 'Home' },
  { id: 'zones',      label: 'Zones',        path: '/zones',      icon: 'Grid' },
  { id: 'bookings',   label: 'Bookings',     path: '/bookings',   icon: 'Receipt' },
  { id: 'revenue',    label: 'Revenue',      path: '/revenue',    icon: 'Chart' },
  { id: 'analytics',  label: 'Analytics',    path: '/analytics',  icon: 'Gauge' },
  { id: 'events',     label: 'Events',       path: '/events',     icon: 'Stadium' },
  { id: 'cameras',    label: 'Cameras',      path: '/cameras',    icon: 'Camera' },
  { id: 'staff',      label: 'Staff',        path: '/staff',      icon: 'User' },
  { id: 'scanner',    label: 'Gate Scan',    path: '/scanner',    icon: 'QrCode' },
  { id: 'scan-history', label: 'Scan History', path: '/scan-history', icon: 'Receipt' },
  { id: 'annotation', label: 'Annotate',     path: '/annotation', icon: 'Map' },
  { id: 'edge-devices', label: 'Edge Devices', path: '/edge-devices', icon: 'Server' },
  { id: 'api-docs',     label: 'API Docs',     path: '/api-docs',     icon: 'Code' },
  { id: 'settings',   label: 'Settings',     path: '/settings',   icon: 'Settings' },
]

export default function Shell({ now, children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, can } = useAuth()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const userMenuRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const visibleViews = ALL_VIEWS.filter(v => can(v.id))

  const currentView = ALL_VIEWS.find(v => v.path === location.pathname)
  const pageTitle = currentView?.label || 'Dashboard'
  const pageSubtitle = {
    occupancy: 'Operations · Tonight',
    bookings:  'Operations',
    revenue:   'Finance',
    analytics: 'Operations',
    events:    'Operations',
    cameras:   'Operations · CV',
    staff:     'Configuration',
    scanner:   'Operations · Gate',
    annotation:'Configuration · CV',
    settings:  'Configuration',
  }[currentView?.id] || 'Operations'

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--zp-bg)' }}>
      {/* Sidebar */}
      <aside
        className={`${mobileOpen ? 'flex' : 'hidden'} lg:flex flex-col fixed lg:relative z-40 h-screen lg:h-auto`}
        style={{
          width: 232,
          background: 'var(--zp-surface)',
          borderRight: '1px solid var(--zp-line)',
        }}
      >
        <div className="px-4 pt-6 pb-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: 'var(--zp-primary)' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="5" height="5" fill="#F4F0E8"/>
              <rect x="9" y="2" width="5" height="5" fill="#F4F0E8"/>
              <rect x="2" y="9" width="5" height="5" fill="#F4F0E8"/>
              <rect x="9" y="9" width="5" height="5" fill="#F4F0E8"/>
            </svg>
          </div>
          <div className="font-display text-lg leading-none" style={{ color: 'var(--zp-ink)' }}>
            Zweho<span style={{ color: 'var(--zp-accent)' }}>.</span>Park
          </div>
        </div>

        <div className="zp-eyebrow px-5 pt-5 pb-2">Operations</div>

        <nav className="px-2 flex-1 overflow-y-auto">
          {visibleViews.map(v => {
            const Icon = Icons[v.icon] || Icons.Home
            const active = location.pathname === v.path
            return (
              <button
                key={v.path}
                onClick={() => navigate(v.path)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-left mb-0.5 transition-colors"
                style={{
                  background: active ? 'var(--zp-primary-soft)' : 'transparent',
                  color: active ? 'var(--zp-primary)' : 'var(--zp-ink-2)',
                  fontWeight: active ? 600 : 500,
                  fontSize: 13,
                }}
              >
                <Icon size={18} stroke={active ? 1.8 : 1.6} />
                <span className="flex-1">{v.label}</span>
                {v.note && (
                  <span className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                    style={{ background: 'var(--zp-free-soft)', color: 'var(--zp-free)' }}>
                    {v.note}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* User card at bottom */}
        <div className="p-3 relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px]"
            style={{ background: 'var(--zp-surface-2)' }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
              style={{ background: 'var(--zp-primary)', color: '#fff' }}>
              {user?.initials || '?'}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-[13px] font-semibold truncate" style={{ color: 'var(--zp-ink)' }}>
                {user?.name?.split(' ').slice(0, 2).join(' ') || 'Guest'}
              </div>
              <div className="font-mono text-[10px]" style={{ color: 'var(--zp-ink-3)' }}>
                {user?.role || 'guest'}
              </div>
            </div>
            <Icons.More size={16} style={{ color: 'var(--zp-ink-3)' }} />
          </button>

          {userMenuOpen && (
            <div className="absolute bottom-20 left-3 right-3 rounded-[10px] shadow-xl fade-in z-50"
              style={{ background: 'var(--zp-surface)', border: '1px solid var(--zp-line)', boxShadow: 'var(--zp-shadow-3)' }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--zp-line)' }}>
                <div className="font-semibold text-sm" style={{ color: 'var(--zp-ink)' }}>{user?.name}</div>
                <div className="text-[11px]" style={{ color: 'var(--zp-ink-2)' }}>{user?.title}</div>
              </div>
              <button
                onClick={() => { setUserMenuOpen(false); logout() }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px]"
                style={{ color: 'var(--zp-full)' }}
              >
                <Icons.Logout size={14} /> Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main column */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header
          className="flex items-center justify-between px-6 lg:px-8 py-4"
          style={{ background: 'var(--zp-surface)', borderBottom: '1px solid var(--zp-line)' }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-md"
              style={{ border: '1px solid var(--zp-line)' }}
            >
              <span className="block w-4 h-0.5" style={{ background: 'var(--zp-ink)' }}></span>
            </button>
            <div>
              <div className="zp-eyebrow">{pageSubtitle}</div>
              <h1 className="font-display text-2xl leading-tight" style={{ color: 'var(--zp-ink)' }}>{pageTitle}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: 'var(--zp-free-soft)', color: 'var(--zp-free)' }}>
              <span className="w-1.5 h-1.5 rounded-full zp-pulse-dot" style={{ background: 'currentColor' }}></span>
              <span className="font-mono text-[11px] font-semibold tracking-wide">
                LIVE · {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-md"
              style={{ border: '1px solid var(--zp-line)' }}>
              <Icons.Search size={14} style={{ color: 'var(--zp-ink-3)' }} />
              <span className="text-[12px]" style={{ color: 'var(--zp-ink-3)' }}>Search…</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                style={{ background: 'var(--zp-surface-2)', color: 'var(--zp-ink-3)' }}>⌘K</span>
            </div>
            <button className="w-9 h-9 flex items-center justify-center rounded-md"
              style={{ color: 'var(--zp-ink-2)' }}>
              <Icons.Bell size={18} />
            </button>
            <ThemeToggle />
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

function ThemeToggle() {
  const [theme, setTheme] = React.useState(() =>
    document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
  )

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next === 'dark' ? 'dark' : '')
    localStorage.setItem('zweho_theme', next)
  }

  return (
    <button
      onClick={toggle}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="w-9 h-9 flex items-center justify-center rounded-md"
      style={{
        color: 'var(--zp-ink-2)',
        border: '1px solid var(--zp-line)',
      }}
    >
      {theme === 'dark' ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  )
}