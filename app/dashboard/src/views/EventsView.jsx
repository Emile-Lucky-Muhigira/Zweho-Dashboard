import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  useEvents, EVENT_TYPES, eventDateTime, isEventOver, overstayStatus,
} from '../lib/eventsStore'
import { getBookings, isOffline } from '../lib/api'
import { useAuth } from '../lib/auth'
import { Panel, MetricCard, Pill, Eyebrow } from '../components/ui'
import { Icons } from '../components/Icons'
import EmptyState from '../components/EmptyState'
import { useToast } from '../lib/toast'

export default function EventsView() {
  const { events, addEvent, updateEvent, cancelEvent, reinstateEvent, deleteEvent } = useEvents()
  const { user } = useAuth()
  const toast = useToast()
  const isAdmin = user?.role === 'admin'

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [filter, setFilter] = useState('all')

  const now = new Date()

  // Sort: upcoming first (soonest), then past, then cancelled
  const sorted = useMemo(() => {
    return [...events].sort((a, b) => {
      const aOver = isEventOver(a), bOver = isEventOver(b)
      if (aOver !== bOver) return aOver ? 1 : -1
      return eventDateTime(a, 'start') - eventDateTime(b, 'start')
    })
  }, [events])

  const filtered = sorted.filter(e => {
    if (filter === 'upcoming') return e.status === 'scheduled' && !isEventOver(e)
    if (filter === 'past')     return e.status === 'scheduled' && isEventOver(e)
    if (filter === 'cancelled') return e.status === 'cancelled'
    return true
  })

  const upcomingCount = events.filter(e => e.status === 'scheduled' && !isEventOver(e)).length
  const nextEvent = sorted.find(e => e.status === 'scheduled' && !isEventOver(e))

  return (
    <div className="space-y-5 fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard label="Total Events" value={events.length} tone="info" />
        <MetricCard label="Upcoming" value={upcomingCount} tone="free" />
        <MetricCard
          label="Next Event"
          value={nextEvent ? nextEvent.name.split(' ').slice(0, 2).join(' ') : '—'}
          unit={nextEvent ? nextEvent.date.slice(5) : 'none scheduled'}
          tone="busy"
        />
        <MetricCard label="Cancelled" value={events.filter(e => e.status === 'cancelled').length} tone="full" />
      </div>

      {/* Overstay monitor */}
      <OverstayMonitor events={events} />

      {/* Events list */}
      <Panel
        title="Stadium Events"
        subtitle="Admin-managed · Create & configure"
        noPadding
        action={
          isAdmin && (
            <div className="flex items-center gap-1">
              {[
                { id: 'all', label: 'All' },
                { id: 'upcoming', label: 'Upcoming' },
                { id: 'past', label: 'Past' },
                { id: 'cancelled', label: 'Cancelled' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className="px-2.5 py-1 text-[11px] font-mono uppercase tracking-[0.12em] rounded font-semibold transition-colors"
                  style={{
                    background: filter === f.id ? 'var(--zp-primary-soft)' : 'transparent',
                    color: filter === f.id ? 'var(--zp-primary)' : 'var(--zp-ink-2)',
                  }}
                >
                  {f.label}
                </button>
              ))}
              <button
                onClick={() => { setShowForm(true); setEditingId(null) }}
                className="ml-2 flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
                style={{ background: 'var(--zp-primary)', color: '#fff' }}
              >
                <Icons.Plus size={13} /> Add event
              </button>
            </div>
          )
        }
      >
        {/* Add form */}
        {showForm && (
          <EventForm
            onSave={(data) => {
              const e = addEvent(data)
              toast.success('Event created', e.name)
              setShowForm(false)
            }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Empty state */}
        {events.length === 0 && !showForm && (
          <div className="p-6">
            <EmptyState
              variant="empty"
              icon="Stadium"
              title="No events yet"
              message={isAdmin
                ? 'Create your first stadium event. You set the schedule, grace period, and overstay rate — all editable later.'
                : 'No events have been scheduled yet.'}
              action={isAdmin ? { label: 'Add event', onClick: () => setShowForm(true) } : null}
            />
          </div>
        )}

        {/* Event rows */}
        <div>
          {filtered.map((e, i) => {
            if (editingId === e.id) {
              return (
                <EventForm
                  key={e.id}
                  initial={e}
                  onSave={(data) => {
                    updateEvent(e.id, data)
                    toast.success('Event updated', data.name)
                    setEditingId(null)
                  }}
                  onCancel={() => setEditingId(null)}
                />
              )
            }
            return (
              <EventRow
                key={e.id}
                event={e}
                isAdmin={isAdmin}
                topBorder={i > 0}
                onEdit={() => { setEditingId(e.id); setShowForm(false) }}
                onCancel={() => { cancelEvent(e.id); toast.warn('Event cancelled', e.name) }}
                onReinstate={() => { reinstateEvent(e.id); toast.success('Event reinstated', e.name) }}
                onDelete={() => {
                  if (confirm(`Permanently delete "${e.name}"? This cannot be undone.`)) {
                    deleteEvent(e.id)
                    toast.error('Event deleted', e.name)
                  }
                }}
              />
            )
          })}
        </div>
      </Panel>
    </div>
  )
}

/* ── Single event row ──────────────────────────────────────── */
function EventRow({ event, isAdmin, topBorder, onEdit, onCancel, onReinstate, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const over = isEventOver(event)
  const cancelled = event.status === 'cancelled'
  const start = eventDateTime(event, 'start')

  return (
    <div
      style={{
        borderTop: topBorder ? '1px solid var(--zp-line)' : 'none',
        opacity: cancelled ? 0.6 : 1,
      }}
    >
      <div className="px-5 py-4 flex items-center gap-4 flex-wrap">
        {/* Date block */}
        <div
          className="rounded-md flex flex-col items-center justify-center w-16 h-16 flex-shrink-0"
          style={{
            background: cancelled ? 'var(--zp-surface-2)' : 'var(--zp-primary-soft)',
            color: cancelled ? 'var(--zp-ink-3)' : 'var(--zp-primary)',
          }}
        >
          <div className="font-mono text-[9px] uppercase tracking-[0.14em] font-semibold">
            {start.toLocaleDateString('en-GB', { month: 'short' })}
          </div>
          <div className="font-display text-2xl leading-none mt-0.5">{start.getDate()}</div>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[15px] font-semibold" style={{ color: 'var(--zp-ink)' }}>{event.name}</span>
            <Pill variant="info">{event.type}</Pill>
            {cancelled && <Pill variant="danger">cancelled</Pill>}
            {!cancelled && over && <Pill variant="default">finished</Pill>}
            {!cancelled && !over && <Pill variant="success">scheduled</Pill>}
          </div>
          <div className="font-mono text-[11px] mt-1" style={{ color: 'var(--zp-ink-3)' }}>
            {event.startTime}–{event.endTime} · Grace {event.graceMinutes}m · {event.overstayRate.toLocaleString()} RWF/hr overstay
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-[0.12em] rounded-md font-semibold"
            style={{ background: 'var(--zp-surface-2)', color: 'var(--zp-ink-2)', border: '1px solid var(--zp-line)' }}
          >
            {expanded ? 'Less' : 'Details'}
          </button>

          {isAdmin && (
            <>
              <button
                onClick={onEdit}
                className="px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-[0.12em] rounded-md font-semibold"
                style={{ background: 'var(--zp-surface-2)', color: 'var(--zp-ink-2)', border: '1px solid var(--zp-line)' }}
              >
                Edit
              </button>
              {cancelled ? (
                <button
                  onClick={onReinstate}
                  className="px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-[0.12em] rounded-md font-semibold"
                  style={{ background: 'var(--zp-free-soft)', color: 'var(--zp-free)', border: '1px solid color-mix(in srgb, var(--zp-free) 30%, transparent)' }}
                >
                  Reinstate
                </button>
              ) : (
                <button
                  onClick={onCancel}
                  className="px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-[0.12em] rounded-md font-semibold"
                  style={{ background: 'var(--zp-busy-soft)', color: 'var(--zp-busy)', border: '1px solid color-mix(in srgb, var(--zp-busy) 30%, transparent)' }}
                >
                  Cancel
                </button>
              )}
              <button
                onClick={onDelete}
                className="w-8 h-8 flex items-center justify-center rounded-md"
                style={{ color: 'var(--zp-full)' }}
                title="Delete permanently"
              >
                <Icons.X size={15} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-5 pb-4">
          <div className="rounded-md p-4" style={{ background: 'var(--zp-surface-2)' }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <Eyebrow>Schedule</Eyebrow>
                <div className="space-y-1 mt-2 text-[12px]">
                  <DetailLine label="Date" value={event.date} />
                  <DetailLine label="Starts" value={event.startTime} />
                  <DetailLine label="Ends" value={event.endTime} />
                </div>
              </div>
              <div>
                <Eyebrow>Overstay rules</Eyebrow>
                <div className="space-y-1 mt-2 text-[12px]">
                  <DetailLine label="Grace period" value={`${event.graceMinutes} min`} />
                  <DetailLine label="Warning sent" value={`${event.warningLeadMin} min before charge`} />
                  <DetailLine label="Overstay rate" value={`${event.overstayRate.toLocaleString()} RWF / hr`} />
                </div>
              </div>
              <div>
                <Eyebrow>How it works</Eyebrow>
                <p className="text-[11px] mt-2 leading-relaxed" style={{ color: 'var(--zp-ink-2)' }}>
                  After the event ends, parked cars stay free for {event.graceMinutes} minutes.
                  {event.warningLeadMin} minutes before that grace ends, the visitor is notified.
                  After grace, overstay is charged at {event.overstayRate.toLocaleString()} RWF per started hour.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailLine({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: 'var(--zp-ink-3)' }}>{label}</span>
      <span className="font-mono font-semibold" style={{ color: 'var(--zp-ink)' }}>{value}</span>
    </div>
  )
}

/* ── Add / Edit form ───────────────────────────────────────── */
function EventForm({ initial, onSave, onCancel }) {
  const [f, setF] = useState({
    name: initial?.name || '',
    type: initial?.type || EVENT_TYPES[0],
    date: initial?.date || new Date().toISOString().slice(0, 10),
    startTime: initial?.startTime || '18:00',
    endTime: initial?.endTime || '20:00',
    graceMinutes: initial?.graceMinutes ?? 45,
    warningLeadMin: initial?.warningLeadMin ?? 30,
    overstayRate: initial?.overstayRate ?? 1000,
  })

  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }))

  const inputStyle = {
    background: 'var(--zp-surface)',
    border: '1px solid var(--zp-line)',
    color: 'var(--zp-ink)',
  }
  const labelCls = 'font-mono text-[10px] uppercase tracking-[0.14em]'

  return (
    <div className="px-5 py-4" style={{ background: 'var(--zp-primary-soft)', borderBottom: '1px solid var(--zp-line)' }}>
      <Eyebrow>{initial ? `Edit · ${initial.name}` : 'New event'}</Eyebrow>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-3">
        {/* Name */}
        <div className="md:col-span-6">
          <label className={labelCls} style={{ color: 'var(--zp-ink-3)' }}>Event name</label>
          <input
            value={f.name}
            onChange={e => set('name', e.target.value)}
            placeholder="e.g. Rwanda vs Nigeria"
            className="w-full mt-1 px-3 py-2 text-[13px] rounded-md outline-none"
            style={inputStyle}
          />
        </div>
        {/* Type */}
        <div className="md:col-span-3">
          <label className={labelCls} style={{ color: 'var(--zp-ink-3)' }}>Type</label>
          <select
            value={f.type}
            onChange={e => set('type', e.target.value)}
            className="w-full mt-1 px-3 py-2 text-[13px] rounded-md outline-none"
            style={inputStyle}
          >
            {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        {/* Date */}
        <div className="md:col-span-3">
          <label className={labelCls} style={{ color: 'var(--zp-ink-3)' }}>Date</label>
          <input
            type="date"
            value={f.date}
            onChange={e => set('date', e.target.value)}
            className="w-full mt-1 px-3 py-2 text-[13px] font-mono rounded-md outline-none"
            style={inputStyle}
          />
        </div>

        {/* Start / End */}
        <div className="md:col-span-3">
          <label className={labelCls} style={{ color: 'var(--zp-ink-3)' }}>Start time</label>
          <input
            type="time"
            value={f.startTime}
            onChange={e => set('startTime', e.target.value)}
            className="w-full mt-1 px-3 py-2 text-[13px] font-mono rounded-md outline-none"
            style={inputStyle}
          />
        </div>
        <div className="md:col-span-3">
          <label className={labelCls} style={{ color: 'var(--zp-ink-3)' }}>End time</label>
          <input
            type="time"
            value={f.endTime}
            onChange={e => set('endTime', e.target.value)}
            className="w-full mt-1 px-3 py-2 text-[13px] font-mono rounded-md outline-none"
            style={inputStyle}
          />
        </div>
        {/* Grace */}
        <div className="md:col-span-2">
          <label className={labelCls} style={{ color: 'var(--zp-ink-3)' }}>Grace (min)</label>
          <input
            type="number" min="0"
            value={f.graceMinutes}
            onChange={e => set('graceMinutes', e.target.value)}
            className="w-full mt-1 px-3 py-2 text-[13px] font-mono rounded-md outline-none"
            style={inputStyle}
          />
        </div>
        {/* Warning lead */}
        <div className="md:col-span-2">
          <label className={labelCls} style={{ color: 'var(--zp-ink-3)' }}>Warn (min)</label>
          <input
            type="number" min="0"
            value={f.warningLeadMin}
            onChange={e => set('warningLeadMin', e.target.value)}
            className="w-full mt-1 px-3 py-2 text-[13px] font-mono rounded-md outline-none"
            style={inputStyle}
          />
        </div>
        {/* Rate */}
        <div className="md:col-span-2">
          <label className={labelCls} style={{ color: 'var(--zp-ink-3)' }}>RWF / hr</label>
          <input
            type="number" min="0"
            value={f.overstayRate}
            onChange={e => set('overstayRate', e.target.value)}
            className="w-full mt-1 px-3 py-2 text-[13px] font-mono rounded-md outline-none"
            style={inputStyle}
          />
        </div>
      </div>

      <div className="mt-2 font-mono text-[10px]" style={{ color: 'var(--zp-ink-3)' }}>
        After the event ends: {f.graceMinutes} min free, visitor warned {f.warningLeadMin} min before charging, then {Number(f.overstayRate).toLocaleString()} RWF per hour.
      </div>

      <div className="flex justify-end gap-2 mt-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-[11px] font-mono uppercase tracking-[0.12em] rounded-md font-semibold"
          style={{ background: 'var(--zp-surface)', color: 'var(--zp-ink-2)', border: '1px solid var(--zp-line)' }}
        >
          Cancel
        </button>
        <button
          onClick={() => {
            if (!f.name.trim()) { alert('Event name is required'); return }
            onSave(f)
          }}
          className="px-4 py-2 text-[11px] font-mono uppercase tracking-[0.12em] rounded-md font-semibold"
          style={{ background: 'var(--zp-primary)', color: '#fff' }}
        >
          {initial ? 'Save changes' : 'Create event'}
        </button>
      </div>
    </div>
  )
}

/* ── Overstay monitor ──────────────────────────────────────── */
function OverstayMonitor({ events }) {
  // Real bookings from the backend — empty until Bruno's API is live.
  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings-overstay'],
    queryFn: () => getBookings(),
    refetchInterval: 60_000,
  })

  const now = new Date()

  // For each active booking tied to a finished event, compute overstay.
  const flagged = useMemo(() => {
    const rows = []
    bookings.forEach(b => {
      const event = events.find(e => e.id === b.eventId)
      if (!event || event.status === 'cancelled') return
      if (!isEventOver(event)) return
      // b.parkingStart = when the car actually parked (camera/gate).
      const parkingStart = b.parkingStart ? new Date(b.parkingStart) : null
      const stillParked = b.status === 'parked' || b.status === 'active'
      if (!stillParked) return
      const s = overstayStatus(event, parkingStart, now)
      if (s.state === 'ok') return
      rows.push({ booking: b, event, ...s })
    })
    return rows
  }, [bookings, events])

  const offline = isOffline(bookings)
  const warned = flagged.filter(r => r.state === 'warned')
  const overstaying = flagged.filter(r => r.state === 'overstaying')
  const totalOwed = overstaying.reduce((s, r) => s + r.amountOwed, 0)

  return (
    <Panel
      title="Overstay Monitor"
      subtitle="Cars still parked after their event ended"
      action={
        flagged.length > 0
          ? <Pill variant="danger">{flagged.length} flagged</Pill>
          : <Pill variant="success">All clear</Pill>
      }
    >
      {offline || bookings.length === 0 ? (
        <div className="text-center py-6">
          <div className="text-[13px] font-semibold" style={{ color: 'var(--zp-ink)' }}>No active bookings to monitor</div>
          <p className="text-[12px] mt-1 max-w-md mx-auto" style={{ color: 'var(--zp-ink-2)' }}>
            Overstay tracking runs on live booking and camera data. Once the backend is connected, cars still parked after an event ends will appear here automatically — with warnings and charges calculated from each event's rules.
          </p>
        </div>
      ) : flagged.length === 0 ? (
        <div className="text-center py-6 text-[13px]" style={{ color: 'var(--zp-ink-3)' }}>
          No cars are overstaying. All vehicles cleared within their grace periods.
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <MiniStat label="Warned" value={warned.length} tone="busy" />
            <MiniStat label="Overstaying" value={overstaying.length} tone="full" />
            <MiniStat label="Total owed" value={`${totalOwed.toLocaleString()}`} unit="RWF" tone="full" />
          </div>
          {/* Rows */}
          <div className="space-y-2">
            {flagged.map(r => (
              <div
                key={r.booking.id}
                className="flex items-center gap-3 p-3 rounded-md flex-wrap"
                style={{ background: r.state === 'overstaying' ? 'var(--zp-full-soft)' : 'var(--zp-busy-soft)' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[13px] font-semibold" style={{ color: 'var(--zp-ink)' }}>
                      {r.booking.id}
                    </span>
                    <Pill variant={r.state === 'overstaying' ? 'danger' : 'warn'}>
                      {r.state === 'overstaying' ? 'overstaying' : 'warning sent'}
                    </Pill>
                  </div>
                  <div className="font-mono text-[11px] mt-0.5" style={{ color: 'var(--zp-ink-2)' }}>
                    {r.event.name} · {r.booking.spot || 'spot ?'}
                  </div>
                </div>
                <div className="text-right">
                  {r.state === 'overstaying' ? (
                    <>
                      <div className="font-mono text-[14px] font-bold" style={{ color: 'var(--zp-full)' }}>
                        +{r.amountOwed.toLocaleString()} RWF
                      </div>
                      <div className="font-mono text-[10px]" style={{ color: 'var(--zp-ink-3)' }}>
                        {r.hoursOver.toFixed(1)}h over
                      </div>
                    </>
                  ) : (
                    <div className="font-mono text-[11px]" style={{ color: 'var(--zp-busy)' }}>
                      charges in {r.minutesUntilCharge}m
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Panel>
  )
}

function MiniStat({ label, value, unit, tone }) {
  const colorMap = { busy: 'var(--zp-busy)', full: 'var(--zp-full)', free: 'var(--zp-free)' }
  return (
    <div className="rounded-md p-3 text-center" style={{ border: '1px solid var(--zp-line)' }}>
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] font-semibold" style={{ color: 'var(--zp-ink-3)' }}>{label}</div>
      <div className="font-mono text-xl font-bold mt-0.5" style={{ color: colorMap[tone] || 'var(--zp-ink)' }}>
        {value}{unit && <span className="text-[11px] font-normal ml-1">{unit}</span>}
      </div>
    </div>
  )
}