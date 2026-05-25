import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getScanHistory, isOffline } from '../lib/api'
import { Panel, MetricCard, Pill } from '../components/ui'
import { Icons } from '../components/Icons'

export default function ScanHistoryView() {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const { data: scans = [] } = useQuery({
    queryKey: ['scan-history'],
    queryFn: getScanHistory,
  })

  const offline = isOffline(scans)

  const filtered = scans.filter(s => {
    if (filter === 'valid' && !s.valid) return false
    if (filter === 'denied' && s.valid) return false
    if (filter === 'today' && s.date !== 'Today') return false
    if (search) {
      const q = search.toLowerCase()
      if (!s.id.toLowerCase().includes(q) && !(s.plate || '').toLowerCase().includes(q)) return false
    }
    return true
  })

  const todayScans = scans.filter(s => s.date === 'Today')
  const granted = todayScans.filter(s => s.valid).length
  const denied = todayScans.filter(s => !s.valid).length

  return (
    <div className="space-y-5 fade-in">
      {/* Shift summary — from real scans */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard label="Scans Today" value={todayScans.length} tone="info" />
        <MetricCard label="Granted" value={granted} tone="free" />
        <MetricCard label="Denied" value={denied} tone={denied > 0 ? 'full' : 'free'} />
        <MetricCard label="Total Scans" value={scans.length} tone="info" />
      </div>

      <Panel
        title="Scan History"
        subtitle="All gate scans · Recent first"
        noPadding
        action={
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-md"
            style={{ border: '1px solid var(--zp-line)', background: 'var(--zp-surface)' }}>
            <Icons.Search size={14} style={{ color: 'var(--zp-ink-3)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search ID or plate…"
              className="bg-transparent text-[13px] font-mono w-44 outline-none"
              style={{ color: 'var(--zp-ink)' }}
            />
          </div>
        }
      >
        {/* Filters */}
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

        {/* Table */}
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
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <div className="text-[13px] font-semibold" style={{ color: 'var(--zp-ink)' }}>
                      {offline || scans.length === 0 ? 'No scans recorded yet' : 'No scans match this filter'}
                    </div>
                    <p className="text-[12px] mt-1 max-w-md mx-auto" style={{ color: 'var(--zp-ink-2)' }}>
                      {offline || scans.length === 0
                        ? 'Every ticket scanned at the gates will be logged here once the backend and scanner app are connected.'
                        : 'Try a different filter or clear your search.'}
                    </p>
                  </td>
                </tr>
              )}
              {filtered.map((s) => (
                <tr key={s.id + s.time} style={{ borderTop: '1px solid var(--zp-line)' }}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded flex items-center justify-center text-[12px] font-bold flex-shrink-0"
                        style={{
                          background: s.valid ? 'var(--zp-free-soft)' : 'var(--zp-full-soft)',
                          color: s.valid ? 'var(--zp-free)' : 'var(--zp-full)',
                        }}>
                        {s.valid ? '✓' : '✗'}
                      </div>
                      {!s.valid && s.reason && <Pill variant="danger">{s.reason}</Pill>}
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-[13px] font-semibold" style={{ color: 'var(--zp-ink)' }}>{s.id}</td>
                  <td className="px-5 py-3 font-mono text-[12px]" style={{ color: 'var(--zp-ink-2)' }}>{s.plate || '—'}</td>
                  <td className="px-5 py-3 font-mono text-[12px] font-semibold" style={{ color: 'var(--zp-ink)' }}>{s.spot || '—'}</td>
                  <td className="px-5 py-3 text-[12px]" style={{ color: 'var(--zp-ink-2)' }}>{s.gate || '—'}</td>
                  <td className="px-5 py-3 text-[12px]" style={{ color: 'var(--zp-ink-2)' }}>{s.operator || '—'}</td>
                  <td className="px-5 py-3 text-right font-mono text-[12px]" style={{ color: 'var(--zp-ink-3)' }}>
                    {s.date === 'Today' ? s.time : `${s.date || ''} ${s.time || ''}`}
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