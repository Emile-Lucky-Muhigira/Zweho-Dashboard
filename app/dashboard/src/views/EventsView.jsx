import React, { useState } from 'react'
import { Panel, MetricCard, Pill, Eyebrow } from '../components/ui'
import { Icons } from '../components/Icons'

// Mock events data — replace with API call when Bruno's events endpoint is live
const EVENTS = [
  { id: 'ev_001', date: '2026-05-17', time: '18:00', name: 'Rwanda vs Nigeria', subtitle: 'AFCON Qualifier', tier: 'major', expected: 28000, projected_fill: 94, bookings: 187, status: 'upcoming' },
  { id: 'ev_002', date: '2026-05-21', time: '16:30', name: 'APR FC vs Police FC', subtitle: 'RPL · Matchday 22', tier: 'regular', expected: 12000, projected_fill: 60, bookings: 78, status: 'upcoming' },
  { id: 'ev_003', date: '2026-05-24', time: '19:00', name: 'Liberation Day Concert', subtitle: 'Featuring Bruce Melodie', tier: 'major', expected: 25000, projected_fill: 88, bookings: 142, status: 'upcoming' },
  { id: 'ev_004', date: '2026-06-01', time: '15:00', name: 'Rayon Sports vs Mukura', subtitle: 'RPL · Matchday 23', tier: 'regular', expected: 9000, projected_fill: 55, bookings: 42, status: 'upcoming' },
  { id: 'ev_005', date: '2026-05-10', time: '18:00', name: 'APR FC vs Rayon Sports', subtitle: 'RPL · Derby', tier: 'major', expected: 24000, projected_fill: 92, bookings: 198, status: 'past', revenue: 412000 },
  { id: 'ev_006', date: '2026-05-04', time: '16:00', name: 'Police FC vs Mukura', subtitle: 'RPL · Matchday 20', tier: 'regular', expected: 7000, projected_fill: 48, bookings: 36, status: 'past', revenue: 72000 },
]

export default function EventsView() {
  const [filter, setFilter] = useState('all')
  const [selectedEvent, setSelectedEvent] = useState(null)

  const filteredEvents = EVENTS.filter(e => {
    if (filter === 'upcoming') return e.status === 'upcoming'
    if (filter === 'past') return e.status === 'past'
    if (filter === 'major') return e.tier === 'major'
    return true
  })

  const upcomingCount = EVENTS.filter(e => e.status === 'upcoming').length
  const upcomingBookings = EVENTS.filter(e => e.status === 'upcoming').reduce((s, e) => s + e.bookings, 0)
  const nextEvent = EVENTS.find(e => e.status === 'upcoming')

  return (
    <div className="space-y-5 fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard label="Upcoming Events" value={upcomingCount} tone="info" />
        <MetricCard label="Total Bookings (upcoming)" value={upcomingBookings} delta="+22%" tone="free" />
        <MetricCard label="Next Event" value={nextEvent?.name.split(' ').slice(0, 2).join(' ') || '—'} unit={nextEvent?.date.slice(5) || ''} tone="busy" />
        <MetricCard label="Avg Match-Day Fill" value="86" unit="% projected" tone="busy" />
      </div>

      <Panel
        title="All Events"
        subtitle="Match schedule & concerts"
        noPadding
        action={
          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'past', label: 'Past' },
              { id: 'major', label: 'Major only' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className="px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-[0.12em] rounded font-semibold transition-colors"
                style={{
                  background: filter === f.id ? 'var(--zp-primary-soft)' : 'transparent',
                  color: filter === f.id ? 'var(--zp-primary)' : 'var(--zp-ink-2)',
                  border: '1px solid ' + (filter === f.id ? 'var(--zp-primary-soft)' : 'var(--zp-line)'),
                }}
              >
                {f.label}
              </button>
            ))}
            <button
              className="ml-2 flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
              style={{ background: 'var(--zp-primary)', color: '#fff' }}
            >
              <Icons.Plus size={13} /> Add event
            </button>
          </div>
        }
      >
        <div className="divide-y" style={{ borderColor: 'var(--zp-line)' }}>
          {filteredEvents.map(e => {
            const isMajor = e.tier === 'major'
            const isPast = e.status === 'past'
            return (
              <div
                key={e.id}
                onClick={() => setSelectedEvent(selectedEvent === e.id ? null : e.id)}
                className="px-5 py-4 cursor-pointer transition-colors"
                style={{
                  background: selectedEvent === e.id ? 'var(--zp-primary-soft)' : 'transparent',
                  borderTop: '1px solid var(--zp-line)',
                }}
                onMouseEnter={el => { if (selectedEvent !== e.id) el.currentTarget.style.background = 'var(--zp-surface-2)' }}
                onMouseLeave={el => { if (selectedEvent !== e.id) el.currentTarget.style.background = 'transparent' }}
              >
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Date block */}
                  <div
                    className="rounded-md flex flex-col items-center justify-center w-16 h-16 flex-shrink-0"
                    style={{ background: isMajor ? 'var(--zp-accent-soft)' : 'var(--zp-surface-2)', color: isMajor ? 'var(--zp-accent-ink)' : 'var(--zp-ink-2)' }}
                  >
                    <div className="font-mono text-[9px] uppercase tracking-[0.14em] font-semibold">
                      {new Date(e.date).toLocaleDateString('en-GB', { month: 'short' })}
                    </div>
                    <div className="font-display text-2xl leading-none mt-0.5">
                      {new Date(e.date).getDate()}
                    </div>
                  </div>

                  {/* Event details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-[15px] font-semibold" style={{ color: 'var(--zp-ink)' }}>{e.name}</div>
                      <Pill variant={isMajor ? 'accent' : 'default'}>{e.tier}</Pill>
                      {isPast && <Pill variant="info">past</Pill>}
                    </div>
                    <div className="font-mono text-[11px] mt-1" style={{ color: 'var(--zp-ink-3)' }}>
                      {e.subtitle} · Kickoff {e.time} · Expected {e.expected.toLocaleString()} attendees
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-6 flex-shrink-0">
                    <div className="text-right">
                      <div className="font-mono text-[10px] uppercase tracking-[0.14em] font-semibold" style={{ color: 'var(--zp-ink-3)' }}>
                        {isPast ? 'Final fill' : 'Projected fill'}
                      </div>
                      <div className="font-mono text-lg font-bold mt-0.5" style={{ color: e.projected_fill >= 80 ? 'var(--zp-busy)' : 'var(--zp-ink)' }}>
                        {e.projected_fill}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-[10px] uppercase tracking-[0.14em] font-semibold" style={{ color: 'var(--zp-ink-3)' }}>
                        {isPast ? 'Revenue' : 'Bookings'}
                      </div>
                      <div className="font-mono text-lg font-bold mt-0.5" style={{ color: 'var(--zp-ink)' }}>
                        {isPast ? `${(e.revenue / 1000).toFixed(0)}K` : e.bookings}
                      </div>
                    </div>
                  </div>

                  <Icons.ChevronRight size={18} style={{ color: 'var(--zp-ink-3)', transform: selectedEvent === e.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>

                {selectedEvent === e.id && (
                  <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--zp-line)' }}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <Eyebrow>Pre-event ops</Eyebrow>
                        <div className="space-y-2 mt-3 text-[12px]" style={{ color: 'var(--zp-ink-2)' }}>
                          <div>Open bookings: <span className="font-mono font-semibold" style={{ color: 'var(--zp-ink)' }}>72h before</span></div>
                          <div>Staff briefing: <span className="font-mono font-semibold" style={{ color: 'var(--zp-ink)' }}>{e.time} − 2h</span></div>
                          <div>Gate open: <span className="font-mono font-semibold" style={{ color: 'var(--zp-ink)' }}>{e.time} − 90m</span></div>
                          <div>Gate close: <span className="font-mono font-semibold" style={{ color: 'var(--zp-ink)' }}>{e.time} + 30m</span></div>
                        </div>
                      </div>
                      <div>
                        <Eyebrow>Pricing</Eyebrow>
                        <div className="space-y-2 mt-3 text-[12px]" style={{ color: 'var(--zp-ink-2)' }}>
                          <div className="flex justify-between"><span>Zone A · North</span><span className="font-mono font-semibold" style={{ color: 'var(--zp-ink)' }}>2,000 RWF</span></div>
                          <div className="flex justify-between"><span>Zone B · East</span><span className="font-mono font-semibold" style={{ color: 'var(--zp-ink)' }}>2,500 RWF</span></div>
                          <div className="flex justify-between"><span>Zone C · VIP</span><span className="font-mono font-semibold" style={{ color: 'var(--zp-ink)' }}>5,000 RWF</span></div>
                          <div className="flex justify-between"><span>Zone D · South</span><span className="font-mono font-semibold" style={{ color: 'var(--zp-ink)' }}>1,500 RWF</span></div>
                        </div>
                      </div>
                      <div>
                        <Eyebrow>Actions</Eyebrow>
                        <div className="space-y-1.5 mt-3">
                          <ActionBtn>Edit event details →</ActionBtn>
                          <ActionBtn>View bookings →</ActionBtn>
                          {isPast && <ActionBtn>Generate report →</ActionBtn>}
                          {!isPast && <ActionBtn>Cancel event →</ActionBtn>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}

function ActionBtn({ children }) {
  return (
    <button
      className="w-full text-left px-3 py-2 text-[12px] rounded-md transition-colors"
      style={{ color: 'var(--zp-ink-2)' }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'var(--zp-primary-soft)'
        e.currentTarget.style.color = 'var(--zp-primary)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = 'var(--zp-ink-2)'
      }}
    >
      {children}
    </button>
  )
}