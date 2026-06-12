// ============================================================
// Zones store — admin-managed parking zones.
//
// Source of truth is Bruno's backend (/admin/lots/<id>/zones/).
// We mirror the latest response into localStorage so the UI has
// something to show instantly on load — then refresh from the API
// in the background. All CRUD goes through the API; on success,
// we re-fetch so every consumer is in sync.
//
// Zone shape (normalised to what existing views expect):
//   { id, name, capacity, color, status, backendId, raw }
//     id        — short label, e.g. "A"
//     backendId — UUID Bruno's API uses to address this row
//     status    — 'active' | 'inactive'
// ============================================================
import { useState, useEffect, useCallback } from 'react'
import { DEFAULT_ZONES, STORAGE_KEYS } from './constants'
import * as apiZones from './api'

const KEY = STORAGE_KEYS.zones

const ZONE_PALETTE = ['#163A6E', '#E4B228', '#2563A8', '#1F8A5B', '#7A5CC4', '#C44A3E', '#E8941A']

// Map Bruno's zone payload into our shape.
function normalizeZone(raw, index = 0) {
  return {
    id: raw.zone_id || raw.id || `Z${index + 1}`,
    backendId: raw.id,
    name: raw.name || raw.full_name || `Zone ${raw.zone_id}`,
    capacity: raw.total_spaces ?? raw.capacity ?? 0,
    color: raw.color || ZONE_PALETTE[index % ZONE_PALETTE.length],
    status: raw.is_active === false ? 'inactive' : 'active',
    price_rwf: raw.price_rwf ?? 0,
    walk_minutes: raw.walk_minutes ?? 0,
    raw,
  }
}

// ── Cache helpers ───────────────────────────────────────────
function readCache() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function writeCache(zones) {
  try {
    localStorage.setItem(KEY, JSON.stringify(zones))
    window.dispatchEvent(new CustomEvent('zweho-zones-changed'))
  } catch { /* ignore */ }
}

// Synchronous reader used by the React hook on first render.
// Returns the cached list if any; otherwise the seed defaults
// so the UI is not blank while the first fetch is in flight.
export function getZones() {
  const cached = readCache()
  if (cached) return cached
  return [...DEFAULT_ZONES]
}

// Fetch from backend → normalise → cache → return.
export async function refreshZones() {
  const list = await apiZones.listZones()
  if (list && Array.isArray(list) && !list._offline) {
    const normalised = list.map((z, i) => normalizeZone(z, i))
    writeCache(normalised)
    return normalised
  }
  // Offline — keep whatever cache we had.
  return readCache() || [...DEFAULT_ZONES]
}

// ── CRUD — every write goes through the backend ────────────
export async function addZone({ name, capacity, color, price_rwf = 0, walk_minutes = 5 }) {
  const current = getZones()
  // Pick the next free single-letter id.
  const used = new Set(current.map(z => z.id))
  let zoneId = ''
  for (let i = 0; i < 26; i++) {
    const letter = String.fromCharCode(65 + i)
    if (!used.has(letter)) { zoneId = letter; break }
  }
  if (!zoneId) {
    let n = 1
    while (used.has('Z' + n)) n++
    zoneId = 'Z' + n
  }

  await apiZones.createZone({
    zone_id: zoneId,
    name: name?.trim() || `Zone ${zoneId}`,
    price_rwf: parseInt(price_rwf, 10) || 0,
    walk_minutes: parseInt(walk_minutes, 10) || 5,
  })

  const refreshed = await refreshZones()
  return refreshed.find(z => z.id === zoneId)
}

export async function updateZone(localId, changes) {
  const zone = getZones().find(z => z.id === localId)
  if (!zone || !zone.backendId) throw new Error('Zone not found')

  const payload = {}
  if (changes.name != null) payload.name = changes.name
  if (changes.price_rwf != null) payload.price_rwf = parseInt(changes.price_rwf, 10)
  if (changes.walk_minutes != null) payload.walk_minutes = parseInt(changes.walk_minutes, 10)
  if (changes.status != null) payload.is_active = changes.status === 'active'

  await apiZones.updateZone(zone.backendId, payload)
  await refreshZones()
}

export async function deactivateZone(localId) {
  const zone = getZones().find(z => z.id === localId)
  if (!zone || !zone.backendId) return
  await apiZones.deactivateZone(zone.backendId)
  await refreshZones()
}

export async function reactivateZone(localId) {
  // Backend uses PATCH with is_active=true to re-enable.
  return updateZone(localId, { status: 'active' })
}

// Hard delete maps to deactivate — backend uses soft-delete.
export async function deleteZone(localId) {
  return deactivateZone(localId)
}

export async function resetZones() {
  // No-op against the backend — admins should add zones explicitly.
  return refreshZones()
}

// ── React hook ──────────────────────────────────────────────
export function useZones() {
  const [zones, setZones] = useState(getZones())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    const sync = async () => {
      setLoading(true)
      try {
        const fresh = await refreshZones()
        if (!cancelled) setZones(fresh)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    sync()

    const refresh = () => setZones(getZones())
    window.addEventListener('zweho-zones-changed', refresh)
    return () => {
      cancelled = true
      window.removeEventListener('zweho-zones-changed', refresh)
    }
  }, [])

  const activeZones = zones.filter(z => z.status === 'active')

  return {
    zones,
    activeZones,
    loading,
    addZone:        useCallback((data) => addZone(data), []),
    updateZone:     useCallback((id, c) => updateZone(id, c), []),
    deactivateZone: useCallback((id) => deactivateZone(id), []),
    reactivateZone: useCallback((id) => reactivateZone(id), []),
    deleteZone:     useCallback((id) => deleteZone(id), []),
    resetZones:     useCallback(() => resetZones(), []),
    refresh:        useCallback(() => refreshZones().then(setZones), []),
  }
}