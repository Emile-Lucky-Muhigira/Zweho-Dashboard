// ============================================================
// Events store — hybrid (backend + local overstay config).
//
// Source of truth split:
//   • Bruno's backend  → title, kickoff, venue, is_active
//   • localStorage     → overstay config (type, endTime, grace,
//                        warningLead, overstayRate) keyed by
//                        the backend event UUID.
//
// On read: list backend events → merge with local config → expose
// the same { id, name, type, date, startTime, endTime, grace... }
// shape EventsView and the Overstay Monitor expect. No view changes.
//
// On write: POST/PATCH/DELETE to Bruno's API for the shared parts,
// then write the overstay config to localStorage under the same id.
//
// When Bruno extends his Event model to include the overstay fields,
// switch the read/write paths to the API and stop reading local config.
// ============================================================
import { useState, useEffect, useCallback } from 'react'
import * as eventsApi from './api'

const CONFIG_KEY = 'zweho_event_overstay_config'

export const EVENT_TYPES = ['Football match', 'Concert', 'Ceremony', 'Conference', 'Other']

const DEFAULT_CONFIG = {
  type: 'Other',
  endTime: '20:00',
  graceMinutes: 45,
  warningLeadMin: 30,
  overstayRate: 1000,
}

// ── Local overstay-config map ──────────────────────────────
function readConfigMap() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch { return {} }
}

function writeConfigMap(map) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(map))
    window.dispatchEvent(new CustomEvent('zweho-events-changed'))
  } catch { /* ignore */ }
}

function setEventConfig(id, partial) {
  const map = readConfigMap()
  map[id] = { ...DEFAULT_CONFIG, ...(map[id] || {}), ...partial }
  writeConfigMap(map)
}

function getEventConfig(id) {
  const map = readConfigMap()
  return { ...DEFAULT_CONFIG, ...(map[id] || {}) }
}

function deleteEventConfig(id) {
  const map = readConfigMap()
  delete map[id]
  writeConfigMap(map)
}

// ── Helpers ────────────────────────────────────────────────
function clampInt(val, min, max, fallback) {
  const n = parseInt(val, 10)
  if (isNaN(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

// Merge a backend event with its local overstay config into the
// shape the UI uses everywhere.
function normalizeEvent(backendEvent) {
  const cfg = getEventConfig(backendEvent.id)
  const kickoff = new Date(backendEvent.kickoff)
  const dateIso = kickoff.toISOString().slice(0, 10)
  const startTime = kickoff.toTimeString().slice(0, 5) // 'HH:MM'

  return {
    id: backendEvent.id,
    name: backendEvent.title || 'Untitled event',
    venue: backendEvent.venue || '',
    type: cfg.type,
    date: dateIso,
    startTime,
    endTime: cfg.endTime,
    graceMinutes: cfg.graceMinutes,
    warningLeadMin: cfg.warningLeadMin,
    overstayRate: cfg.overstayRate,
    status: backendEvent.is_active === false ? 'cancelled' : 'scheduled',
    raw: backendEvent,
  }
}

// ── In-memory cache ────────────────────────────────────────
// Holds the last-known list of backend events so the React hook
// can render instantly while the next fetch is in flight.
let cache = []
let cacheLoaded = false

function getEventsCached() {
  return cache.map(normalizeEvent)
}

export async function refreshEvents() {
  const list = await eventsApi.listEvents()
  if (Array.isArray(list) && !list._offline) {
    cache = list
    cacheLoaded = true
    window.dispatchEvent(new CustomEvent('zweho-events-changed'))
  }
  return getEventsCached()
}

// Sync read used by the hook on first render (returns whatever
// is in the cache — empty array if nothing fetched yet).
export function getEvents() {
  return getEventsCached()
}

// ── CRUD ────────────────────────────────────────────────────
export async function addEvent(data) {
  // Build backend kickoff from date + startTime.
  const kickoffIso = new Date(`${data.date}T${data.startTime || '18:00'}:00`).toISOString()
  const created = await eventsApi.createEvent({
    title: data.name?.trim() || 'Untitled event',
    kickoff: kickoffIso,
    venue: data.venue?.trim() || 'Amahoro Stadium',
  })
  // Save overstay config locally, keyed by Bruno's UUID.
  setEventConfig(created.id, {
    type: data.type || 'Other',
    endTime: data.endTime || '20:00',
    graceMinutes: clampInt(data.graceMinutes, 0, 600, 45),
    warningLeadMin: clampInt(data.warningLeadMin, 0, 600, 30),
    overstayRate: clampInt(data.overstayRate, 0, 100000, 1000),
  })
  await refreshEvents()
  return normalizeEvent(created)
}

export async function updateEvent(id, changes) {
  const existing = cache.find(e => e.id === id)
  if (!existing) throw new Error('Event not found')

  // Did anything backend-side change?
  const backendPayload = {}
  if (changes.name != null) backendPayload.title = changes.name
  if (changes.venue != null) backendPayload.venue = changes.venue
  if (changes.date != null || changes.startTime != null) {
    const date = changes.date || new Date(existing.kickoff).toISOString().slice(0, 10)
    const time = changes.startTime || new Date(existing.kickoff).toTimeString().slice(0, 5)
    backendPayload.kickoff = new Date(`${date}T${time}:00`).toISOString()
  }
  if (Object.keys(backendPayload).length > 0) {
    await eventsApi.updateEvent(id, backendPayload)
  }

  // Always update local overstay config — even if only overstay fields changed.
  const cfgUpdate = {}
  if (changes.type != null) cfgUpdate.type = changes.type
  if (changes.endTime != null) cfgUpdate.endTime = changes.endTime
  if (changes.graceMinutes != null) cfgUpdate.graceMinutes = clampInt(changes.graceMinutes, 0, 600, 45)
  if (changes.warningLeadMin != null) cfgUpdate.warningLeadMin = clampInt(changes.warningLeadMin, 0, 600, 30)
  if (changes.overstayRate != null) cfgUpdate.overstayRate = clampInt(changes.overstayRate, 0, 100000, 1000)
  if (Object.keys(cfgUpdate).length > 0) setEventConfig(id, cfgUpdate)

  await refreshEvents()
}

export async function cancelEvent(id) {
  await eventsApi.updateEvent(id, { is_active: false })
  await refreshEvents()
}

export async function reinstateEvent(id) {
  await eventsApi.updateEvent(id, { is_active: true })
  await refreshEvents()
}

export async function deleteEvent(id) {
  // Bruno's API soft-deletes via is_active=false; same call.
  await eventsApi.deactivateEvent(id)
  deleteEventConfig(id)
  await refreshEvents()
}

// ── Time helpers (unchanged signatures) ────────────────────
export function eventDateTime(event, which = 'end') {
  const time = which === 'start' ? event.startTime : event.endTime
  const [h, m] = (time || '00:00').split(':').map(Number)
  const d = new Date(event.date + 'T00:00:00')
  d.setHours(h || 0, m || 0, 0, 0)
  return d
}

export function isEventOver(event, now = new Date()) {
  return now.getTime() > eventDateTime(event, 'end').getTime()
}

// ── Overstay calculator — unchanged ────────────────────────
export function overstayStatus(event, parkingStartTime, now = new Date()) {
  const eventEnd = eventDateTime(event, 'end')
  const chargeStart = new Date(eventEnd.getTime() + event.graceMinutes * 60_000)
  const warningAt = new Date(chargeStart.getTime() - event.warningLeadMin * 60_000)

  const nowMs = now.getTime()
  let state = 'ok'
  if (nowMs >= chargeStart.getTime()) state = 'overstaying'
  else if (nowMs >= warningAt.getTime()) state = 'warned'

  let hoursOver = 0
  let amountOwed = 0
  if (state === 'overstaying') {
    hoursOver = (nowMs - chargeStart.getTime()) / 3_600_000
    amountOwed = Math.ceil(hoursOver) * event.overstayRate
  }

  return {
    state, eventEnd, chargeStart, warningAt,
    hoursOver, amountOwed,
    minutesUntilCharge: state !== 'overstaying'
      ? Math.max(0, Math.round((chargeStart.getTime() - nowMs) / 60_000))
      : 0,
  }
}

// ── React hook ──────────────────────────────────────────────
export function useEvents() {
  const [events, setEvents] = useState(getEventsCached())
  const [loading, setLoading] = useState(!cacheLoaded)

  useEffect(() => {
    let cancelled = false
    const sync = async () => {
      setLoading(true)
      try {
        const fresh = await refreshEvents()
        if (!cancelled) setEvents(fresh)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    sync()

    const onChange = () => setEvents(getEventsCached())
    window.addEventListener('zweho-events-changed', onChange)
    return () => {
      cancelled = true
      window.removeEventListener('zweho-events-changed', onChange)
    }
  }, [])

  return {
    events,
    loading,
    addEvent:       useCallback((d) => addEvent(d), []),
    updateEvent:    useCallback((id, c) => updateEvent(id, c), []),
    cancelEvent:    useCallback((id) => cancelEvent(id), []),
    reinstateEvent: useCallback((id) => reinstateEvent(id), []),
    deleteEvent:    useCallback((id) => deleteEvent(id), []),
    refresh:        useCallback(() => refreshEvents().then(setEvents), []),
  }
}