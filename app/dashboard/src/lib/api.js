import axios from 'axios'
import { API_BASE } from './constants'
import {
  makeMockSpots,
  makeMockBookings,
  makeRevenueDaily,
  makeHourlyOccupancy,
  makeHeatmap,
} from './mockData'

// ============================================================
// TOGGLE: set to false when Bruno's API is deployed
// ============================================================
export const USE_MOCK = true

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT from localStorage on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('zweho_jwt')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ============================================================
// ENDPOINTS — match the tech spec API table exactly
// ============================================================

export async function getOccupancy() {
  if (USE_MOCK) return makeMockSpots()
  const { data } = await api.get('/admin/occupancy')
  return data
}

export async function getBookings({ status, zone, search } = {}) {
  if (USE_MOCK) {
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
  const { data } = await api.get('/bookings', { params: { status, zone, search } })
  return data
}

export async function getRevenue({ grain = 'day' } = {}) {
  if (USE_MOCK) return makeRevenueDaily()
  const { data } = await api.get('/admin/revenue', { params: { grain } })
  return data
}

export async function getAnalytics() {
  if (USE_MOCK) {
    return {
      hourly: makeHourlyOccupancy(),
      heatmap: makeHeatmap(),
    }
  }
  const { data } = await api.get('/admin/analytics')
  return data
}

export async function validateQR(qrCode) {
  if (USE_MOCK) {
    return { valid: true, bookingId: 'BK-2841', spot: 'A-14', plate: 'RAB 472 G' }
  }
  const { data } = await api.post('/qr/validate', { qr: qrCode })
  return data
}

export async function exportBookingsCSV(filters = {}) {
  if (USE_MOCK) {
    const blob = new Blob(['booking_id,phone,zone,spot,amount,status\nBK-2847,...'], { type: 'text/csv' })
    return URL.createObjectURL(blob)
  }
  const { data } = await api.get('/admin/bookings/export', {
    params: filters,
    responseType: 'blob',
  })
  return URL.createObjectURL(data)
}

export async function login({ phone, password }) {
  if (USE_MOCK) {
    localStorage.setItem('zweho_jwt', 'mock-jwt-token')
    return { token: 'mock-jwt-token', user: { name: 'Emile Muhigira', role: 'admin' } }
  }
  const { data } = await api.post('/auth/login', { phone, password })
  localStorage.setItem('zweho_jwt', data.access_token)
  return data
}

export default api
