import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getBookings, exportBookingsCSV, isOffline } from '../lib/api'
import { Panel, MetricCard, Pill, DataRow, Eyebrow } from '../components/ui'
import { useToast } from '../lib/toast'
import { Icons } from '../components/Icons'

// Mask phone "+250788..." → "+250 7XX XXX 193" — safe with missing input.
function maskPhoneSafe(phone) {
  if (!phone || typeof phone !== 'string') return '—'
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 4) return phone
  const last3 = digits.slice(-3)
  return phone.slice(0, phone.length - 6).replace(/\d/g, 'X') + ' XXX ' + last3
}

// Map Bruno's booking shape into ours.
function normalizeBooking(b) {
  if (!b) return null
  const phone = b.user?.phone ?? b.phone ?? b.user_phone ?? ''
  const userName = b.user?.full_name ?? b.user?.name ?? ''
  const status = (b.status || 'pending').toString().toLowerCase()
  return {
    id: b.ref || b.id,
    uuid: b.id,
    phone,
    userName,
    spot: b.spot_label || b.slot?.label || b.slot_id || '—',
    zone: b.zone_id || b.slot?.zone_id || '—',
    amount: b.amount_rwf ?? b.amount ?? 0,
    status,
    momoTx: b.payment?.momo_tx_id ?? b.momo_tx_id ?? null,
    createdAt: b.created_at || b.createdAt || null,
    plate: b.license_plate || b.vehicle_plate || '',
    eventTitle: b.event?.title || b.event_title || '',
    raw: b,
  }
}

export default function BookingsView() {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)
  const toast = useToast()

  // Single fetch — all bookings. Filter/search happens client-side.
  const { data: rawBookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => getBookings(),
  })

  const allBookings = useMemo(
    () => rawBookings.map(normalizeBooking).filter(Boolean),
    [rawBookings]
  )

  // Client-side filter + search.
  const visibleBookings = useMemo(() => {
    let list = allBookings
    if (filter !== 'all') {
      list = list.filter(b => b.status === filter)
    }
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(b =>
        (b.id || '').toLowerCase().includes(q) ||
        (b.phone || '').toLowerCase().includes(q) ||
        (b.plate || '').toLowerCase().includes(q) ||
        (b.userName || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [allBookings, filter, search])

  const offline = isOffline(rawBookings)

  // Status counts for the filter chips.
  const counts = useMemo(() => {
    const c = { all: allBookings.length }
    allBookings.forEach(b => { c[b.status] = (c[b.status] || 0) + 1 })
    return c
  }, [allBookings])

  // KPIs.
  const kpis = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const isToday = (b) => (b.createdAt || '').slice(0, 10) === today
    const todays = allBookings.filter(isToday)
    const pending = allBookings.filter(b => b.status === 'pending')
    const active = allBookings.filter(b => b.status === 'paid' || b.status === 'active')
    const todayRevenue = todays
      .filter(b => ['paid', 'used', 'active'].includes(b.status))
      .reduce((sum, b) => sum + (b.amount || 0), 0)
    return {
      today: todays.length,
      pending: pending.length,
      active: active.length,
      revenue: todayRevenue,
    }
  }, [allBookings])

  const handleExport = async () => {
    try {
      const url = await exportBookingsCSV()
      const a = document.createElement('a')
      a.href = url
      a.download = `zweho-bookings-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      toast.success('Export complete', `${visibleBookings.length} bookings downloaded`)
    } catch (err) {
      toast.error('Export failed', err.message || 'Try again')
    }
  }

  return (
    <div className="space-y-5 fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard label="Today's Bookings" value={kpis.today} tone="info" />
        <MetricCard label="Pending Payment" value={kpis.pending} unit="awaiting MoMo" tone={kpis.pending > 0 ? 'busy' : 'free'} />
        <MetricCard label="Active Now" value={kpis.active} unit="in-park" tone="info" />
        <MetricCard label="Today's Revenue" value={kpis.revenue.toLocaleString()} unit="RWF" tone="free" />
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
                placeholder="Search ref, phone, plate, name…"
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
        {/* Filter chips — counts always visible */}
        <div
          className="flex items-center gap-1 px-5 py-3 flex-wrap"
          style={{ borderBottom: '1px solid var(--zp-line)', background: 'var(--zp-surface-2)' }}
        >
          {['all', 'pending', 'paid', 'active', 'used', 'cancelled', 'refunded', 'no_show'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-2.5 py-1 text-[11px] font-mono uppercase tracking-[0.12em] rounded font-semibold transition-colors"
              style={{
                background: filter === f ? 'var(--zp-primary-soft)' : 'transparent',
                color: filter === f ? 'var(--zp-primary)' : 'var(--zp-ink-2)',
              }}
            >
              {f.replace('_', ' ')}
              <span className="ml-1.5 font-normal" style={{ opacity: 0.6 }}>
                {counts[f] || 0}
              </span>
            </button>
          ))}
          <div className="ml-auto flex items-center gap-3 text-[11px] font-mono uppercase tracking-[0.14em]" style={{ color: 'var(--zp-ink-3)' }}>
            <span>Showing <span style={{ color: 'var(--zp-ink-2)' }}>{visibleBookings.length}</span></span>
          </div>
        </div>

        <div className="overflow-auto max-h-[640px]">
          <table className="w-full">
            <thead className="sticky top-0 z-10" style={{ background: 'var(--zp-surface)' }}>
              <tr className="text-[10px] font-mono uppercase tracking-[0.16em]" style={{ color: 'var(--zp-ink-3)' }}>
                <th className="text-left px-5 py-3 font-semibold">Booking</th>
                <th className="text-left px-5 py-3 font-semibold">Customer</th>
                <th className="text-left px-5 py-3 font-semibold">Zone · Spot</th>
                <th className="text-left px-5 py-3 font-semibold">Plate</th>
                <th className="text-right px-5 py-3 font-semibold">Amount</th>
                <th className="text-left px-5 py-3 font-semibold">Status</th>
                <th className="text-left px-5 py-3 font-semibold">MoMo Tx</th>
                <th className="text-right px-5 py-3 font-semibold">Created</th>
                <th className="text-center px-5 py-3 font-semibold w-8"></th>
              </tr>
            </thead>
            <tbody>
              {visibleBookings.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center">
                    <div className="text-[13px] font-semibold" style={{ color: 'var(--zp-ink)' }}>
                      {offline ? 'Could not load bookings' : 'No bookings match this filter'}
                    </div>
                    <p className="text-[12px] mt-1 max-w-md mx-auto" style={{ color: 'var(--zp-ink-2)' }}>
                      {offline
                        ? 'Backend unreachable. Bookings made by visitors will appear here once the backend is connected.'
                        : 'Try a different filter or clear your search.'}
                    </p>
                  </td>
                </tr>
              )}
              {visibleBookings.map(b => (
                <React.Fragment key={b.uuid || b.id}>
                  <tr
                    onClick={() => setExpanded(expanded === b.uuid ? null : b.uuid)}
                    className="cursor-pointer transition-colors"
                    style={{
                      background: expanded === b.uuid ? 'var(--zp-primary-soft)' : 'transparent',
                      borderTop: '1px solid var(--zp-line)',
                    }}
                    onMouseEnter={e => { if (expanded !== b.uuid) e.currentTarget.style.background = 'var(--zp-surface-2)' }}
                    onMouseLeave={e => { if (expanded !== b.uuid) e.currentTarget.style.background = 'transparent' }}
                  >
                    <td className="px-5 py-3 font-mono text-[13px] font-semibold" style={{ color: 'var(--zp-ink)' }}>{b.id}</td>
                    <td className="px-5 py-3 text-[12px]" style={{ color: 'var(--zp-ink-2)' }}>
                      <div className="font-mono">{maskPhoneSafe(b.phone)}</div>
                      {b.userName && <div className="text-[10px] mt-0.5" style={{ color: 'var(--zp-ink-3)' }}>{b.userName}</div>}
                    </td>
                    <td className="px-5 py-3 text-[13px]">
                      <span className="font-mono font-semibold" style={{ color: 'var(--zp-ink)' }}>{b.spot}</span>
                      <span className="ml-2 text-[10px] font-mono" style={{ color: 'var(--zp-ink-3)' }}>Z-{b.zone}</span>
                    </td>
                    <td className="px-5 py-3 font-mono text-[12px]" style={{ color: 'var(--zp-ink-2)' }}>{b.plate || '—'}</td>
                    <td className="px-5 py-3 text-right font-mono text-[13px] font-semibold tabular-nums" style={{ color: 'var(--zp-ink)' }}>
                      {(b.amount || 0).toLocaleString()} <span className="text-[10px] font-normal" style={{ color: 'var(--zp-ink-3)' }}>RWF</span>
                    </td>
                    <td className="px-5 py-3">
                      <Pill variant={statusVariant(b.status)}>{b.status.replace('_', ' ')}</Pill>
                    </td>
                    <td className="px-5 py-3 font-mono text-[11px]" style={{ color: 'var(--zp-ink-3)' }}>{b.momoTx || '—'}</td>
                    <td className="px-5 py-3 text-right font-mono text-[11px]" style={{ color: 'var(--zp-ink-3)' }}>
                      {timeAgo(b.createdAt)}
                    </td>
                    <td className="px-5 py-3 text-center" style={{ color: 'var(--zp-ink-3)' }}>
                      {expanded === b.uuid ? '▴' : '▾'}
                    </td>
                  </tr>
                  {expanded === b.uuid && (
                    <tr style={{ background: 'var(--zp-surface-2)', borderTop: '1px solid var(--zp-line)' }}>
                      <td colSpan={9} className="px-5 py-5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <Eyebrow>Booking</Eyebrow>
                            <div className="space-y-1 mt-3">
                              <DataRow label="Ref" value={b.id} mono />
                              <DataRow label="UUID" value={b.uuid || '—'} mono small />
                              <DataRow label="Event" value={b.eventTitle || '—'} small />
                              <DataRow label="Created" value={b.createdAt ? new Date(b.createdAt).toLocaleString() : '—'} mono small />
                            </div>
                          </div>
                          <div>
                            <Eyebrow>Customer</Eyebrow>
                            <div className="space-y-1 mt-3">
                              <DataRow label="Name" value={b.userName || '—'} />
                              <DataRow label="Phone" value={b.phone || '—'} mono />
                              <DataRow label="Plate" value={b.plate || '—'} mono />
                            </div>
                          </div>
                          <div>
                            <Eyebrow>Payment</Eyebrow>
                            <div className="space-y-1 mt-3">
                              <DataRow label="Amount" value={`${(b.amount || 0).toLocaleString()} RWF`} mono />
                              <DataRow label="MoMo Tx" value={b.momoTx || '—'} mono small />
                              <DataRow label="Status" value={b.status} />
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

function statusVariant(s) {
  return {
    paid: 'success',
    used: 'info',
    active: 'success',
    pending: 'warn',
    cancelled: 'default',
    refunded: 'default',
    expired: 'danger',
    no_show: 'danger',
  }[s] || 'default'
}

function timeAgo(iso) {
  if (!iso) return '—'
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const h = Math.floor(diff / 3600000)
    if (h < 1) {
      const m = Math.floor(diff / 60000)
      return `${m}m ago`
    }
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  } catch { return '—' }
}