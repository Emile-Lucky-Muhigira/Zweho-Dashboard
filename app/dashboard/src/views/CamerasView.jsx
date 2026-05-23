import React, { useState } from 'react'
import { Panel, MetricCard, Pill, Eyebrow, DataRow } from '../components/ui'
import { Icons } from '../components/Icons'

const CAMERAS = [
  {
    id: 'CAM_NORTH_01', name: 'North Gate · Zone A', zone: 'A', model: 'Hikvision DS-2CD2T46',
    status: 'online', resolution: '4MP @ 30fps', latency_ms: 142, uptime_pct: 99.8,
    cv_accuracy: 96.8, last_inference_ms: 84, fps_actual: 28.4,
    ip: '10.0.1.21', edge_device: 'EDGE_NORTH', power: 'PoE 802.3at', spots_covered: 60,
    last_restart: '2026-04-12T03:14:22Z',
    issues: [],
  },
  {
    id: 'CAM_EAST_02', name: 'East Stand · Zone B', zone: 'B', model: 'Hikvision DS-2CD2T46',
    status: 'online', resolution: '4MP @ 30fps', latency_ms: 138, uptime_pct: 99.4,
    cv_accuracy: 95.2, last_inference_ms: 91, fps_actual: 27.1,
    ip: '10.0.1.22', edge_device: 'EDGE_EAST', power: 'PoE 802.3at', spots_covered: 48,
    last_restart: '2026-04-12T03:14:22Z',
    issues: [],
  },
  {
    id: 'CAM_VIP_03', name: 'VIP Lot · Zone C', zone: 'C', model: 'Hikvision DS-2CD2T46',
    status: 'warning', resolution: '4MP @ 30fps', latency_ms: 218, uptime_pct: 97.1,
    cv_accuracy: 92.4, last_inference_ms: 142, fps_actual: 22.8,
    ip: '10.0.1.23', edge_device: 'EDGE_NORTH', power: 'PoE 802.3at', spots_covered: 24,
    last_restart: '2026-05-14T11:02:08Z',
    issues: ['Lower CV confidence on rainy days', 'Reflection at 17:00–18:00'],
  },
  {
    id: 'CAM_SOUTH_04', name: 'South Gate · Zone D', zone: 'D', model: 'Hikvision DS-2CD2T46',
    status: 'online', resolution: '4MP @ 30fps', latency_ms: 156, uptime_pct: 99.6,
    cv_accuracy: 94.1, last_inference_ms: 98, fps_actual: 26.8,
    ip: '10.0.1.24', edge_device: 'EDGE_SOUTH', power: 'PoE 802.3at', spots_covered: 72,
    last_restart: '2026-04-12T03:14:22Z',
    issues: [],
  },
  {
    id: 'CAM_PRESS_05', name: 'Press / Buses · Zone E', zone: 'E', model: 'Hikvision DS-2CD2T46',
    status: 'offline', resolution: '4MP @ 30fps', latency_ms: null, uptime_pct: 82.4,
    cv_accuracy: null, last_inference_ms: null, fps_actual: null,
    ip: '10.0.1.25', edge_device: 'EDGE_SOUTH', power: 'PoE 802.3at', spots_covered: 18,
    last_restart: '2026-05-15T08:42:11Z',
    issues: ['No heartbeat for 12 minutes', 'PoE switch port may be down', 'Last seen 14:11 CAT'],
  },
]

export default function CamerasView() {
  const [selectedCam, setSelectedCam] = useState(CAMERAS[0])

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
        <div className="lg:col-span-7">
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
              {CAMERAS.map((c, i) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCam(c)}
                  className="px-5 py-3 cursor-pointer transition-colors"
                  style={{
                    background: selectedCam?.id === c.id ? 'var(--zp-primary-soft)' : 'transparent',
                    borderTop: i > 0 ? '1px solid var(--zp-line)' : 'none',
                  }}
                  onMouseEnter={el => { if (selectedCam?.id !== c.id) el.currentTarget.style.background = 'var(--zp-surface-2)' }}
                  onMouseLeave={el => { if (selectedCam?.id !== c.id) el.currentTarget.style.background = 'transparent' }}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative w-12 h-12 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{
                        background: c.status === 'online' ? 'var(--zp-free-soft)' : c.status === 'warning' ? 'var(--zp-busy-soft)' : 'var(--zp-full-soft)',
                        color: c.status === 'online' ? 'var(--zp-free)' : c.status === 'warning' ? 'var(--zp-busy)' : 'var(--zp-full)',
                      }}>
                      <Icons.Camera size={20} />
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                        style={{
                          background: c.status === 'online' ? 'var(--zp-free)' : c.status === 'warning' ? 'var(--zp-busy)' : 'var(--zp-full)',
                          borderColor: 'var(--zp-surface)',
                        }}>
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14px] font-semibold" style={{ color: 'var(--zp-ink)' }}>{c.name}</span>
                        <Pill variant={c.status === 'online' ? 'success' : c.status === 'warning' ? 'warn' : 'danger'}>{c.status}</Pill>
                      </div>
                      <div className="font-mono text-[10px] mt-0.5" style={{ color: 'var(--zp-ink-3)' }}>
                        {c.id} · {c.resolution} · {c.ip}
                      </div>
                    </div>
                    <div className="hidden md:flex items-center gap-5 flex-shrink-0">
                      <Stat label="Accuracy" value={c.cv_accuracy != null ? `${c.cv_accuracy}%` : '—'} />
                      <Stat label="Latency" value={c.latency_ms != null ? `${c.latency_ms}ms` : '—'} />
                      <Stat label="Uptime" value={`${c.uptime_pct}%`} />
                    </div>
                    <Icons.ChevronRight size={16} style={{ color: 'var(--zp-ink-3)' }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Camera detail */}
        <div className="lg:col-span-5 space-y-4">
          {selectedCam && (
            <>
              <Panel title={selectedCam.name} subtitle={selectedCam.id}>
                {/* Live preview placeholder */}
                <div className="zp-map-surface relative aspect-video rounded-md overflow-hidden mb-3">
                  <div className="absolute inset-0 flex items-center justify-center">
                    {selectedCam.status === 'offline' ? (
                      <div className="text-center">
                        <Icons.Camera size={40} style={{ color: 'rgba(255,255,255,0.25)' }} />
                        <div className="font-mono text-[11px] uppercase tracking-[0.18em] mt-3 font-semibold" style={{ color: 'var(--zp-full)' }}>No signal</div>
                        <div className="font-mono text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Last seen 14:11 CAT</div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="font-mono text-[11px] uppercase tracking-[0.18em] font-semibold flex items-center justify-center gap-2" style={{ color: 'var(--zp-free)' }}>
                          <span className="w-1.5 h-1.5 rounded-full blink" style={{ background: 'var(--zp-free)' }}></span>
                          Live preview
                        </div>
                        <div className="font-mono text-[10px] mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Click to expand full-screen</div>
                      </div>
                    )}
                  </div>
                  <div className="absolute top-3 left-3 font-mono text-[10px] uppercase tracking-[0.18em] font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {selectedCam.resolution}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex justify-between font-mono text-[10px] uppercase tracking-[0.16em] font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    <span>Spots: {selectedCam.spots_covered}</span>
                    <span>Zone {selectedCam.zone}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <DataRow label="Model" value={selectedCam.model} small />
                  <DataRow label="IP address" value={selectedCam.ip} mono small />
                  <DataRow label="Edge device" value={selectedCam.edge_device} mono small />
                  <DataRow label="Power" value={selectedCam.power} small />
                  <DataRow label="Spots covered" value={selectedCam.spots_covered} mono />
                </div>
              </Panel>

              <Panel title="Performance" subtitle="Last 60 minutes">
                <div className="grid grid-cols-2 gap-2.5">
                  <PerfTile label="CV accuracy" value={selectedCam.cv_accuracy != null ? `${selectedCam.cv_accuracy}%` : '—'} tone="free" />
                  <PerfTile label="Uptime" value={`${selectedCam.uptime_pct}%`} tone="info" />
                  <PerfTile label="Latency" value={selectedCam.latency_ms != null ? `${selectedCam.latency_ms}ms` : '—'} tone={selectedCam.latency_ms > 200 ? 'busy' : 'free'} />
                  <PerfTile label="Inference" value={selectedCam.last_inference_ms != null ? `${selectedCam.last_inference_ms}ms` : '—'} tone="info" />
                </div>
              </Panel>

              {selectedCam.issues.length > 0 && (
                <Panel title="Issues" subtitle={`${selectedCam.issues.length} active`}>
                  <div className="space-y-2">
                    {selectedCam.issues.map((issue, idx) => (
                      <div key={idx}
                        className="flex items-start gap-2.5 p-2.5 rounded-md"
                        style={{ background: 'var(--zp-busy-soft)' }}
                      >
                        <span className="font-bold flex-shrink-0 mt-0.5" style={{ color: 'var(--zp-busy)' }}>⚠</span>
                        <span className="text-[12px]" style={{ color: 'var(--zp-ink-2)' }}>{issue}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
              )}

              <div className="flex gap-2">
                <button
                  className="flex-1 px-3 py-2.5 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
                  style={{ background: 'var(--zp-surface-2)', color: 'var(--zp-ink-2)', border: '1px solid var(--zp-line)' }}
                >
                  Restart camera
                </button>
                <button
                  className="flex-1 px-3 py-2.5 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
                  style={{ background: 'var(--zp-primary)', color: '#fff' }}
                >
                  Full screen →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="text-right">
      <div className="font-mono text-[9px] uppercase tracking-[0.14em] font-semibold" style={{ color: 'var(--zp-ink-3)' }}>{label}</div>
      <div className="font-mono text-[13px] font-semibold mt-0.5" style={{ color: 'var(--zp-ink)' }}>{value}</div>
    </div>
  )
}

function PerfTile({ label, value, tone = 'info' }) {
  const colorMap = {
    free: 'var(--zp-free)',
    info: 'var(--zp-info)',
    busy: 'var(--zp-busy)',
    full: 'var(--zp-full)',
  }
  return (
    <div className="rounded-md p-3" style={{ border: '1px solid var(--zp-line)' }}>
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] font-semibold" style={{ color: 'var(--zp-ink-3)' }}>{label}</div>
      <div className="font-mono text-xl font-bold mt-1 leading-none" style={{ color: colorMap[tone] }}>{value}</div>
    </div>
  )
}