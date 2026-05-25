import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useCameras } from '../lib/camerasStore'
import { useZones } from '../lib/zonesStore'
import { getOccupancy } from '../lib/api'
import { Panel, MetricCard, Pill, Eyebrow, DataRow } from '../components/ui'
import { Icons } from '../components/Icons'
import EmptyState from '../components/EmptyState'
import { useToast } from '../lib/toast'

export default function CamerasView() {
  const { cameras, addCamera, updateCamera, removeCamera } = useCameras()
  const { activeZones } = useZones()
  const toast = useToast()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [tab, setTab] = useState('slots')

  // Live occupancy — empty unless demo on / backend live
  const { data: spots = [] } = useQuery({ queryKey: ['occupancy'], queryFn: getOccupancy })

  const selectedCam = cameras.find(c => c.id === selectedId) || null

  const online = cameras.filter(c => c.status === 'online').length
  const offline = cameras.filter(c => c.status === 'offline').length
  const warning = cameras.filter(c => c.status === 'warning').length
  const totalSpots = cameras.reduce((s, c) => s + (c.spotsCovered || 0), 0)

  return (
    <div className="space-y-5 fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard label="Total Cameras" value={cameras.length} tone="info" />
        <MetricCard label="Online" value={online} tone={online > 0 ? 'free' : 'busy'} />
        <MetricCard label="Offline" value={offline} tone={offline > 0 ? 'full' : 'free'} />
        <MetricCard label="Spots Covered" value={totalSpots} unit="across all cameras" tone="info" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
        {/* Camera list */}
        <div className="lg:col-span-5">
          <Panel
            title="All Cameras"
            subtitle="Admin-managed · CV pipeline"
            noPadding
            action={
              <button
                onClick={() => { setShowForm(true); setEditingId(null) }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
                style={{ background: 'var(--zp-primary)', color: '#fff' }}
              >
                <Icons.Plus size={13} /> Add camera
              </button>
            }
          >
            {/* Add form */}
            {showForm && (
              <CameraForm
                zones={activeZones}
                onSave={(data) => {
                  const c = addCamera(data)
                  toast.success('Camera added', `${c.id} · ${c.name}`)
                  setShowForm(false)
                }}
                onCancel={() => setShowForm(false)}
              />
            )}

            {/* Empty state */}
            {cameras.length === 0 && !showForm && (
              <div className="p-6">
                <EmptyState
                  variant="empty"
                  icon="Camera"
                  title="No cameras registered"
                  message="Add each physical camera as it is installed at the stadium — with its real IP address and the zone it covers."
                  action={{ label: 'Add camera', onClick: () => setShowForm(true) }}
                />
              </div>
            )}

            {/* Camera rows */}
            <div>
              {cameras.map((c, i) => {
                if (editingId === c.id) {
                  return (
                    <CameraForm
                      key={c.id}
                      zones={activeZones}
                      initial={c}
                      onSave={(data) => {
                        updateCamera(c.id, data)
                        toast.success('Camera updated', c.id)
                        setEditingId(null)
                      }}
                      onCancel={() => setEditingId(null)}
                    />
                  )
                }
                const isSelected = selectedId === c.id
                const iconBg = c.status === 'online' ? 'var(--zp-free-soft)' : c.status === 'warning' ? 'var(--zp-busy-soft)' : 'var(--zp-full-soft)'
                const iconColor = c.status === 'online' ? 'var(--zp-free)' : c.status === 'warning' ? 'var(--zp-busy)' : 'var(--zp-full)'
                return (
                  <div
                    key={c.id}
                    className="px-5 py-3 cursor-pointer transition-colors"
                    style={{
                      background: isSelected ? 'var(--zp-primary-soft)' : 'transparent',
                      borderTop: i > 0 ? '1px solid var(--zp-line)' : 'none',
                    }}
                    onClick={() => { setSelectedId(c.id); setTab('slots') }}
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="relative w-11 h-11 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ background: iconBg, color: iconColor }}>
                        <Icons.Camera size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[14px] font-semibold" style={{ color: 'var(--zp-ink)' }}>{c.name}</span>
                          <Pill variant={c.status === 'online' ? 'success' : c.status === 'warning' ? 'warn' : 'danger'}>{c.status}</Pill>
                        </div>
                        <div className="font-mono text-[10px] mt-0.5" style={{ color: 'var(--zp-ink-3)' }}>
                          {c.id} · Zone {c.zone || '—'} · {c.spotsCovered} slots {c.ipAddress ? `· ${c.ipAddress}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingId(c.id); setShowForm(false) }}
                          className="px-2 py-1 text-[10px] font-mono uppercase tracking-[0.12em] rounded-md font-semibold"
                          style={{ background: 'var(--zp-surface-2)', color: 'var(--zp-ink-2)', border: '1px solid var(--zp-line)' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm(`Remove camera ${c.id} (${c.name})?`)) {
                              removeCamera(c.id)
                              toast.error('Camera removed', c.id)
                              if (selectedId === c.id) setSelectedId(null)
                            }
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded-md"
                          style={{ color: 'var(--zp-full)' }}
                          title="Remove"
                        >
                          <Icons.X size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Panel>
        </div>

        {/* Camera detail */}
        <div className="lg:col-span-7">
          {selectedCam ? (
            <div className="zp-card">
              <div className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-2" style={{ borderBottom: '1px solid var(--zp-line)' }}>
                <div>
                  <Eyebrow>{selectedCam.id}</Eyebrow>
                  <h3 className="text-[15px] font-semibold" style={{ color: 'var(--zp-ink)' }}>{selectedCam.name}</h3>
                </div>
                <div className="flex items-center gap-1">
                  {[{ id: 'slots', label: 'Slots' }, { id: 'hardware', label: 'Hardware' }].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.12em] rounded-md font-semibold"
                      style={{
                        background: tab === t.id ? 'var(--zp-primary)' : 'var(--zp-surface-2)',
                        color: tab === t.id ? '#fff' : 'var(--zp-ink-2)',
                        border: '1px solid ' + (tab === t.id ? 'var(--zp-primary)' : 'var(--zp-line)'),
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-5">
                {tab === 'slots'
                  ? <SlotTable camera={selectedCam} spots={spots.filter(s => s.zone === selectedCam.zone)} />
                  : <HardwarePanel camera={selectedCam} />}
              </div>
            </div>
          ) : (
            <div className="zp-card p-10">
              <div className="text-center">
                <div className="text-[13px] font-semibold" style={{ color: 'var(--zp-ink)' }}>
                  {cameras.length === 0 ? 'No cameras yet' : 'Select a camera'}
                </div>
                <p className="text-[12px] mt-1" style={{ color: 'var(--zp-ink-2)' }}>
                  {cameras.length === 0
                    ? 'Add a camera to begin monitoring its slots.'
                    : 'Click a camera on the left to see the slots it covers.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Add / Edit form ───────────────────────────────────────── */
function CameraForm({ zones, initial, onSave, onCancel }) {
  const [f, setF] = useState({
    name: initial?.name || '',
    zone: initial?.zone || (zones[0]?.id || ''),
    ipAddress: initial?.ipAddress || '',
    edgeDevice: initial?.edgeDevice || '',
    spotsCovered: initial?.spotsCovered ?? 0,
  })
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }))
  const inputStyle = { background: 'var(--zp-surface)', border: '1px solid var(--zp-line)', color: 'var(--zp-ink)' }
  const labelCls = 'font-mono text-[10px] uppercase tracking-[0.14em]'

  return (
    <div className="px-5 py-4" style={{ background: 'var(--zp-primary-soft)', borderBottom: '1px solid var(--zp-line)' }}>
      <Eyebrow>{initial ? `Edit ${initial.id}` : 'New camera'}</Eyebrow>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-3">
        <div className="md:col-span-7">
          <label className={labelCls} style={{ color: 'var(--zp-ink-3)' }}>Camera name</label>
          <input value={f.name} onChange={e => set('name', e.target.value)} placeholder="e.g. North Gate Lot"
            className="w-full mt-1 px-3 py-2 text-[13px] rounded-md outline-none" style={inputStyle} />
        </div>
        <div className="md:col-span-5">
          <label className={labelCls} style={{ color: 'var(--zp-ink-3)' }}>Zone covered</label>
          <select value={f.zone} onChange={e => set('zone', e.target.value)}
            className="w-full mt-1 px-3 py-2 text-[13px] rounded-md outline-none" style={inputStyle}>
            <option value="">— select zone —</option>
            {zones.map(z => <option key={z.id} value={z.id}>{z.id} · {z.name}</option>)}
          </select>
        </div>
        <div className="md:col-span-5">
          <label className={labelCls} style={{ color: 'var(--zp-ink-3)' }}>IP address</label>
          <input value={f.ipAddress} onChange={e => set('ipAddress', e.target.value)} placeholder="e.g. 10.0.1.21"
            className="w-full mt-1 px-3 py-2 text-[13px] font-mono rounded-md outline-none" style={inputStyle} />
        </div>
        <div className="md:col-span-4">
          <label className={labelCls} style={{ color: 'var(--zp-ink-3)' }}>Edge device</label>
          <input value={f.edgeDevice} onChange={e => set('edgeDevice', e.target.value)} placeholder="e.g. EDGE_NORTH"
            className="w-full mt-1 px-3 py-2 text-[13px] font-mono rounded-md outline-none" style={inputStyle} />
        </div>
        <div className="md:col-span-3">
          <label className={labelCls} style={{ color: 'var(--zp-ink-3)' }}>Slots covered</label>
          <input type="number" min="0" value={f.spotsCovered} onChange={e => set('spotsCovered', e.target.value)}
            className="w-full mt-1 px-3 py-2 text-[13px] font-mono rounded-md outline-none" style={inputStyle} />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <button onClick={onCancel}
          className="px-4 py-2 text-[11px] font-mono uppercase tracking-[0.12em] rounded-md font-semibold"
          style={{ background: 'var(--zp-surface)', color: 'var(--zp-ink-2)', border: '1px solid var(--zp-line)' }}>
          Cancel
        </button>
        <button
          onClick={() => {
            if (!f.name.trim()) { alert('Camera name is required'); return }
            onSave(f)
          }}
          className="px-4 py-2 text-[11px] font-mono uppercase tracking-[0.12em] rounded-md font-semibold"
          style={{ background: 'var(--zp-primary)', color: '#fff' }}>
          {initial ? 'Save changes' : 'Add camera'}
        </button>
      </div>
    </div>
  )
}

/* ── Slot table ────────────────────────────────────────────── */
function SlotTable({ camera, spots }) {
  const rows = useMemo(() => {
    if (spots.length > 0) {
      return spots.map(s => ({ id: s.id, status: s.status, plate: s.plate || '—', confidence: s.confidence, lastUpdate: s.lastUpdate }))
    }
    return Array.from({ length: camera.spotsCovered }, (_, i) => ({
      id: `${camera.zone || 'Z'}-${String(i + 1).padStart(2, '0')}`,
      status: 'empty', plate: '—', confidence: null, lastUpdate: null,
    }))
  }, [spots, camera])

  const statusPill = (status) => {
    const map = {
      free: { v: 'success', t: 'free' }, occupied: { v: 'warn', t: 'occupied' },
      reserved: { v: 'info', t: 'reserved' }, offline: { v: 'default', t: 'offline' },
      empty: { v: 'default', t: 'no data' },
    }
    const m = map[status] || map.empty
    return <Pill variant={m.v}>{m.t}</Pill>
  }
  const hasLiveData = spots.length > 0

  return (
    <div>
      <div className="flex items-center gap-4 mb-3 flex-wrap">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] font-semibold" style={{ color: 'var(--zp-ink-3)' }}>
          {rows.length} slots in this camera's view
        </span>
      </div>
      {!hasLiveData && (
        <div className="mb-3 px-3 py-2 rounded-md font-mono text-[11px]" style={{ background: 'var(--zp-busy-soft)', color: 'var(--zp-busy)' }}>
          No live data — slot status fills in real time once the backend and this camera are connected.
        </div>
      )}
      {camera.spotsCovered === 0 && !hasLiveData ? (
        <div className="text-center py-6 text-[12px]" style={{ color: 'var(--zp-ink-3)' }}>
          No slots configured for this camera. Edit it to set how many slots it covers.
        </div>
      ) : (
        <div className="overflow-auto max-h-[420px] rounded-md" style={{ border: '1px solid var(--zp-line)' }}>
          <table className="w-full">
            <thead className="sticky top-0 z-10" style={{ background: 'var(--zp-surface-2)' }}>
              <tr className="text-[10px] font-mono uppercase tracking-[0.14em]" style={{ color: 'var(--zp-ink-3)' }}>
                <th className="text-left px-4 py-2.5 font-semibold">Slot</th>
                <th className="text-left px-4 py-2.5 font-semibold">Status</th>
                <th className="text-left px-4 py-2.5 font-semibold">Plate (CV)</th>
                <th className="text-right px-4 py-2.5 font-semibold">Confidence</th>
                <th className="text-right px-4 py-2.5 font-semibold">Last update</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} style={{ borderTop: i > 0 ? '1px solid var(--zp-line)' : 'none' }}>
                  <td className="px-4 py-2.5 font-mono text-[13px] font-semibold" style={{ color: 'var(--zp-ink)' }}>{r.id}</td>
                  <td className="px-4 py-2.5">{statusPill(r.status)}</td>
                  <td className="px-4 py-2.5 font-mono text-[12px]" style={{ color: 'var(--zp-ink-2)' }}>{r.plate}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[12px]" style={{ color: 'var(--zp-ink-2)' }}>
                    {r.confidence != null ? `${(r.confidence * 100).toFixed(0)}%` : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-[11px]" style={{ color: 'var(--zp-ink-3)' }}>
                    {r.lastUpdate ? `${Math.floor((Date.now() - r.lastUpdate) / 1000)}s ago` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ── Hardware panel ────────────────────────────────────────── */
function HardwarePanel({ camera }) {
  return (
    <div className="space-y-4">
      <div className="zp-map-surface relative aspect-video rounded-md overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          {camera.status === 'offline' ? (
            <div className="text-center">
              <Icons.Camera size={36} style={{ color: 'rgba(255,255,255,0.25)' }} />
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] mt-2 font-semibold" style={{ color: 'var(--zp-full)' }}>
                Offline — no signal
              </div>
            </div>
          ) : (
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] font-semibold flex items-center gap-2" style={{ color: 'var(--zp-free)' }}>
              <span className="w-1.5 h-1.5 rounded-full blink" style={{ background: 'var(--zp-free)' }}></span>
              Live preview
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
        <DataRow label="Camera ID" value={camera.id} mono small />
        <DataRow label="Status" value={camera.status} small />
        <DataRow label="Zone covered" value={camera.zone || '—'} small />
        <DataRow label="IP address" value={camera.ipAddress || '—'} mono small />
        <DataRow label="Edge device" value={camera.edgeDevice || '—'} mono small />
        <DataRow label="Slots covered" value={camera.spotsCovered} mono small />
      </div>
      <div className="px-3 py-2 rounded-md font-mono text-[11px]" style={{ background: 'var(--zp-surface-2)', color: 'var(--zp-ink-3)' }}>
        Live status, CV accuracy and latency appear here once the backend reports this camera's health.
      </div>
    </div>
  )
}