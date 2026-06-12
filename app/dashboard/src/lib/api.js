import axios from 'axios'
import { API_BASE, ACTIVE_LOT_ID } from './constants'
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
//        - success  → real data, auto-unwrapped from { success, data, ... }
//        - failure  → clean empty result + { _offline: true }
//
// Auth: JWT access token auto-attached from sessionStorage.
// On 401 we silently try /auth/token/refresh/ once, then redirect to /login.
// ============================================================

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 12_000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Token helpers ───────────────────────────────────────────
// Bruno's doc recommends sessionStorage over localStorage for security.
// Keeping the keys centralised so auth.jsx and the interceptors agree.
export const TOKEN_KEYS = {
  access: 'zweho_access',
  refresh: 'zweho_refresh',
  user: 'zweho_user',
}

export function getAccessToken() { return sessionStorage.getItem(TOKEN_KEYS.access) }
export function getRefreshToken() { return sessionStorage.getItem(TOKEN_KEYS.refresh) }
export function setTokens(access, refresh) {
  if (access) sessionStorage.setItem(TOKEN_KEYS.access, access)
  if (refresh) sessionStorage.setItem(TOKEN_KEYS.refresh, refresh)
}
export function clearTokens() {
  sessionStorage.removeItem(TOKEN_KEYS.access)
  sessionStorage.removeItem(TOKEN_KEYS.refresh)
  sessionStorage.removeItem(TOKEN_KEYS.user)
}

// ── Request interceptor: attach JWT ──────────────────────────
api.interceptors.request.use(config => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response interceptor: unwrap envelope + handle 401 refresh ──
//
// Bruno's API wraps every response: { success, data, message }
// We unwrap .data so call sites get the payload directly.
// On 401, we try one silent refresh, then retry the original request.
let refreshPromise = null

api.interceptors.response.use(
  (response) => {
    // Auto-unwrap: if the body has { success: true, data: ... }, return data.
    // Tokens-refresh endpoint returns { access, refresh } directly — keep that as-is.
    const body = response.data
    if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
      response.data = body.data
    }
    return response
  },
  async (error) => {
    const original = error.config
    const status = error.response?.status

    // No refresh attempted yet for this request, and we got 401, and we have a refresh token.
    if (status === 401 && !original._retried && getRefreshToken()) {
      original._retried = true

      try {
        // Reuse a single in-flight refresh if multiple requests fire at once.
        if (!refreshPromise) {
          refreshPromise = axios.post(
            `${API_BASE}/auth/token/refresh/`,
            { refresh: getRefreshToken() },
            { headers: { 'Content-Type': 'application/json' } }
          ).finally(() => { refreshPromise = null })
        }
        const { data } = await refreshPromise
        // /token/refresh/ returns { access, refresh } directly (no envelope)
        setTokens(data.access, data.refresh || getRefreshToken())
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch (refreshErr) {
        // Refresh failed — full logout.
        clearTokens()
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshErr)
      }
    }

    return Promise.reject(error)
  }
)

// ── safe(): never throw to the page ─────────────────────────
async function safe(call, fallback) {
  try {
    return await call()
  } catch (err) {
    const empty = fallback
    if (empty && typeof empty === 'object' && !Array.isArray(empty)) {
      return { ...empty, _offline: true }
    }
    return Object.assign(Array.isArray(empty) ? [...empty] : empty ?? [], { _offline: true })
  }
}

export function isOffline(result) {
  return !!(result && result._offline)
}

// ============================================================
// LIVE OCCUPANCY  ·  GET /admin/lots/<id>/live/
// (WebSocket integration comes in Phase C — for now we poll the snapshot.)
// ============================================================
export async function getOccupancy() {
  if (isDemoMode()) return makeMockSpots()
  return safe(async () => {
    const { data } = await api.get(`/admin/lots/${ACTIVE_LOT_ID}/live/`)
    // Backend returns { zones: [{ id, zone_id, slots: [{ id, label, current_state, ... }] }] }
    // Flatten into the {id, zone, status, ...} shape the UI expects.
    return flattenLiveSnapshot(data)
  }, [])
}

function flattenLiveSnapshot(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.zones)) return []
  const stateMap = {
    AVAILABLE: 'free', OCCUPIED: 'occupied', RESERVED: 'reserved',
    UNAUTHORIZED: 'occupied', OVERSTAY: 'occupied', MAINTENANCE: 'offline',
  }
  const out = []
  snapshot.zones.forEach(z => {
    (z.slots || []).forEach(s => {
      out.push({
        id: s.label || s.id,
        slot_id: s.id,
        zone: z.zone_id,
        status: stateMap[s.current_state] || 'free',
        raw_state: s.current_state,
        confidence: 1,
        lastUpdate: Date.now(),
      })
    })
  })
  return out
}

// ============================================================
// BOOKINGS  ·  GET /admin/bookings/
// ============================================================
export async function getBookings({ status, lotId, eventId, date } = {}) {
  if (isDemoMode()) return makeMockBookings()
  const params = {}
  if (status && status !== 'all') params.status = status
  if (lotId) params.lot_id = lotId
  if (eventId) params.event_id = eventId
  if (date) params.date = date
  return safe(async () => {
    const { data } = await api.get('/admin/bookings/', { params })
    // Paginated response — data is either an array or { results: [...] }
    return Array.isArray(data) ? data : (data?.results || [])
  }, [])
}

export async function getBooking(id) {
  if (isDemoMode()) return null
  return safe(async () => (await api.get(`/admin/bookings/${id}/`)).data, null)
}

// ============================================================
// REVENUE  ·  GET /admin/reports/revenue/
// ============================================================
export async function getRevenue({ from, to, lotId = ACTIVE_LOT_ID } = {}) {
  if (isDemoMode()) return makeRevenueDaily()
  // Bruno's API requires from + to. Default to last 30 days.
  if (!from || !to) {
    const end = new Date()
    const start = new Date(end); start.setDate(start.getDate() - 30)
    from = start.toISOString().slice(0, 10)
    to = end.toISOString().slice(0, 10)
  }
  return safe(async () => {
    const { data } = await api.get('/admin/reports/revenue/', {
      params: { lot_id: lotId, from, to },
    })
    return data
  }, [])
}

// ============================================================
// ANALYTICS  ·  GET /admin/reports/utilization/
// ============================================================
export async function getAnalytics({ from, to, lotId = ACTIVE_LOT_ID } = {}) {
  if (isDemoMode()) {
    return { hourly: makeHourlyOccupancy(), heatmap: makeHeatmap(), kpis: { peakOccupancy: 94, peakOccupancyAt: 'Tue 18:00', avgStayHours: 2.4, avgDailyBookings: 42, cvAccuracy: 96.8 } }
  }
  if (!from || !to) {
    const end = new Date()
    const start = new Date(end); start.setDate(start.getDate() - 7)
    from = start.toISOString().slice(0, 10)
    to = end.toISOString().slice(0, 10)
  }
  return safe(async () => {
    const { data } = await api.get('/admin/reports/utilization/', {
      params: { lot_id: lotId, from, to },
    })
    // Backend returns [{ hour, booking_count }] — map to chart shape.
    return { hourly: data, heatmap: [], kpis: null }
  }, { hourly: [], heatmap: [], kpis: null })
}

// ============================================================
// ZONES  ·  /admin/lots/<id>/zones/  +  /admin/zones/<id>/
// ============================================================
export async function listZones(lotId = ACTIVE_LOT_ID) {
  return safe(async () => (await api.get(`/admin/lots/${lotId}/zones/`)).data, [])
}
export async function createZone({ lotId = ACTIVE_LOT_ID, zone_id, name, price_rwf, walk_minutes }) {
  const { data } = await api.post(`/admin/lots/${lotId}/zones/`, {
    lot: lotId, zone_id, name, price_rwf, walk_minutes, is_active: true,
  })
  return data
}
export async function updateZone(id, changes) {
  const { data } = await api.patch(`/admin/zones/${id}/`, changes)
  return data
}
export async function deactivateZone(id) {
  return api.delete(`/admin/zones/${id}/`)
}

// ============================================================
// EVENTS  ·  /admin/lots/<id>/events/  +  /admin/events/<id>/
// ============================================================
export async function listEvents(lotId = ACTIVE_LOT_ID) {
  return safe(async () => (await api.get(`/admin/lots/${lotId}/events/`)).data, [])
}
export async function createEvent({ lotId = ACTIVE_LOT_ID, title, kickoff, venue }) {
  const { data } = await api.post(`/admin/lots/${lotId}/events/`, {
    lot: lotId, title, kickoff, venue, is_active: true,
  })
  return data
}
export async function updateEvent(id, changes) {
  const { data } = await api.patch(`/admin/events/${id}/`, changes)
  return data
}
export async function deactivateEvent(id) {
  return api.delete(`/admin/events/${id}/`)
}

// ============================================================
// REFUNDS  ·  /admin/refunds/
// ============================================================
export async function listRefunds({ status } = {}) {
  return safe(async () => (await api.get('/admin/refunds/', { params: status ? { status } : {} })).data, [])
}
export async function approveRefund(id, notes = '') {
  const { data } = await api.post(`/admin/refunds/${id}/approve/`, { notes })
  return data
}
export async function rejectRefund(id, notes = '') {
  const { data } = await api.post(`/admin/refunds/${id}/reject/`, { notes })
  return data
}

// ============================================================
// USERS  ·  /admin/users/
// ============================================================
export async function listUsers({ search } = {}) {
  return safe(async () => (await api.get('/admin/users/', { params: search ? { search } : {} })).data, [])
}
export async function getUser(id) {
  return safe(async () => (await api.get(`/admin/users/${id}/`)).data, null)
}

// ============================================================
// SCAN HISTORY (legacy — keep for ScanHistoryView until backend provides one)
// ============================================================
export async function getScanHistory() {
  if (isDemoMode()) {
    return [
      { id: 'BK-2841', valid: true,  time: '14:22:54', date: 'Today', gate: 'North', plate: 'RAB 472 G', spot: 'A-14', operator: 'Daniel K.' },
      { id: 'BK-2839', valid: true,  time: '14:21:30', date: 'Today', gate: 'South', plate: 'RAC 118 K', spot: 'D-31', operator: 'Aimable N.' },
      { id: 'BK-2838', valid: false, time: '14:19:12', date: 'Today', gate: 'North', plate: 'RAD 905 B', spot: '—', operator: 'Daniel K.', reason: 'Already used' },
    ]
  }
  // No matching endpoint yet — return empty offline.
  return Object.assign([], { _offline: true })
}

// ============================================================
// QR VALIDATION  ·  (legacy stub — gate-scanner app handles this server-side)
// ============================================================
export async function validateQR(qrCode) {
  if (isDemoMode()) return { valid: true, bookingId: 'BK-2841', spot: 'A-14', plate: 'RAB 472 G' }
  return { valid: false, reason: 'Validation runs in the standalone scanner app' }
}

// ============================================================
// CSV EXPORT  ·  (no backend endpoint yet — client-side stub)
// ============================================================
export async function exportBookingsCSV(filters = {}) {
  if (isDemoMode()) {
    const blob = new Blob(['booking_id,phone,zone,spot,amount,status\nBK-2847,+250...,A,A-14,2000,paid'], { type: 'text/csv' })
    return URL.createObjectURL(blob)
  }
  // Build CSV from listed bookings.
  const bookings = await getBookings(filters)
  const rows = ['ref,zone,event,status,amount_rwf,plate,arrival_from']
  bookings.forEach(b => {
    rows.push([b.ref || b.id, b.zone_id, b.event_title || '', b.status, b.amount_rwf, b.license_plate, b.arrival_from].join(','))
  })
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
  return URL.createObjectURL(blob)
}

export default api