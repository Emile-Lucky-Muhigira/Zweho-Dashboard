import axios from 'axios'
import { API_BASE } from './constants'
import { isDemoMode } from './demoMode'
import {
  makeMockSpots,
  makeMockBookings,
  makeRevenueDaily,
  makeHourlyOccupancy,
  makeHeatmap,
} from './mockData'

// ============================================================
// Zweho Park — API layer
//
// Every function calls Bruno's real backend. Behaviour:
//   • Demo mode ON  → returns sample data (for presentations)
//   • Demo mode OFF → real API call
//        - success  → real data
//        - failure  → clean empty result + { _offline: true }
//                     (pages show an empty/offline state, no crash)
//
// When the backend is live, set VITE_API_BASE in Vercel and
// turn demo mode OFF. Nothing else changes.
// ============================================================

const api = axios.create({
  baseURL: API_BASE,
  timeout: 8_000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT from localStorage on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('zweho_jwt')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Helper: wrap a real API call so it never throws to the page.
// On failure it returns the supplied fallback, tagged _offline.
async function safe(call, fallback) {
  try {
    const data = await call()
    return data
  } catch (err) {
    // Network error, 404, 500, timeout — all land here.
    const empty = fallback
    if (empty && typeof empty === 'object' && !Array.isArray(empty)) {
      return { ...empty, _offline: true }
    }
    // For arrays/primitives we attach the flag on a wrapper the
    // pages can read via the helper isOffline() below.
    return Object.assign(Array.isArray(empty) ? [...empty] : empty ?? [], { _offline: true })
  }
}

// Pages can check this on any returned value.
export function isOffline(result) {
  return !!(result && result._offline)
}

// ============================================================
// OCCUPANCY  ·  GET /admin/occupancy
// ============================================================
export async function getOccupancy() {
  if (isDemoMode()) return makeMockSpots()
  return safe(async () => {
    const { data } = await api.get('/admin/occupancy')
    return data
  }, [])
}

// ============================================================
// BOOKINGS  ·  GET /bookings
// ============================================================
export async function getBookings({ status, zone, search } = {}) {
  if (isDemoMode()) {
    let bookings = makeMockBookings()
    if (status && status !== 'all') bookings = bookings.filter(b => b.status === status)
    if (zone && zone !== 'all') bookings = bookings.filter(b => b.zone === zone)
    if (search) {
      const s = search.toLowerCase()
      bookings = bookings.filter(b =>
        b.id.toLowerCase().includes(s) || b.phone.includes(search)
      )
    }
    return bookings
  }
  return safe(async () => {
    const { data } = await api.get('/bookings', { params: { status, zone, search } })
    return data
  }, [])
}

// ============================================================
// REVENUE  ·  GET /admin/revenue
// ============================================================
export async function getRevenue({ grain = 'day' } = {}) {
  if (isDemoMode()) return makeRevenueDaily()
  return safe(async () => {
    const { data } = await api.get('/admin/revenue', { params: { grain } })
    return data
  }, [])
}

// ============================================================
// ANALYTICS  ·  GET /admin/analytics
// ============================================================
export async function getAnalytics() {
  if (isDemoMode()) {
    return { hourly: makeHourlyOccupancy(), heatmap: makeHeatmap() }
  }
  return safe(async () => {
    const { data } = await api.get('/admin/analytics')
    return data
  }, { hourly: [], heatmap: [] })
}

// ============================================================
// QR VALIDATION  ·  POST /qr/validate
// ============================================================
export async function validateQR(qrCode) {
  if (isDemoMode()) {
    return { valid: true, bookingId: 'BK-2841', spot: 'A-14', plate: 'RAB 472 G' }
  }
  return safe(async () => {
    const { data } = await api.post('/qr/validate', { qr: qrCode })
    return data
  }, { valid: false, reason: 'Backend not connected' })
}

// ============================================================
// CSV EXPORT  ·  GET /admin/bookings/export
// ============================================================
export async function exportBookingsCSV(filters = {}) {
  if (isDemoMode()) {
    const blob = new Blob(
      ['booking_id,phone,zone,spot,amount,status\nBK-2847,+250...,A,A-14,2000,paid'],
      { type: 'text/csv' }
    )
    return URL.createObjectURL(blob)
  }
  const { data } = await api.get('/admin/bookings/export', {
    params: filters,
    responseType: 'blob',
  })
  return URL.createObjectURL(data)
}

// ============================================================
// AUTH  ·  POST /auth/login
// Note: auth always hits the real backend. Demo mode does not
// fake login — the local demo accounts in lib/auth.jsx handle
// offline sign-in for the prototype.
// ============================================================
export async function login({ phone, password }) {
  const { data } = await api.post('/auth/login', { phone, password })
  localStorage.setItem('zweho_jwt', data.access_token)
  return data
}

export default api