import React, { useState } from 'react'
import { Panel, MetricCard, Pill, Eyebrow } from '../components/ui'
import { Icons } from '../components/Icons'

// In production these come from the backend (GET /qr/scans).
// The standalone scanner app writes them; the dashboard reads them.
const SCANS = [
  { id: 'BK-2841', valid: true,  time: '14:22:54', date: 'Today', gate: 'North', plate: 'RAB 472 G', spot: 'A-14', operator: 'Daniel K.' },
  { id: 'BK-2839', valid: true,  time: '14:21:30', date: 'Today', gate: 'South', plate: 'RAC 118 K', spot: 'D-31', operator: 'Aimable N.' },
  { id: 'BK-2838', valid: false, time: '14:19:12', date: 'Today', gate: 'North', plate: 'RAD 905 B', spot: '—',    operator: 'Daniel K.', reason: 'Already used' },
  { id: 'BK-2836', valid: true,  time: '14:18:01', date: 'Today', gate: 'North', plate: 'RAE 224 M', spot: 'A-09', operator: 'Daniel K.' },
  { id: 'BK-2834', valid: true,  time: '14:16:45', date: 'Today', gate: 'East',  plate: 'RAF 671 P', spot: 'B-12', operator: 'Marie U.' },
  { id: 'BK-2830', valid: true,  time: '14:12:20', date: 'Today', gate: 'North', plate: 'RAG 338 T', spot: 'A-22', operator: 'Daniel K.' },
  { id: 'BK-2829', valid: false, time: '14:09:55', date: 'Today', gate: 'South', plate: 'RAH 502 L', spot: '—',    operator: 'Aimable N.', reason: 'Expired booking' },
  { id: 'BK-2825', valid: true,  time: '14:04:11', date: 'Today', gate: 'North', plate: 'RAJ 119 W', spot: 'A-03', operator: 'Daniel K.' },
  { id: 'BK-2102', valid: true,  time: '19:48:30', date: 'Yesterday', gate: 'North', plate: 'RAK 887 D', spot: 'A-41', operator: 'Daniel K.' },
  { id: 'BK-2098', valid: true,  time: '19:44:02', date: 'Yesterday', gate: 'East',  plate: 'RAL 256 F', spot: 'B-30', operator: 'Marie U.' },
]

export default function ScanHistoryView() {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = SCANS.filter(s => {
    if (filter === 'valid' && !s.valid) return false
    if (filter === 'denied' && s.valid) return false
    if (filter === 'today' && s.date !== 'Today') return false
    if (search) {
      const q = search.toLowerCase()
      if (!s.id.toLowerCase().includes(q) && !s.plate.toLowerCase().includes(q)) return false
    }
    return true
  })

  const todayScans = SCANS.filter(s => s.date === 'Today')
  const granted = todayScans.filter(s => s.valid).length
  const denied = todayScans.filter(s => !s.valid).length

  return (
    <div className="space-y-5 fade-in">
      {/* Shift summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard label="Scans Today" value={todayScans.length} tone="info" />
        <MetricCard label="Granted" value={granted} tone="free" />
        <MetricCard label="Denied" value={denied} tone={denied > 0 ? 'full' : 'free'} />
        <MetricCard label="Avg Scan Time" value="1.4" unit="seconds" tone="info" />
      </div>

      <Panel
        title="Scan History"
        subtitle="All gate scans · Recent first"
        noPadding
        action={
          <div className="flex items-center gap-2">
            <div
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-md"
              style={{ border: '1px solid var(--zp-line)', background: 'var(--zp-surface)' }}
            >
              <Icons.Search size={14} style={{ color: 'var(--zp-ink-3)' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search ID or plate…"
                className="bg-transparent text-[13px] font-mono w-44 outline-none"
                style={{ color: 'var(--zp-ink)' }}
              />
            </div>
          </div>
        }
      >
        {/* Filter chips */}
        <div className="flex items-center gap-1 px-5 py-3 flex-wrap" style={{ borderBottom: '1px solid var(--zp-line)', background: 'var(--zp-surface-2)' }}>
          {[
            { id: 'all', label: 'All' },
            { id: 'today', label: 'Today' },
            { id: 'valid', label: 'Granted' },
            { id: 'denied', label: 'Denied' },
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
          <span className="ml-auto font-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: 'var(--zp-ink-3)' }}>
            {filtered.length} scan{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Scan table */}
        <div className="overflow-auto max-h-[560px]">
          <table className="w-full">
            <thead className="sticky top-0 z-10" style={{ background: 'var(--zp-surface)' }}>
              <tr className="text-[10px] font-mono uppercase tracking-[0.16em]" style={{ color: 'var(--zp-ink-3)' }}>
                <th className="text-left px-5 py-3 font-semibold">Result</th>
                <th className="text-left px-5 py-3 font-semibold">Booking</th>
                <th className="text-left px-5 py-3 font-semibold">Plate</th>
                <th className="text-left px-5 py-3 font-semibold">Spot</th>
                <th className="text-left px-5 py-3 font-semibold">Gate</th>
                <th className="text-left px-5 py-3 font-semibold">Operator</th>
                <th className="text-right px-5 py-3 font-semibold">Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-[13px]" style={{ color: 'var(--zp-ink-3)' }}>
                    No scans match this filter.
                  </td>
                </tr>
              )}
              {filtered.map((s, i) => (
                <tr key={s.id + s.time} style={{ borderTop: i > 0 ? '1px solid var(--zp-line)' : 'none' }}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center text-[12px] font-bold flex-shrink-0"
                        style={{
                          background: s.valid ? 'var(--zp-free-soft)' : 'var(--zp-full-soft)',
                          color: s.valid ? 'var(--zp-free)' : 'var(--zp-full)',
                        }}
                      >
                        {s.valid ? '✓' : '✗'}
                      </div>
                      {!s.valid && <Pill variant="danger">{s.reason}</Pill>}
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-[13px] font-semibold" style={{ color: 'var(--zp-ink)' }}>{s.id}</td>
                  <td className="px-5 py-3 font-mono text-[12px]" style={{ color: 'var(--zp-ink-2)' }}>{s.plate}</td>
                  <td className="px-5 py-3 font-mono text-[12px] font-semibold" style={{ color: 'var(--zp-ink)' }}>{s.spot}</td>
                  <td className="px-5 py-3 text-[12px]" style={{ color: 'var(--zp-ink-2)' }}>{s.gate}</td>
                  <td className="px-5 py-3 text-[12px]" style={{ color: 'var(--zp-ink-2)' }}>{s.operator}</td>
                  <td className="px-5 py-3 text-right font-mono text-[12px]" style={{ color: 'var(--zp-ink-3)' }}>
                    {s.date === 'Today' ? s.time : `${s.date} ${s.time}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}