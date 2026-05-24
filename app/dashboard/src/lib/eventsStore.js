// ============================================================
// Events store — admin-managed stadium events.
//
// Events are configuration (the admin creates them), so they
// persist in localStorage and work fully now. When Bruno's
// backend is live, each write also POSTs to the API.
//
// An event:
//   {
//     id, name, type,
//     date,            // 'YYYY-MM-DD'
//     startTime,       // 'HH:MM'
//     endTime,         // 'HH:MM'
//     graceMinutes,    // free minutes after endTime before charging
//     warningLeadMin,  // minutes before charging that the visitor is warned
//     overstayRate,    // RWF charged per hour, after grace
//     status,          // 'scheduled' | 'cancelled'
//   }
// ============================================================
import { useState, useEffect, useCallback } from 'react'
import { STORAGE_KEYS } from './constants'

const KEY = STORAGE_KEYS.events

export const EVENT_TYPES = ['Football match', 'Concert', 'Ceremony', 'Conference', 'Other']

// ── Read / write ────────────────────────────────────────────
export function getEvents() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveEvents(events) {
  try {
    localStorage.setItem(KEY, JSON.stringify(events))
    window.dispatchEvent(new CustomEvent('zweho-events-changed'))
  } catch {
    /* ignore */
  }
}

function genId() {
  return 'ev_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

// ── CRUD ────────────────────────────────────────────────────
export function addEvent(data) {
  const events = getEvents()
  const event = {
    id: genId(),
    name: data.name?.trim() || 'Untitled event',
    type: data.type || 'Other',
    date: data.date || new Date().toISOString().slice(0, 10),
    startTime: data.startTime || '18:00',
    endTime: data.endTime || '20:00',
    graceMinutes: clampInt(data.graceMinutes, 0, 600, 45),
    warningLeadMin: clampInt(data.warningLeadMin, 0, 600, 30),
    overstayRate: clampInt(data.overstayRate, 0, 100000, 1000),
    status: 'scheduled',
  }
  saveEvents([...events, event])
  return event
}

export function updateEvent(id, changes) {
  const events = getEvents().map(e => {
    if (e.id !== id) return e
    return {
      ...e,
      ...changes,
      graceMinutes:   changes.graceMinutes   != null ? clampInt(changes.graceMinutes, 0, 600, e.graceMinutes)     : e.graceMinutes,
      warningLeadMin: changes.warningLeadMin != null ? clampInt(changes.warningLeadMin, 0, 600, e.warningLeadMin) : e.warningLeadMin,
      overstayRate:   changes.overstayRate   != null ? clampInt(changes.overstayRate, 0, 100000, e.overstayRate)  : e.overstayRate,
    }
  })
  saveEvents(events)
}

export function cancelEvent(id) {
  updateEvent(id, { status: 'cancelled' })
}

export function reinstateEvent(id) {
  updateEvent(id, { status: 'scheduled' })
}

export function deleteEvent(id) {
  saveEvents(getEvents().filter(e => e.id !== id))
}

function clampInt(val, min, max, fallback) {
  const n = parseInt(val, 10)
  if (isNaN(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

// ── Time helpers ────────────────────────────────────────────
// Combine an event's date + 'HH:MM' into a real Date object.
export function eventDateTime(event, which = 'end') {
  const time = which === 'start' ? event.startTime : event.endTime
  const [h, m] = (time || '00:00').split(':').map(Number)
  const d = new Date(event.date + 'T00:00:00')
  d.setHours(h || 0, m || 0, 0, 0)
  return d
}

// Has the event finished (real end time passed)?
export function isEventOver(event, now = new Date()) {
  return now.getTime() > eventDateTime(event, 'end').getTime()
}

// ── Overstay calculator — the core logic ────────────────────
//
// Given an event and a car's parking-start time, work out:
//   state:  'ok' | 'warned' | 'overstaying'
//   the charging-start moment, warning moment, amount owed.
//
// Timeline after an event ends:
//   endTime ──grace──► chargeStart
//             warning sent (warningLeadMin before chargeStart)
//
export function overstayStatus(event, parkingStartTime, now = new Date()) {
  const eventEnd = eventDateTime(event, 'end')
  const chargeStart = new Date(eventEnd.getTime() + event.graceMinutes * 60_000)
  const warningAt = new Date(chargeStart.getTime() - event.warningLeadMin * 60_000)

  const nowMs = now.getTime()
  let state = 'ok'
  if (nowMs >= chargeStart.getTime()) state = 'overstaying'
  else if (nowMs >= warningAt.getTime()) state = 'warned'

  // Amount owed — only once charging has started.
  let hoursOver = 0
  let amountOwed = 0
  if (state === 'overstaying') {
    hoursOver = (nowMs - chargeStart.getTime()) / 3_600_000
    // Charge per started hour (round up) — standard for parking.
    amountOwed = Math.ceil(hoursOver) * event.overstayRate
  }

  return {
    state,                       // 'ok' | 'warned' | 'overstaying'
    eventEnd,
    chargeStart,
    warningAt,
    hoursOver,                   // decimal hours past charge-start
    amountOwed,                  // RWF
    minutesUntilCharge: state !== 'overstaying'
      ? Math.max(0, Math.round((chargeStart.getTime() - nowMs) / 60_000))
      : 0,
  }
}

// ── React hook ──────────────────────────────────────────────
export function useEvents() {
  const [events, setEvents] = useState(getEvents())

  useEffect(() => {
    const refresh = () => setEvents(getEvents())
    window.addEventListener('zweho-events-changed', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('zweho-events-changed', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  return {
    events,
    addEvent:       useCallback((d) => addEvent(d), []),
    updateEvent:    useCallback((id, c) => updateEvent(id, c), []),
    cancelEvent:    useCallback((id) => cancelEvent(id), []),
    reinstateEvent: useCallback((id) => reinstateEvent(id), []),
    deleteEvent:    useCallback((id) => deleteEvent(id), []),
  }
}