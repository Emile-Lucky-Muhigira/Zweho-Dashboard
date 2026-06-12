import React, { createContext, useContext, useState, useEffect } from 'react'
import { api, setTokens, clearTokens, getAccessToken, TOKEN_KEYS } from './api'

const AuthContext = createContext(null)

// ============================================================
// Developer access accounts — TEMPORARY.
// For team review when the real backend isn't reachable.
// DELETE this block (and the dev-login UI) before launch.
// ============================================================
const DEV_ACCOUNTS = [
  { email: 'ngoursam@andrew.cmu.edu', password: 'admin123',   user: { id: 'usr_001', name: 'Nouba-Asra Goursam Tresor', initials: 'NT', role: 'admin', title: 'Product Lead' } },
  { email: 'emuhigir@andrew.cmu.edu', password: 'admin123',   user: { id: 'usr_002', name: 'Emile Muhigira',           initials: 'EM', role: 'admin', title: 'Dashboard Lead' } },
  { email: 'gate@zwehopark.rw',       password: 'staff123',   user: { id: 'usr_003', name: 'Daniel K.',                initials: 'DK', role: 'staff', title: 'Gate Operator' } },
]

// Map Bruno's role enums (UPPERCASE) to ours (lowercase).
// Stadium Rep dropped per Bruno's decision.
const ROLE_MAP = {
  ADMIN: 'admin',
  GATE_STAFF: 'staff',
  USER: 'staff',   // shouldn't reach the dashboard, but safe fallback
}

export const ROLE_PERMISSIONS = {
  admin: ['occupancy', 'zones', 'bookings', 'revenue', 'analytics', 'events', 'cameras', 'staff', 'scanner', 'scan-history', 'annotation', 'edge-devices', 'api-docs', 'settings'],
  staff: ['scanner', 'scan-history'],
}

// Normalise a user object from Bruno's API into the shape the UI expects.
function normalizeUser(raw) {
  if (!raw) return null
  const name = raw.full_name || raw.name || 'User'
  return {
    id: raw.id,
    name,
    full_name: raw.full_name,
    email: raw.email,
    phone: raw.phone,
    role: ROLE_MAP[raw.role] || (raw.role || '').toLowerCase() || 'staff',
    title: raw.title || '',
    initials: raw.initials || initialsOf(name),
    status: raw.status,
    must_change_password: raw.must_change_password,
    created_at: raw.created_at,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  // Holds { email } when first-login must-change-password flow is active.
  const [pendingPasswordChange, setPendingPasswordChange] = useState(null)

  // Restore user from sessionStorage on first load.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(TOKEN_KEYS.user)
      const token = getAccessToken()
      if (saved && token) setUser(JSON.parse(saved))
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  function persistUser(u) {
    sessionStorage.setItem(TOKEN_KEYS.user, JSON.stringify(u))
    setUser(u)
  }

  // ──────────────────────────────────────────────────────────
  // LOGIN — STEP 1
  //   POST /auth/staff/login/   { email, password }
  //   → 200  { otp_sent, otp_length, expires_in, must_change_password, dev_otp? }
  //
  // dev_otp is returned by the dev/staging server while SMS isn't wired.
  // We surface it so the LoginView can autofill it during testing.
  // ──────────────────────────────────────────────────────────
  const loginStep1 = async ({ email, password }) => {
    try {
      const { data } = await api.post('/auth/staff/login/', { email, password })
      return {
        otpSent: true,
        otpLength: data.otp_length || 6,
        expiresIn: data.expires_in || 600,
        mustChangePassword: !!data.must_change_password,
        devOtp: data.dev_otp || null,
      }
    } catch (err) {
      const status = err.response?.status
      if (status === 401) throw new Error('Incorrect email or password.')
      if (status === 403) throw new Error('This account is suspended. Contact an admin.')
      throw new Error('Cannot reach the authentication server.')
    }
  }

  // ──────────────────────────────────────────────────────────
  // LOGIN — STEP 2
  //   POST /auth/staff/verify-otp/   { email, code }
  //   → 200  { access, refresh, user }
  // ──────────────────────────────────────────────────────────
  const verifyOtp = async ({ email, code }) => {
    try {
      const { data } = await api.post('/auth/staff/verify-otp/', { email, code })
      // Save tokens immediately so any follow-up call can authorise.
      setTokens(data.access, data.refresh)
      const normalized = normalizeUser(data.user)

      // First-login flow — defer setting the user until they change the password.
      if (data.user?.must_change_password) {
        setPendingPasswordChange({ email })
        return { mustChangePassword: true, user: normalized }
      }

      persistUser(normalized)
      return { mustChangePassword: false, user: normalized }
    } catch (err) {
      const status = err.response?.status
      if (status === 400) throw new Error('That code is incorrect or has expired.')
      throw new Error('Cannot reach the authentication server.')
    }
  }

  // ──────────────────────────────────────────────────────────
  // RESEND OTP
  //   POST /auth/staff/resend-otp/   { email }
  // Rate-limited to 1/min on the server.
  // ──────────────────────────────────────────────────────────
  const resendOtp = async ({ email }) => {
    try {
      const { data } = await api.post('/auth/staff/resend-otp/', { email })
      return { devOtp: data.dev_otp || null }
    } catch (err) {
      if (err.response?.status === 429) throw new Error('Please wait a minute before requesting another code.')
      throw new Error('Could not resend the code.')
    }
  }

  // ──────────────────────────────────────────────────────────
  // FIRST-LOGIN PASSWORD CHANGE
  // Step A:  POST /auth/staff/set-password/    { email, new_password }
  // Step B:  POST /auth/staff/confirm-password/ { email, code }
  // ──────────────────────────────────────────────────────────
  const setNewPassword = async ({ email, newPassword }) => {
    try {
      const { data } = await api.post('/auth/staff/set-password/', {
        email, new_password: newPassword,
      })
      return {
        otpSent: true,
        otpLength: data.otp_length || 6,
        expiresIn: data.expires_in || 600,
        devOtp: data.dev_otp || null,
      }
    } catch (err) {
      if (err.response?.status === 400) {
        // Per-field validation: { errors: { new_password: ["..."] } }
        const errors = err.response.data?.errors
        const first = errors && Object.values(errors)[0]?.[0]
        throw new Error(first || 'Password does not meet requirements.')
      }
      throw new Error('Cannot reach the authentication server.')
    }
  }

  const confirmNewPassword = async ({ email, code }) => {
    try {
      const { data } = await api.post('/auth/staff/confirm-password/', { email, code })
      setTokens(data.access, data.refresh)
      const normalized = normalizeUser(data.user)
      persistUser(normalized)
      setPendingPasswordChange(null)
      return normalized
    } catch (err) {
      if (err.response?.status === 400) throw new Error('That code is incorrect or has expired.')
      throw new Error('Cannot reach the authentication server.')
    }
  }

  // ──────────────────────────────────────────────────────────
  // INVITE STAFF · admin action
  //   POST /staff/invite/   { name, email, phone, role, title }
  // role must be ADMIN or GATE_STAFF.
  // ──────────────────────────────────────────────────────────
  const inviteStaff = async ({ name, email, phone, role, title }) => {
    // Map our lowercase role to Bruno's UPPERCASE enum.
    const backendRole = role === 'admin' ? 'ADMIN' : 'GATE_STAFF'
    const { data } = await api.post('/staff/invite/', {
      name, email, phone, role: backendRole, title: title || '',
    })
    return normalizeUser(data)
  }

  // ──────────────────────────────────────────────────────────
  // LOGOUT — blacklists refresh token on server then clears local state.
  // ──────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      const refresh = sessionStorage.getItem(TOKEN_KEYS.refresh)
      if (refresh) await api.post('/auth/logout/', { refresh })
    } catch { /* ignore — we're logging out anyway */ }
    clearTokens()
    setUser(null)
    setPendingPasswordChange(null)
  }

  // ──────────────────────────────────────────────────────────
  // DEVELOPER ACCESS — temporary local bypass. Remove before launch.
  // ──────────────────────────────────────────────────────────
  const devLogin = ({ email, password }) => {
    const norm = (s) => (s || '').trim().toLowerCase()
    const match = DEV_ACCOUNTS.find(a => norm(a.email) === norm(email) && a.password === password)
    if (!match) throw new Error('Invalid developer credentials.')
    // Stash a fake token so the request interceptor doesn't reject calls — but
    // be aware: real API calls with a fake token will 401 and trigger logout.
    setTokens(`dev-${match.user.role}-${Date.now()}`, null)
    persistUser(match.user)
    return match.user
  }

  const can = (viewId) => {
    if (!user) return false
    return ROLE_PERMISSIONS[user.role]?.includes(viewId) || false
  }

  return (
    <AuthContext.Provider value={{
      user, loading, can, logout,
      loginStep1, verifyOtp, resendOtp,
      setNewPassword, confirmNewPassword,
      inviteStaff,
      devLogin,
      pendingPasswordChange,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

function initialsOf(name) {
  return (name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('')
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export const DEV_HINTS = DEV_ACCOUNTS.map(a => ({
  email: a.email, password: a.password, role: a.user.role, name: a.user.name,
}))