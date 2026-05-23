import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getOccupancy } from '../lib/api'
import { Panel, MetricCard, Pill, Eyebrow, DataRow } from '../components/ui'
import { Icons } from '../components/Icons'

const CAMERAS = [
  {
    id: 'CAM_NORTH_01', name: 'North Gate · Zone A', zone: 'A', model: 'Hikvision DS-2CD2T46',
    status: 'online', resolution: '4MP @ 30fps', latency_ms: 142, uptime_pct: 99.8,
    cv_accuracy: 96.8, last_inference_ms: 84, fps_actual: 28.4,
    ip: '10.0.1.21', edge_device: 'EDGE_NORTH', power: 'PoE 802.3at', spots_covered: 60,
    issues: [],
  },
  {
    id: 'CAM_EAST_02', name: 'East Stand · Zone B', zone: 'B', model: 'Hikvision DS-2CD2T46',
    status: 'online', resolution: '4MP @ 30fps', latency_ms: 138, uptime_pct: 99.4,
    cv_accuracy: 95.2, last_inference_ms: 91, fps_actual: 27.1,
    ip: '10.0.1.22', edge_device: 'EDGE_EAST', power: 'PoE 802.3at', spots_covered: 48,
    issues: [],
  },
  {
    id: 'CAM_VIP_03', name: 'VIP Lot · Zone C', zone: 'C', model: 'Hikvision DS-2CD2T46',
    status: 'warning', resolution: '4MP @ 30fps', latency_ms: 218, uptime_pct: 97.1,
    cv_accuracy: 92.4, last_inference_ms: 142, fps_actual: 22.8,
    ip: '10.0.1.23', edge_device: 'EDGE_NORTH', power: 'PoE 802.3at', spots_covered: 24,
    issues: ['Lower CV confidence on rainy days', 'Reflection at 17:00–18:00'],
  },
  {
    id: 'CAM_SOUTH_04', name: 'South Gate · Zone D', zone: 'D', model: 'Hikvision DS-2CD2T46',
    status: 'online', resolution: '4MP @ 30fps', latency_ms: 156, uptime_pct: 99.6,
    cv_accuracy: 94.1, last_inference_ms: 98, fps_actual: 26.8,
    ip: '10.0.1.24', edge_device: 'EDGE_SOUTH', power: 'PoE 802.3at', spots_covered: 72,
    issues: [],
  },
  {
    id: 'CAM_PRESS_05', name: 'Press / Buses · Zone E', zone: 'E', model: 'Hikvision DS-2CD2T46',
    status: 'offline', resolution: '4MP @ 30fps', latency_ms: null, uptime_pct: 82.4,
    cv_accuracy: null, last_inference_ms: null, fps_actual: null,
    ip: '10.0.1.25', edge_device: 'EDGE_SOUTH', power: 'PoE 802.3at', spots_covered: 18,
    issues: ['No heartbeat for 12 minutes', 'PoE switch port may be down', 'Last seen 14:11 CAT'],
  },
]

export default function CamerasView() {
  const [selectedCam, setSelectedCam] = useState(CAMERAS[0])
  const [tab, setTab] = useState('slots') // 'slots' | 'hardware'

  // Live occupancy — empty unless demo mode on / backend live
  const { data: spots = [] } = useQuery({ queryKey: ['occupancy'], queryFn: getOccupancy })

  const online = CAMERAS.filter(c => c.status === 'online').length
  const warning = CAMERAS.filter(c => c.status === 'warning').length
  const offline = CAMERAS.filter(c => c.status === 'offline').length
  const avgAccuracy = (
    CAMERAS.filter(c => c.cv_accuracy != null).reduce((s, c) => s + c.cv_accuracy, 0) /
    CAMERAS.filter(c => c.cv_accuracy != null).length
  ).toFixed(1)
  const totalSpots = CAMERAS.reduce((s, c) => s + c.spots_covered, 0)

  return (
    <div className="space-y-5 fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard label="Cameras Online" value={`${online}/${CAMERAS.length}`} tone={offline > 0 ? 'full' : 'free'} delta={offline > 0 ? `${offline} offline` : 'all healthy'} />
        <MetricCard label="Avg CV Accuracy" value={avgAccuracy} unit="%" tone="free" delta="+0.4pp" />
        <MetricCard label="Spots Covered" value={totalSpots} unit={`across ${CAMERAS.length} cams`} tone="info" />
        <MetricCard label="Warnings" value={warning} unit="need attention" tone={warning > 0 ? 'busy' : 'free'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
        {/* Camera list */}
        <div className="lg:col-span-5">
          <Panel
            title="All Cameras"
            subtitle="Live status · CV pipeline"
            action={
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
                style={{ background: 'var(--zp-primary)', color: '#fff' }}
              >
                <Icons.Plus size={13} /> Add camera
              </button>
            }
            noPadding
          >
            <div>
              {CAMERAS.map((c, i) => {
                const isSelected = selectedCam?.id === c.id
                const iconBg = c.status === 'online' ? 'var(--zp-free-soft)' : c.status === 'warning' ? 'var(--zp-busy-soft)' : 'var(--zp-full-soft)'
                const iconColor = c.status === 'online' ? 'var(--zp-free)' : c.status === 'warning' ? 'var(--zp-busy)' : 'var(--zp-full)'
                return (
                  <div
                    key={c.id}
                    onClick={() => { setSelectedCam(c); setTab('slots') }}
                    className="px-5 py-3 cursor-pointer transition-colors"
                    style={{
                      background: isSelected ? 'var(--zp-primary-soft)' : 'transparent',
                      borderTop: i > 0 ? '1px solid var(--zp-line)' : 'none',
                    }}
                    onMouseEnter={el => { if (!isSelected) el.currentTarget.style.background = 'var(--zp-surface-2)' }}
                    onMouseLeave={el => { if (!isSelected) el.currentTarget.style.background = 'transparent' }}
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="relative w-12 h-12 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ background: iconBg, color: iconColor }}>
                        <Icons.Camera size={20} />
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                          style={{ background: iconColor, borderColor: 'var(--zp-surface)' }}></span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[14px] font-semibold" style={{ color: 'var(--zp-ink)' }}>{c.name}</span>
                          <Pill variant={c.status === 'online' ? 'success' : c.status === 'warning' ? 'warn' : 'danger'}>{c.status}</Pill>
                        </div>
                        <div className="font-mono text-[10px] mt-0.5" style={{ color: 'var(--zp-ink-3)' }}>
                          {c.id} · {c.spots_covered} slots · {c.ip}
                        </div>
                      </div>
                      <Icons.ChevronRight size={16} style={{ color: 'var(--zp-ink-3)' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Panel>
        </div>

        {/* Camera detail with tabs */}
        <div className="lg:col-span-7 space-y-4">
          {selectedCam && (
            <>
              {/* Header + tab toggle */}
              <div className="zp-card">
                <div className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-2" style={{ borderBottom: '1px solid var(--zp-line)' }}>
                  <div>
                    <Eyebrow>{selectedCam.id}</Eyebrow>
                    <h3 className="text-[15px] font-semibold" style={{ color: 'var(--zp-ink)' }}>{selectedCam.name}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    {[
                      { id: 'slots', label: 'Slots' },
                      { id: 'hardware', label: 'Hardware' },
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.12em] rounded-md font-semibold transition-colors"
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

              {tab === 'slots' && (
                <div className="flex gap-2">
                  <button
                    className="flex-1 px-3 py-2.5 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
                    style={{ background: 'var(--zp-surface-2)', color: 'var(--zp-ink-2)', border: '1px solid var(--zp-line)' }}
                  >
                    Refresh slots
                  </button>
                  <button
                    className="flex-1 px-3 py-2.5 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
                    style={{ background: 'var(--zp-primary)', color: '#fff' }}
                  >
                    Open live feed →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Slot table — the team's requested view ────────────────── */
function SlotTable({ camera, spots }) {
  // Build rows: live spots if available, else empty placeholders.
  const rows = useMemo(() => {
    if (spots.length > 0) {
      return spots.map(s => ({
        id: s.id,
        status: s.status,
        plate: s.plate || '—',
        confidence: s.confidence,
        lastUpdate: s.lastUpdate,
      }))
    }
    return Array.from({ length: camera.spots_covered }, (_, i) => ({
      id: `${camera.zone}-${String(i + 1).padStart(2, '0')}`,
      status: 'empty',
      plate: '—',
      confidence: null,
      lastUpdate: null,
    }))
  }, [spots, camera])

  const counts = useMemo(() => ({
    free: rows.filter(r => r.status === 'free').length,
    occupied: rows.filter(r => r.status === 'occupied').length,
    reserved: rows.filter(r => r.status === 'reserved').length,
  }), [rows])

  const statusPill = (status) => {
    const map = {
      free:     { v: 'success', t: 'free' },
      occupied: { v: 'warn',    t: 'occupied' },
      reserved: { v: 'info',    t: 'reserved' },
      offline:  { v: 'default', t: 'offline' },
      empty:    { v: 'default', t: 'no data' },
    }
    const m = map[status] || map.empty
    return <Pill variant={m.v}>{m.t}</Pill>
  }

  const hasLiveData = spots.length > 0

  return (
    <div>
      {/* Summary row */}
      <div className="flex items-center gap-4 mb-3 flex-wrap">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] font-semibold" style={{ color: 'var(--zp-ink-3)' }}>
          {rows.length} slots in this camera's view
        </span>
        {hasLiveData && (
          <div className="flex items-center gap-3 ml-auto font-mono text-[11px]">
            <span style={{ color: 'var(--zp-free)' }}>● {counts.free} free</span>
            <span style={{ color: 'var(--zp-busy)' }}>● {counts.occupied} occupied</span>
            <span style={{ color: 'var(--zp-info)' }}>● {counts.reserved} reserved</span>
          </div>
        )}
      </div>

      {!hasLiveData && (
        <div className="mb-3 px-3 py-2 rounded-md font-mono text-[11px]" style={{ background: 'var(--zp-busy-soft)', color: 'var(--zp-busy)' }}>
          No live data — slot status fills in real time once the backend and this camera are connected.
        </div>
      )}

      {/* Table */}
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
    </div>
  )
}

/* ── Hardware panel — the existing detail, kept ────────────── */
function HardwarePanel({ camera }) {
  return (
    <div className="space-y-4">
      {/* Live preview placeholder */}
      <div className="zp-map-surface relative aspect-video rounded-md overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          {camera.status === 'offline' ? (
            <div className="text-center">
              <Icons.Camera size={36} style={{ color: 'rgba(255,255,255,0.25)' }} />
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] mt-2 font-semibold" style={{ color: 'var(--zp-full)' }}>No signal</div>
            </div>
          ) : (
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] font-semibold flex items-center gap-2" style={{ color: 'var(--zp-free)' }}>
              <span className="w-1.5 h-1.5 rounded-full blink" style={{ background: 'var(--zp-free)' }}></span>
              Live preview
            </div>
          )}
        </div>
      </div>

      {/* Specs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
        <DataRow label="Model" value={camera.model} small />
        <DataRow label="Resolution" value={camera.resolution} small />
        <DataRow label="IP address" value={camera.ip} mono small />
        <DataRow label="Edge device" value={camera.edge_device} mono small />
        <DataRow label="Power" value={camera.power} small />
        <DataRow label="Spots covered" value={camera.spots_covered} mono small />
      </div>

      {/* Performance */}
      <div>
        <Eyebrow>Performance · last 60 min</Eyebrow>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-2">
          <PerfTile label="CV accuracy" value={camera.cv_accuracy != null ? `${camera.cv_accuracy}%` : '—'} tone="free" />
          <PerfTile label="Uptime" value={`${camera.uptime_pct}%`} tone="info" />
          <PerfTile label="Latency" value={camera.latency_ms != null ? `${camera.latency_ms}ms` : '—'} tone={camera.latency_ms > 200 ? 'busy' : 'free'} />
          <PerfTile label="Inference" value={camera.last_inference_ms != null ? `${camera.last_inference_ms}ms` : '—'} tone="info" />
        </div>
      </div>

      {/* Issues */}
      {camera.issues.length > 0 && (
        <div>
          <Eyebrow>Issues · {camera.issues.length} active</Eyebrow>
          <div className="space-y-2 mt-2">
            {camera.issues.map((issue, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-md" style={{ background: 'var(--zp-busy-soft)' }}>
                <span className="font-bold flex-shrink-0 mt-0.5" style={{ color: 'var(--zp-busy)' }}>⚠</span>
                <span className="text-[12px]" style={{ color: 'var(--zp-ink-2)' }}>{issue}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PerfTile({ label, value, tone = 'info' }) {
  const colorMap = { free: 'var(--zp-free)', info: 'var(--zp-info)', busy: 'var(--zp-busy)', full: 'var(--zp-full)' }
  return (
    <div className="rounded-md p-3" style={{ border: '1px solid var(--zp-line)' }}>
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] font-semibold" style={{ color: 'var(--zp-ink-3)' }}>{label}</div>
      <div className="font-mono text-lg font-bold mt-1 leading-none" style={{ color: colorMap[tone] }}>{value}</div>
    </div>
  )
}