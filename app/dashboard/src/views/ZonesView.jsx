import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useZones } from '../lib/zonesStore'
import { getOccupancy } from '../lib/api'
import { Panel, MetricCard, Pill, Eyebrow } from '../components/ui'
import { Icons } from '../components/Icons'
import { useToast } from '../lib/toast'

export default function ZonesView() {
  const { zones, activeZones, addZone, updateZone, deactivateZone, reactivateZone, deleteZone, resetZones, loading, refresh } = useZones()
  const toast = useToast()

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedZone, setSelectedZone] = useState(null)

  // Live occupancy — empty unless demo mode on / backend live
  const { data: spots = [] } = useQuery({ queryKey: ['occupancy'], queryFn: getOccupancy })

  const totalCapacity = activeZones.reduce((s, z) => s + z.capacity, 0)
  const inactiveCount = zones.filter(z => z.status === 'inactive').length

  // Count occupied spots per zone from live data (0 when no backend)
  const occupancyByZone = useMemo(() => {
    const map = {}
    spots.forEach(s => {
      if (!map[s.zone]) map[s.zone] = { occupied: 0, total: 0 }
      map[s.zone].total++
      if (s.status === 'occupied' || s.status === 'reserved') map[s.zone].occupied++
    })
    return map
  }, [spots])

  return (
    <div className="space-y-5 fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard label="Active Zones" value={activeZones.length} tone="info" />
        <MetricCard label="Total Slots" value={totalCapacity} unit="across active zones" tone="free" />
        <MetricCard label="Unavailable Zones" value={inactiveCount} tone={inactiveCount > 0 ? 'busy' : 'free'} />
        <MetricCard label="Currently Occupied" value={spots.filter(s => s.status === 'occupied').length} unit="live" tone="busy" />
      </div>

      <Panel
        title="Parking Zones"
        subtitle={loading ? 'Loading from backend…' : 'Admin-managed · Configure venue layout'}
        noPadding
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                try { await refresh(); toast.info('Refreshed', 'Zones synced from server') }
                catch (err) { toast.error('Could not refresh', err.message) }
              }}
              className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
              style={{ background: 'var(--zp-surface-2)', color: 'var(--zp-ink-2)', border: '1px solid var(--zp-line)' }}
            >
              Refresh
            </button>
            <button
              onClick={() => { setShowAddForm(true); setEditingId(null) }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
              style={{ background: 'var(--zp-primary)', color: '#fff' }}
            >
              <Icons.Plus size={13} /> Add zone
            </button>
          </div>
        }
      >
        {/* Add zone form */}
        {showAddForm && (
          <ZoneForm
            onSave={async (data) => {
              try {
                const z = await addZone(data)
                toast.success('Zone added', z ? `${z.name} · ${z.capacity} slots` : 'Saved')
                setShowAddForm(false)
              } catch (err) {
                toast.error('Could not add zone', err.response?.data?.message || err.message)
              }
            }}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {/* Zone list */}
        <div>
          {zones.length === 0 && (
            <div className="px-5 py-10 text-center text-[13px]" style={{ color: 'var(--zp-ink-3)' }}>
              {loading ? 'Loading zones from server…' : 'No zones configured. Click "Add zone" to begin.'}
            </div>
          )}

          {zones.map((z, i) => {
            const isEditing = editingId === z.id
            const isInactive = z.status === 'inactive'
            const occ = occupancyByZone[z.id] || { occupied: 0, total: 0 }

            if (isEditing) {
              return (
                <ZoneForm
                  key={z.id}
                  initial={z}
                  onSave={async (data) => {
                    try {
                      await updateZone(z.id, data)
                      toast.success('Zone updated', data.name)
                      setEditingId(null)
                    } catch (err) {
                      toast.error('Could not update zone', err.response?.data?.message || err.message)
                    }
                  }}
                  onCancel={() => setEditingId(null)}
                />
              )
            }

            return (
              <div
                key={z.id}
                className="px-5 py-4 flex items-center gap-4 flex-wrap"
                style={{
                  borderTop: i > 0 ? '1px solid var(--zp-line)' : 'none',
                  opacity: isInactive ? 0.6 : 1,
                }}
              >
                {/* Zone badge */}
                <div
                  className="w-12 h-12 rounded-md flex items-center justify-center font-mono font-bold text-lg flex-shrink-0"
                  style={{ background: z.color, color: '#fff' }}
                >
                  {z.id}
                </div>

                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[15px] font-semibold" style={{ color: 'var(--zp-ink)' }}>{z.name}</span>
                    {isInactive
                      ? <Pill variant="default">unavailable</Pill>
                      : <Pill variant="success">active</Pill>}
                  </div>
                  <div className="font-mono text-[11px] mt-0.5" style={{ color: 'var(--zp-ink-3)' }}>
                    {z.capacity} slots · ID {z.id}
                  </div>
                </div>

                {/* Live occupancy */}
                <div className="hidden md:block text-right">
                  <div className="font-mono text-[9px] uppercase tracking-[0.14em] font-semibold" style={{ color: 'var(--zp-ink-3)' }}>Occupied</div>
                  <div className="font-mono text-[14px] font-semibold mt-0.5" style={{ color: 'var(--zp-ink)' }}>
                    {occ.occupied} / {occ.total || z.capacity}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedZone(selectedZone === z.id ? null : z.id)}
                    className="px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-[0.12em] rounded-md font-semibold"
                    style={{ background: 'var(--zp-surface-2)', color: 'var(--zp-ink-2)', border: '1px solid var(--zp-line)' }}
                  >
                    {selectedZone === z.id ? 'Hide slots' : 'View slots'}
                  </button>
                  <button
                    onClick={() => { setEditingId(z.id); setShowAddForm(false) }}
                    className="px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-[0.12em] rounded-md font-semibold"
                    style={{ background: 'var(--zp-surface-2)', color: 'var(--zp-ink-2)', border: '1px solid var(--zp-line)' }}
                  >
                    Edit
                  </button>
                  {isInactive ? (
                    <button
                      onClick={async () => {
                        try { await reactivateZone(z.id); toast.success('Zone restored', z.name) }
                        catch (err) { toast.error('Could not restore zone', err.message) }
                      }}
                      className="px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-[0.12em] rounded-md font-semibold"
                      style={{ background: 'var(--zp-free-soft)', color: 'var(--zp-free)', border: '1px solid color-mix(in srgb, var(--zp-free) 30%, transparent)' }}
                    >
                      Restore
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        try { await deactivateZone(z.id); toast.warn('Zone marked unavailable', z.name) }
                        catch (err) { toast.error('Could not update zone', err.message) }
                      }}
                      className="px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-[0.12em] rounded-md font-semibold"
                      style={{ background: 'var(--zp-busy-soft)', color: 'var(--zp-busy)', border: '1px solid color-mix(in srgb, var(--zp-busy) 30%, transparent)' }}
                    >
                      Mark unavailable
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      if (!confirm(`Permanently delete ${z.name}? Use "Mark unavailable" instead if it might return.`)) return
                      try {
                        await deleteZone(z.id)
                        toast.error('Zone deleted', z.name)
                        if (selectedZone === z.id) setSelectedZone(null)
                      } catch (err) {
                        toast.error('Could not delete zone', err.message)
                      }
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-md"
                    style={{ color: 'var(--zp-full)' }}
                    title="Delete permanently"
                  >
                    <Icons.X size={15} />
                  </button>
                </div>

                {/* Slot grid (expandable) */}
                {selectedZone === z.id && (
                  <div className="w-full mt-3 pt-3" style={{ borderTop: '1px solid var(--zp-line)' }}>
                    <SlotGrid zone={z} spots={spots.filter(s => s.zone === z.id)} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Panel>

      {/* Legend */}
      <div className="zp-card px-5 py-3 flex items-center gap-5 flex-wrap">
        <span className="zp-eyebrow">Slot status</span>
        <LegendDot color="var(--zp-free)" label="Free" />
        <LegendDot color="var(--zp-busy)" label="Booked / Occupied" />
        <LegendDot color="var(--zp-info)" label="Reserved · VIP" />
        <LegendDot color="var(--zp-line)" label="Empty / no data" />
      </div>
    </div>
  )
}

/* ── Add/Edit form ─────────────────────────────────────────── */
function ZoneForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '')
  const [capacity, setCapacity] = useState(initial?.capacity || 20)
  const [color, setColor] = useState(initial?.color || '#163A6E')
  const [saving, setSaving] = useState(false)

  const COLORS = ['#163A6E', '#E4B228', '#2563A8', '#1F8A5B', '#7A5CC4', '#C44A3E', '#E8941A']

  const handleSave = async () => {
    setSaving(true)
    try { await onSave({ name, capacity, color }) }
    finally { setSaving(false) }
  }

  return (
    <div className="px-5 py-4" style={{ background: 'var(--zp-primary-soft)', borderBottom: '1px solid var(--zp-line)' }}>
      <Eyebrow>{initial ? `Edit ${initial.id}` : 'New zone'}</Eyebrow>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-3 items-end">
        <div className="md:col-span-5">
          <label className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: 'var(--zp-ink-3)' }}>Zone name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. North Gate Lot"
            className="w-full mt-1 px-3 py-2 text-[13px] rounded-md outline-none"
            style={{ background: 'var(--zp-surface)', border: '1px solid var(--zp-line)', color: 'var(--zp-ink)' }}
          />
        </div>
        <div className="md:col-span-2">
          <label className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: 'var(--zp-ink-3)' }}>Slots</label>
          <input
            type="number"
            min="1"
            value={capacity}
            onChange={e => setCapacity(e.target.value)}
            className="w-full mt-1 px-3 py-2 text-[13px] font-mono rounded-md outline-none"
            style={{ background: 'var(--zp-surface)', border: '1px solid var(--zp-line)', color: 'var(--zp-ink)' }}
          />
        </div>
        <div className="md:col-span-3">
          <label className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: 'var(--zp-ink-3)' }}>Colour</label>
          <div className="flex gap-1.5 mt-1.5">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-7 h-7 rounded-md transition-transform"
                style={{
                  background: c,
                  border: color === c ? '2px solid var(--zp-ink)' : '2px solid transparent',
                  transform: color === c ? 'scale(1.1)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </div>
        <div className="md:col-span-2 flex gap-2">
          <button
            onClick={onCancel}
            disabled={saving}
            className="flex-1 py-2 text-[11px] font-mono uppercase tracking-[0.12em] rounded-md font-semibold"
            style={{ background: 'var(--zp-surface)', color: 'var(--zp-ink-2)', border: '1px solid var(--zp-line)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 text-[11px] font-mono uppercase tracking-[0.12em] rounded-md font-semibold"
            style={{ background: 'var(--zp-primary)', color: '#fff', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Slot grid ─────────────────────────────────────────────── */
function SlotGrid({ zone, spots }) {
  const slots = useMemo(() => {
    if (spots.length > 0) {
      return spots.map(s => ({ id: s.id, status: s.status }))
    }
    return Array.from({ length: zone.capacity }, (_, i) => ({
      id: `${zone.id}-${String(i + 1).padStart(2, '0')}`,
      status: 'empty',
    }))
  }, [spots, zone])

  const colorFor = (status) => ({
    free:     'var(--zp-free)',
    occupied: 'var(--zp-busy)',
    booked:   'var(--zp-busy)',
    reserved: 'var(--zp-info)',
    empty:    'var(--zp-line)',
  }[status] || 'var(--zp-line)')

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] font-semibold" style={{ color: 'var(--zp-ink-3)' }}>
          {zone.name} · {slots.length} slots
        </span>
        {spots.length === 0 && (
          <span className="font-mono text-[10px]" style={{ color: 'var(--zp-ink-3)' }}>
            No live data — slots fill when backend is connected
          </span>
        )}
      </div>
      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(36px, 1fr))' }}>
        {slots.map(s => (
          <div
            key={s.id}
            title={`${s.id} · ${s.status}`}
            className="aspect-square rounded flex items-center justify-center font-mono font-semibold"
            style={{
              background: s.status === 'empty' ? 'var(--zp-surface-2)' : colorFor(s.status),
              color: s.status === 'empty' ? 'var(--zp-ink-3)' : '#fff',
              border: '1px solid ' + (s.status === 'empty' ? 'var(--zp-line)' : 'transparent'),
              fontSize: 9,
            }}
          >
            {s.id.split('-')[1] || ''}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── small legend dot ──────────────────────────────────────── */
function LegendDot({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-sm" style={{ background: color }}></div>
      <span className="font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color: 'var(--zp-ink-2)' }}>{label}</span>
    </div>
  )
}