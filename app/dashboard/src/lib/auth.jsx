import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { API_BASE } from './constants'

const AuthContext = createContext(null)

// ============================================================
// Developer access accounts — TEMPORARY.
// For team review before Bruno's auth backend is live.
// DELETE this block (and the dev-login UI) before launch.
// ============================================================
const DEV_ACCOUNTS = [
  { email: 'ngoursam@andrew.cmu.edu', password: 'admin123',   user: { id: 'usr_001', name: 'Nouba-Asra Goursam Tresor', initials: 'NT', role: 'admin',        title: 'Product Lead' } },
  { email: 'emuhigir@andrew.cmu.edu', password: 'admin123',   user: { id: 'usr_002', name: 'Emile Muhigira',           initials: 'EM', role: 'admin',        title: 'Dashboard Lead' } },
  { email: 'gate@zwehopark.rw',       password: 'staff123',   user: { id: 'usr_003', name: 'Daniel K.',                initials: 'DK', role: 'staff',        title: 'Gate Operator' } },
  { email: 'stadium@zwehopark.rw',    password: 'stadium123', user: { id: 'usr_004', name: 'Joseph Habimana',          initials: 'JH', role: 'stadium-rep',  title: 'Stadium Liaison' } },
]

export const ROLE_PERMISSIONS = {
  admin: ['occupancy', 'zones', 'bookings', 'revenue', 'analytics', 'events', 'cameras', 'staff', 'scanner', 'scan-history', 'annotation', 'edge-devices', 'api-docs', 'settings'],
  staff: ['scanner', 'scan-history'],
  'stadium-rep': ['revenue', 'analytics', 'events'],
}

const authApi = axios.create({
  baseURL: API_BASE,
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT to authenticated calls (e.g. inviting staff).
authApi.interceptors.request.use(config => {
  const token = localStorage.getItem('zweho_jwt')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  // Set when a user signs in with a default password and must
  // create a new one. Holds { email } so the flow can continue.
  const [pendingPasswordChange, setPendingPasswordChange] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('zweho_user')
    const token = localStorage.getItem('zweho_jwt')
    if (saved && token) {
      try { setUser(JSON.parse(saved)) } catch { /* ignore */ }
    }
    setLoading(false)
  }, [])

  // ──────────────────────────────────────────────────────────
  // LOGIN — STEP 1 · email + password
  //
  //   POST /auth/login   { email, password }
  //   → 200  { otp_sent, otp_length, expires_in, must_change_password }
  //   → 401  invalid credentials
  //
  // If the backend flags must_change_password (a freshly invited
  // staff member using their default password), the dashboard
  // routes them to the Create New Password flow after OTP.
  // ──────────────────────────────────────────────────────────
  const loginStep1 = async ({ email, password }) => {
    try {
      const { data } = await authApi.post('/auth/login', { email, password })
      return {
        otpSent: true,
        otpLength: data.otp_length || 6,
        expiresIn: data.expires_in || 300,
        mustChangePassword: !!data.must_change_password,
      }
    } catch (err) {
      if (err.response?.status === 401) throw new Error('Incorrect email or password.')
      throw new Error('Cannot reach the authentication server. The backend may not be online yet.')
    }
  }

  // ──────────────────────────────────────────────────────────
  // LOGIN — STEP 2 · verify OTP
  //
  //   POST /auth/verify-otp   { email, code }
  //   → 200  { access_token, user, must_change_password }
  //
  // If must_change_password is true, we DON'T finish login —
  // we hand control to the Create New Password screen instead.
  // ──────────────────────────────────────────────────────────
  const verifyOtp = async ({ email, code }) => {
    try {
      const { data } = await authApi.post('/auth/verify-otp', { email, code })

      if (data.must_change_password) {
        // Keep the short-lived token so set-password can authorise,
        // but do NOT mark the user as fully logged in yet.
        if (data.access_token) localStorage.setItem('zweho_jwt', data.access_token)
        setPendingPasswordChange({ email })
        return { mustChangePassword: true }
      }

      const u = data.user
      const withInitials = { ...u, initials: u.initials || initialsOf(u.name) }
      localStorage.setItem('zweho_jwt', data.access_token)
      localStorage.setItem('zweho_user', JSON.stringify(withInitials))
      setUser(withInitials)
      return { mustChangePassword: false, user: withInitials }
    } catch (err) {
      if (err.response?.status === 401) throw new Error('That code is incorrect or has expired.')
      throw new Error('Cannot reach the authentication server.')
    }
  }

  const resendOtp = async ({ email }) => {
    try {
      await authApi.post('/auth/resend-otp', { email })
      return true
    } catch {
      throw new Error('Could not resend the code. The backend may not be online yet.')
    }
  }

  // ──────────────────────────────────────────────────────────
  // CREATE NEW PASSWORD · first sign-in
  //
  // Step A — set the new password:
  //   POST /auth/set-password   { email, new_password }
  //   → 200  { otp_sent }   (an OTP is sent to confirm)
  //
  // Step B — confirm with OTP:
  //   POST /auth/confirm-password   { email, code }
  //   → 200  { access_token, user }
  // ──────────────────────────────────────────────────────────
  const setNewPassword = async ({ email, newPassword }) => {
    try {
      const { data } = await authApi.post('/auth/set-password', {
        email, new_password: newPassword,
      })
      return { otpSent: true, otpLength: data.otp_length || 6, expiresIn: data.expires_in || 300 }
    } catch (err) {
      if (err.response?.status === 400) throw new Error(err.response.data?.message || 'Password does not meet requirements.')
      throw new Error('Cannot reach the authentication server.')
    }
  }

  const confirmNewPassword = async ({ email, code }) => {
    try {
      const { data } = await authApi.post('/auth/confirm-password', { email, code })
      const u = data.user
      const withInitials = { ...u, initials: u.initials || initialsOf(u.name) }
      localStorage.setItem('zweho_jwt', data.access_token)
      localStorage.setItem('zweho_user', JSON.stringify(withInitials))
      setUser(withInitials)
      setPendingPasswordChange(null)
      return withInitials
    } catch (err) {
      if (err.response?.status === 401) throw new Error('That code is incorrect or has expired.')
      throw new Error('Cannot reach the authentication server.')
    }
  }

  // ──────────────────────────────────────────────────────────
  // INVITE STAFF · admin action
  //
  //   POST /staff/invite   { name, email, phone, role, title, team }
  //   → 200  { member }
  //
  // The backend creates the account, generates a default password,
  // and emails it to the new member. They sign in with it and are
  // forced through Create New Password.
  // ──────────────────────────────────────────────────────────
  const inviteStaff = async (memberData) => {
    const { data } = await authApi.post('/staff/invite', memberData)
    return data
  }

  // ──────────────────────────────────────────────────────────
  // DEVELOPER ACCESS — temporary. Remove before launch.
  // ──────────────────────────────────────────────────────────
  const devLogin = ({ email, password }) => {
    const norm = (s) => (s || '').trim().toLowerCase()
    const match = DEV_ACCOUNTS.find(a => norm(a.email) === norm(email) && a.password === password)
    if (!match) throw new Error('Invalid developer credentials.')
    localStorage.setItem('zweho_jwt', `dev-${match.user.role}-${Date.now()}`)
    localStorage.setItem('zweho_user', JSON.stringify(match.user))
    setUser(match.user)
    return match.user
  }

  const logout = () => {
    localStorage.removeItem('zweho_jwt')
    localStorage.removeItem('zweho_user')
    setUser(null)
    setPendingPasswordChange(null)
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