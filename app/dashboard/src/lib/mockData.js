import { ZONES } from './constants'

// Deterministic-ish pseudo-random for stable mock data on page load
const seedRand = (s) => { let x = s; return () => { x = (x * 9301 + 49297) % 233280; return x / 233280; } }
const rng = seedRand(42)

function generatePlate() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const a = letters[Math.floor(rng() * letters.length)]
  const b = letters[Math.floor(rng() * letters.length)]
  const num = String(Math.floor(rng() * 900) + 100)
  const c = letters[Math.floor(rng() * letters.length)]
  return `R${a}${b} ${num} ${c}`
}

export function makeMockSpots() {
  const all = []
  ZONES.forEach(z => {
    for (let i = 1; i <= z.capacity; i++) {
      const r = rng()
      let status
      if (r < 0.62) status = 'occupied'
      else if (r < 0.94) status = 'free'
      else if (r < 0.98) status = 'reserved'
      else status = 'offline'
      const confidence = 0.7 + rng() * 0.29
      const stale = rng() < 0.04
      all.push({
        id: `${z.id}-${String(i).padStart(2, '0')}`,
        zone: z.id,
        status,
        confidence,
        stale,
        lastUpdate: Date.now() - Math.floor(rng() * 1000 * 60 * (stale ? 20 : 2)),
        plate: status === 'occupied' ? generatePlate() : null,
      })
    }
  })
  return all
}

export function makeMockBookings(count = 28) {
  const bookings = []
  for (let i = 0; i < count; i++) {
    const z = ZONES[Math.floor(rng() * ZONES.length)]
    const statuses = ['paid', 'paid', 'paid', 'used', 'used', 'pending', 'cancelled', 'expired']
    const status = statuses[Math.floor(rng() * statuses.length)]
    const hoursAgo = Math.floor(rng() * 48)
    bookings.push({
      id: `BK-${String(2847 - i).padStart(4, '0')}`,
      phone: `+250 78${Math.floor(rng() * 9)} ${String(Math.floor(rng() * 900) + 100)} ${String(Math.floor(rng() * 900) + 100)}`,
      zone: z.id,
      spot: `${z.id}-${String(Math.floor(rng() * z.capacity) + 1).padStart(2, '0')}`,
      amount: [500, 1000, 1500, 2000, 3000][Math.floor(rng() * 5)],
      status,
      momoTx: status === 'paid' || status === 'used' ? `MP${Math.floor(rng() * 1e9)}` : null,
      createdAt: new Date(Date.now() - hoursAgo * 3600 * 1000),
      duration: ['2h', '3h', '4h', '6h', 'Match'][Math.floor(rng() * 5)],
    })
  }
  return bookings
}

export function makeRevenueDaily() {
  return Array.from({ length: 14 }, (_, i) => {
    const day = new Date(Date.now() - (13 - i) * 24 * 3600 * 1000)
    const isMatchDay = i === 3 || i === 9 || i === 12
    const base = 18000 + rng() * 22000
    return {
      date: day.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      revenue: Math.floor(isMatchDay ? base * 4.5 : base),
      bookings: Math.floor((isMatchDay ? 180 : 35) + rng() * 20),
      isMatchDay,
    }
  })
}

export function makeHourlyOccupancy() {
  return Array.from({ length: 24 }, (_, h) => {
    let pct
    if (h < 6) pct = 5 + rng() * 8
    else if (h < 10) pct = 20 + rng() * 15
    else if (h < 14) pct = 35 + rng() * 15
    else if (h < 17) pct = 50 + rng() * 20
    else if (h < 21) pct = 75 + rng() * 22
    else pct = 30 + rng() * 15
    return {
      hour: `${String(h).padStart(2, '0')}:00`,
      occupancy: Math.round(pct),
      matchDay: Math.round(Math.min(99, pct * 1.6)),
    }
  })
}

export function makeHeatmap() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return days.map(d => ({
    day: d,
    hours: Array.from({ length: 24 }, (_, h) => {
      let val
      if (h < 7) val = rng() * 15
      else if (d === 'Sat' || d === 'Sun') val = 30 + rng() * 65
      else if (h >= 17 && h <= 20) val = 60 + rng() * 35
      else val = 20 + rng() * 30
      return Math.round(val)
    })
  }))
}

export { generatePlate }
