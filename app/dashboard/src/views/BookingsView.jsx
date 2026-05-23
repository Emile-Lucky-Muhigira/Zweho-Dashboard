import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getBookings, exportBookingsCSV } from '../lib/api'
import { Panel, MetricCard, Pill, DataRow, maskPhone, Eyebrow } from '../components/ui'
import { useToast } from '../lib/toast'
import { Icons } from '../components/Icons'

export default function BookingsView() {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)
  const toast = useToast()

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings', filter, search],
    queryFn: () => getBookings({ status: filter, search }),
  })

  const handleExport = async () => {
    try {
      const url = await exportBookingsCSV({ status: filter, search })
      const a = document.createElement('a')
      a.href = url
      a.download = `zweho-bookings-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      toast.success('Export complete', `${bookings.length} bookings downloaded`)
    } catch (err) {
      toast.error('Export failed', err.message || 'Try again or contact support')
    }
  }

  return (
    <div className="space-y-5 fade-in">
      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard label="Today's Bookings" value="47" delta="+12% vs yest" tone="free" />
        <MetricCard label="Pending Payment" value="3" unit="awaiting MoMo" tone="busy" />
        <MetricCard label="Active Now" value="28" unit="in-park" tone="info" />
        <MetricCard label="Today's Revenue" value="84,500" unit="RWF" tone="free" />
      </div>

      <Panel
        title="All Bookings"
        subtitle="Filter, search, export"
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
                placeholder="Search ID or phone…"
                className="bg-transparent text-[13px] font-mono w-48 outline-none"
                style={{ color: 'var(--zp-ink)' }}
              />
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-mono uppercase tracking-[0.15em] rounded-md font-semibold transition-opacity hover:opacity-90"
              style={{ background: 'var(--zp-primary)', color: '#fff' }}
            >
              <Icons.Download size={13} /> Export CSV
            </button>
          </div>
        }
      >
        {/* Filter chips */}
        <div
          className="flex items-center gap-1 px-5 py-3 flex-wrap"
          style={{ borderBottom: '1px solid var(--zp-line)', background: 'var(--zp-surface-2)' }}
        >
          {['all', 'paid', 'used', 'pending', 'cancelled', 'expired'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-2.5 py-1 text-[11px] font-mono uppercase tracking-[0.12em] rounded font-semibold transition-colors"
              style={{
                background: filter === f ? 'var(--zp-primary-soft)' : 'transparent',
                color: filter === f ? 'var(--zp-primary)' : 'var(--zp-ink-2)',
              }}
            >
              {f}
              {filter === f && (
                <span className="ml-1.5 font-normal" style={{ color: 'var(--zp-primary)', opacity: 0.6 }}>
                  {bookings.length}
                </span>
              )}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-3 text-[11px] font-mono uppercase tracking-[0.14em]" style={{ color: 'var(--zp-ink-3)' }}>
            <span>Sorted: <span style={{ color: 'var(--zp-ink-2)' }}>newest</span></span>
            <span>·</span>
            <span>Showing <span style={{ color: 'var(--zp-ink-2)' }}>{bookings.length}</span></span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto max-h-[640px]">
          <table className="w-full">
            <thead className="sticky top-0 z-10" style={{ background: 'var(--zp-surface)' }}>
              <tr className="text-[10px] font-mono uppercase tracking-[0.16em]" style={{ color: 'var(--zp-ink-3)' }}>
                <th className="text-left px-5 py-3 font-semibold">Booking</th>
                <th className="text-left px-5 py-3 font-semibold">Customer</th>
                <th className="text-left px-5 py-3 font-semibold">Zone · Spot</th>
                <th className="text-left px-5 py-3 font-semibold">Duration</th>
                <th className="text-right px-5 py-3 font-semibold">Amount</th>
                <th className="text-left px-5 py-3 font-semibold">Status</th>
                <th className="text-left px-5 py-3 font-semibold">MoMo Tx</th>
                <th className="text-right px-5 py-3 font-semibold">Created</th>
                <th className="text-center px-5 py-3 font-semibold w-8"></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <React.Fragment key={b.id}>
                  <tr
                    onClick={() => setExpanded(expanded === b.id ? null : b.id)}
                    className="cursor-pointer transition-colors"
                    style={{
                      background: expanded === b.id ? 'var(--zp-primary-soft)' : 'transparent',
                      borderTop: '1px solid var(--zp-line)',
                    }}
                    onMouseEnter={e => { if (expanded !== b.id) e.currentTarget.style.background = 'var(--zp-surface-2)' }}
                    onMouseLeave={e => { if (expanded !== b.id) e.currentTarget.style.background = 'transparent' }}
                  >
                    <td className="px-5 py-3 font-mono text-[13px] font-semibold" style={{ color: 'var(--zp-ink)' }}>{b.id}</td>
                    <td className="px-5 py-3 font-mono text-[12px]" style={{ color: 'var(--zp-ink-2)' }}>{maskPhone(b.phone)}</td>
                    <td className="px-5 py-3 text-[13px]">
                      <span className="font-mono font-semibold" style={{ color: 'var(--zp-ink)' }}>{b.spot}</span>
                      <span className="ml-2 text-[10px] font-mono" style={{ color: 'var(--zp-ink-3)' }}>Z-{b.zone}</span>
                    </td>
                    <td className="px-5 py-3 text-[13px] font-mono" style={{ color: 'var(--zp-ink-2)' }}>{b.duration}</td>
                    <td className="px-5 py-3 text-right font-mono text-[13px] font-semibold tabular-nums" style={{ color: 'var(--zp-ink)' }}>
                      {b.amount.toLocaleString()} <span className="text-[10px] font-normal" style={{ color: 'var(--zp-ink-3)' }}>RWF</span>
                    </td>
                    <td className="px-5 py-3">
                      <Pill variant={b.status === 'paid' ? 'success' : b.status === 'used' ? 'info' : b.status === 'pending' ? 'warn' : b.status === 'expired' ? 'danger' : 'default'}>
                        {b.status}
                      </Pill>
                    </td>
                    <td className="px-5 py-3 font-mono text-[11px]" style={{ color: 'var(--zp-ink-3)' }}>{b.momoTx || '—'}</td>
                    <td className="px-5 py-3 text-right font-mono text-[11px]" style={{ color: 'var(--zp-ink-3)' }}>
                      {Math.floor((Date.now() - new Date(b.createdAt).getTime()) / 3600000)}h ago
                    </td>
                    <td className="px-5 py-3 text-center" style={{ color: 'var(--zp-ink-3)' }}>
                      {expanded === b.id ? '▴' : '▾'}
                    </td>
                  </tr>
                  {expanded === b.id && (
                    <tr style={{ background: 'var(--zp-surface-2)', borderTop: '1px solid var(--zp-line)' }}>
                      <td colSpan={9} className="px-5 py-5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <Eyebrow>Timeline</Eyebrow>
                            <div className="space-y-2 mt-3">
                              {['Booked', 'Payment initiated', 'MoMo confirmed', 'QR generated', b.status === 'used' ? 'Gate scanned' : null].filter(Boolean).map((step, idx) => (
                                <div key={idx} className="flex items-center gap-2.5 text-[12px]">
                                  <span className="w-2 h-2 rounded-full" style={{ background: 'var(--zp-free)' }}></span>
                                  <span style={{ color: 'var(--zp-ink)' }}>{step}</span>
                                  <span className="font-mono text-[10px] ml-auto" style={{ color: 'var(--zp-ink-3)' }}>
                                    {new Date(new Date(b.createdAt).getTime() + idx * 60000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <Eyebrow>Customer</Eyebrow>
                            <div className="space-y-1 mt-3">
                              <DataRow label="Phone (full)" value={b.phone} mono />
                              <DataRow label="App version" value="v1.2.3 · Android" mono small />
                              <DataRow label="Previous bookings" value="7" mono />
                            </div>
                          </div>
                          <div>
                            <Eyebrow>Actions</Eyebrow>
                            <div className="space-y-1.5 mt-3">
                              <ActionBtn>View QR code →</ActionBtn>
                              <ActionBtn>Refund booking →</ActionBtn>
                              <ActionBtn>Contact via SMS →</ActionBtn>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
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