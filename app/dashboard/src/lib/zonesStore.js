// ============================================================
// Zones store — admin-managed parking zones.
//
// Zones are configuration (not live sensor data), so they live
// in localStorage and work fully offline. When Bruno's backend
// is ready, these functions get an API call added alongside the
// localStorage write — the rest of the app won't change.
//
// A zone:
//   { id, name, capacity, color, status }
//   status: 'active'  → in use, shows on all pages
//           'inactive'→ marked unavailable, hidden from operations
// ============================================================
import { useState, useEffect, useCallback } from 'react'
import { DEFAULT_ZONES, STORAGE_KEYS } from './constants'

const KEY = STORAGE_KEYS.zones

// Read all zones from storage. First run seeds with DEFAULT_ZONES.
export function getZones() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      // First run — seed with defaults so the app isn't empty.
      localStorage.setItem(KEY, JSON.stringify(DEFAULT_ZONES))
      return [...DEFAULT_ZONES]
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : [...DEFAULT_ZONES]
  } catch {
    return [...DEFAULT_ZONES]
  }
}

// Save the full zones array and notify listeners.
function saveZones(zones) {
  try {
    localStorage.setItem(KEY, JSON.stringify(zones))
    window.dispatchEvent(new CustomEvent('zweho-zones-changed'))
  } catch {
    /* ignore storage errors */
  }
}

// Generate the next free zone id (A, B, C ... Z, then Z1, Z2...).
function nextZoneId(zones) {
  const used = new Set(zones.map(z => z.id))
  for (let i = 0; i < 26; i++) {
    const letter = String.fromCharCode(65 + i)
    if (!used.has(letter)) return letter
  }
  let n = 1
  while (used.has('Z' + n)) n++
  return 'Z' + n
}

// A palette to cycle through for new zones.
const ZONE_PALETTE = ['#163A6E', '#E4B228', '#2563A8', '#1F8A5B', '#7A5CC4', '#C44A3E', '#E8941A']

export function addZone({ name, capacity, color }) {
  const zones = getZones()
  const id = nextZoneId(zones)
  const zone = {
    id,
    name: name?.trim() || `Zone ${id}`,
    capacity: Math.max(1, parseInt(capacity, 10) || 1),
    color: color || ZONE_PALETTE[zones.length % ZONE_PALETTE.length],
    status: 'active',
  }
  saveZones([...zones, zone])
  return zone
}

export function updateZone(id, changes) {
  const zones = getZones().map(z =>
    z.id === id
      ? {
          ...z,
          ...changes,
          capacity: changes.capacity != null
            ? Math.max(1, parseInt(changes.capacity, 10) || z.capacity)
            : z.capacity,
        }
      : z
  )
  saveZones(zones)
}

// "Remove" = mark inactive (your team's requirement: a zone not in
// use should be marked not-available, not hard-deleted).
export function deactivateZone(id) {
  updateZone(id, { status: 'inactive' })
}

export function reactivateZone(id) {
  updateZone(id, { status: 'active' })
}

// Hard delete — only for zones added by mistake.
export function deleteZone(id) {
  saveZones(getZones().filter(z => z.id !== id))
}

// Reset everything back to the seed defaults.
export function resetZones() {
  saveZones([...DEFAULT_ZONES])
}

// React hook — components use this to read zones and stay in sync.
export function useZones() {
  const [zones, setZones] = useState(getZones())

  useEffect(() => {
    const refresh = () => setZones(getZones())
    window.addEventListener('zweho-zones-changed', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('zweho-zones-changed', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const activeZones = zones.filter(z => z.status === 'active')

  return {
    zones,            // all zones, including inactive
    activeZones,      // only active — use this for operations views
    addZone:        useCallback((data) => addZone(data), []),
    updateZone:     useCallback((id, c) => updateZone(id, c), []),
    deactivateZone: useCallback((id) => deactivateZone(id), []),
    reactivateZone: useCallback((id) => reactivateZone(id), []),
    deleteZone:     useCallback((id) => deleteZone(id), []),
    resetZones:     useCallback(() => resetZones(), []),
  }
}