import React, { useState } from 'react'
import { Panel, MetricCard, Pill, Eyebrow, DataRow } from '../components/ui'
import { Icons } from '../components/Icons'

const DEVICES = [
  {
    id: 'VPS_PRIMARY',
    name: 'Cloud VPS · Primary',
    role: 'Backend · API · Database · MQTT broker',
    type: 'vps',
    location: 'Hetzner · Falkenstein, DE',
    status: 'healthy',
    cpu: { model: 'AMD EPYC 7702P', cores: 8, threads: 16, freq_ghz: 2.0, usage_pct: 34 },
    ram: { total_gb: 32, used_gb: 18.2, swap_used_gb: 0.1 },
    gpu: null,
    storage: { total_gb: 480, used_gb: 89, type: 'NVMe SSD' },
    network: { down_mbps: 1000, up_mbps: 1000, current_mbps: 12.4, latency_kgl_ms: 142 },
    os: 'Ubuntu 24.04 LTS',
    uptime_days: 47.2,
    services: [
      { name: 'fastapi-backend', status: 'running', cpu_pct: 8.2, mem_mb: 412 },
      { name: 'postgresql-15', status: 'running', cpu_pct: 4.1, mem_mb: 1820 },
      { name: 'mosquitto-mqtt', status: 'running', cpu_pct: 0.4, mem_mb: 38 },
      { name: 'nginx', status: 'running', cpu_pct: 0.2, mem_mb: 22 },
      { name: 'redis', status: 'running', cpu_pct: 0.6, mem_mb: 96 },
    ],
  },
  {
    id: 'EDGE_NORTH',
    name: 'Edge Device · North',
    role: 'YOLOv8 inference · Cameras: CAM_NORTH_01, CAM_VIP_03',
    type: 'edge',
    location: 'Amahoro Stadium · Server room A',
    status: 'healthy',
    cpu: { model: 'ARM Cortex-A78AE', cores: 6, threads: 6, freq_ghz: 1.5, usage_pct: 62 },
    ram: { total_gb: 8, used_gb: 5.4, swap_used_gb: 0 },
    gpu: { model: 'NVIDIA Jetson Orin Nano (Ampere)', cores_cuda: 1024, vram_gb: 8, usage_pct: 71, temp_c: 58 },
    storage: { total_gb: 256, used_gb: 32, type: 'NVMe SSD' },
    network: { down_mbps: 1000, up_mbps: 1000, current_mbps: 4.8, latency_kgl_ms: 1 },
    os: 'NVIDIA JetPack 6.0 (Ubuntu 22.04)',
    uptime_days: 12.8,
    services: [
      { name: 'yolov8-inference', status: 'running', cpu_pct: 45, mem_mb: 3200 },
      { name: 'mqtt-publisher',   status: 'running', cpu_pct: 1.2, mem_mb: 64 },
      { name: 'rtsp-ingester',    status: 'running', cpu_pct: 8.4, mem_mb: 280 },
    ],
  },
  {
    id: 'EDGE_SOUTH',
    name: 'Edge Device · South',
    role: 'YOLOv8 inference · Cameras: CAM_SOUTH_04, CAM_PRESS_05',
    type: 'edge',
    location: 'Amahoro Stadium · Server room B',
    status: 'warning',
    cpu: { model: 'ARM Cortex-A78AE', cores: 6, threads: 6, freq_ghz: 1.5, usage_pct: 86 },
    ram: { total_gb: 8, used_gb: 7.1, swap_used_gb: 0.4 },
    gpu: { model: 'NVIDIA Jetson Orin Nano (Ampere)', cores_cuda: 1024, vram_gb: 8, usage_pct: 89, temp_c: 71 },
    storage: { total_gb: 256, used_gb: 42, type: 'NVMe SSD' },
    network: { down_mbps: 1000, up_mbps: 1000, current_mbps: 3.2, latency_kgl_ms: 1 },
    os: 'NVIDIA JetPack 6.0 (Ubuntu 22.04)',
    uptime_days: 0.4,
    services: [
      { name: 'yolov8-inference', status: 'running', cpu_pct: 71, mem_mb: 4100 },
      { name: 'mqtt-publisher',   status: 'running', cpu_pct: 1.4, mem_mb: 64 },
      { name: 'rtsp-ingester',    status: 'warning', cpu_pct: 12.1, mem_mb: 320 },
    ],
    warnings: [
      'GPU temp 71°C (threshold: 70°C)',
      'CAM_PRESS_05 RTSP stream dropping packets',
      'Last restarted 9 hours ago',
    ],
  },
  {
    id: 'EDGE_EAST',
    name: 'Edge Device · East',
    role: 'YOLOv8 inference · Cameras: CAM_EAST_02',
    type: 'edge',
    location: 'Amahoro Stadium · Server room A',
    status: 'healthy',
    cpu: { model: 'ARM Cortex-A78AE', cores: 6, threads: 6, freq_ghz: 1.5, usage_pct: 38 },
    ram: { total_gb: 8, used_gb: 3.2, swap_used_gb: 0 },
    gpu: { model: 'NVIDIA Jetson Orin Nano (Ampere)', cores_cuda: 1024, vram_gb: 8, usage_pct: 42, temp_c: 51 },
    storage: { total_gb: 256, used_gb: 28, type: 'NVMe SSD' },
    network: { down_mbps: 1000, up_mbps: 1000, current_mbps: 2.1, latency_kgl_ms: 1 },
    os: 'NVIDIA JetPack 6.0 (Ubuntu 22.04)',
    uptime_days: 12.8,
    services: [
      { name: 'yolov8-inference', status: 'running', cpu_pct: 28, mem_mb: 2400 },
      { name: 'mqtt-publisher',   status: 'running', cpu_pct: 1.0, mem_mb: 58 },
      { name: 'rtsp-ingester',    status: 'running', cpu_pct: 5.2, mem_mb: 220 },
    ],
  },
  {
    id: 'TABLET_NORTH',
    name: 'Gate Tablet · North',
    role: 'QR Scanner · Operated by Daniel K.',
    type: 'tablet',
    location: 'Amahoro · North gate booth',
    status: 'healthy',
    cpu: { model: 'Snapdragon 7+ Gen 3', cores: 8, threads: 8, freq_ghz: 2.8, usage_pct: 18 },
    ram: { total_gb: 8, used_gb: 2.4, swap_used_gb: 0 },
    gpu: null,
    storage: { total_gb: 128, used_gb: 14, type: 'UFS 3.1' },
    network: { down_mbps: 100, up_mbps: 100, current_mbps: 0.8, latency_kgl_ms: 18 },
    os: 'Android 14',
    uptime_days: 4.2,
    services: [
      { name: 'zweho-scanner-app', status: 'running', cpu_pct: 12, mem_mb: 320 },
    ],
  },
]

export default function EdgeDevicesView() {
  const [selected, setSelected] = useState(DEVICES[1]) // edge devices are the most interesting default
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? DEVICES : DEVICES.filter(d => d.type === filter)

  const counts = {
    healthy: DEVICES.filter(d => d.status === 'healthy').length,
    warning: DEVICES.filter(d => d.status === 'warning').length,
    offline: DEVICES.filter(d => d.status === 'offline').length,
  }

  return (
    <div className="space-y-5 fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard label="Total Hosts" value={DEVICES.length} unit="machines" tone="info" />
        <MetricCard label="Healthy" value={counts.healthy} tone="free" delta={counts.warning + counts.offline === 0 ? 'all systems go' : null} />
        <MetricCard label="Warnings" value={counts.warning} tone={counts.warning > 0 ? 'busy' : 'free'} delta={counts.warning > 0 ? 'needs review' : null} />
        <MetricCard label="Offline" value={counts.offline} tone={counts.offline > 0 ? 'full' : 'free'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
        {/* Device list */}
        <div className="lg:col-span-5">
          <Panel
            title="Host Machines"
            subtitle="All running services"
            noPadding
            action={
              <div className="flex items-center gap-1">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'vps', label: 'Cloud' },
                  { id: 'edge', label: 'Edge' },
                  { id: 'tablet', label: 'Tablets' },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.12em] rounded font-semibold transition-colors"
                    style={{
                      background: filter === f.id ? 'var(--zp-primary-soft)' : 'transparent',
                      color: filter === f.id ? 'var(--zp-primary)' : 'var(--zp-ink-2)',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            }
          >
            <div>
              {filtered.map((d, i) => {
                const isSelected = selected?.id === d.id
                const iconBg = d.status === 'healthy' ? 'var(--zp-free-soft)' : d.status === 'warning' ? 'var(--zp-busy-soft)' : 'var(--zp-full-soft)'
                const iconColor = d.status === 'healthy' ? 'var(--zp-free)' : d.status === 'warning' ? 'var(--zp-busy)' : 'var(--zp-full)'
                const TypeIcon = d.type === 'vps' ? Icons.Server : d.type === 'edge' ? Icons.Server : Icons.QrCode

                return (
                  <div
                    key={d.id}
                    onClick={() => setSelected(d)}
                    className="px-5 py-3.5 cursor-pointer transition-colors"
                    style={{
                      background: isSelected ? 'var(--zp-primary-soft)' : 'transparent',
                      borderTop: i > 0 ? '1px solid var(--zp-line)' : 'none',
                    }}
                    onMouseEnter={el => { if (!isSelected) el.currentTarget.style.background = 'var(--zp-surface-2)' }}
                    onMouseLeave={el => { if (!isSelected) el.currentTarget.style.background = 'transparent' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-11 h-11 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ background: iconBg, color: iconColor }}>
                        <TypeIcon size={20} />
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                          style={{ background: iconColor, borderColor: 'var(--zp-surface)' }}></span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[14px] font-semibold" style={{ color: 'var(--zp-ink)' }}>{d.name}</span>
                          <Pill variant={d.type === 'vps' ? 'accent' : d.type === 'edge' ? 'info' : 'default'}>{d.type}</Pill>
                        </div>
                        <div className="font-mono text-[10px] mt-0.5" style={{ color: 'var(--zp-ink-3)' }}>{d.id}</div>
                      </div>
                      <div className="hidden md:block text-right">
                        <div className="font-mono text-[9px] uppercase tracking-[0.14em] font-semibold" style={{ color: 'var(--zp-ink-3)' }}>CPU</div>
                        <div className="font-mono text-[12px] font-semibold mt-0.5" style={{ color: d.cpu.usage_pct > 80 ? 'var(--zp-busy)' : 'var(--zp-ink)' }}>{d.cpu.usage_pct}%</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Panel>
        </div>

        {/* Device detail */}
        <div className="lg:col-span-7 space-y-4">
          {selected && (
            <>
              {/* Header */}
              <Panel
                title={selected.name}
                subtitle={selected.role}
                action={<Pill variant={selected.status === 'healthy' ? 'success' : selected.status === 'warning' ? 'warn' : 'danger'}>{selected.status}</Pill>}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                  <DataRow label="Device ID" value={selected.id} mono small />
                  <DataRow label="Location" value={selected.location} small />
                  <DataRow label="OS" value={selected.os} small />
                  <DataRow label="Uptime" value={`${selected.uptime_days.toFixed(1)} days`} mono small />
                </div>
              </Panel>

              {/* Hardware specs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SpecCard title="CPU" subtitle={selected.cpu.model}>
                  <div className="space-y-2.5">
                    <Gauge label="Usage" value={selected.cpu.usage_pct} max={100} unit="%" />
                    <DataRow label="Cores / Threads" value={`${selected.cpu.cores} / ${selected.cpu.threads}`} mono />
                    <DataRow label="Frequency" value={`${selected.cpu.freq_ghz} GHz`} mono />
                  </div>
                </SpecCard>

                <SpecCard title="Memory" subtitle={`${selected.ram.total_gb} GB total`}>
                  <div className="space-y-2.5">
                    <Gauge label="Used" value={selected.ram.used_gb} max={selected.ram.total_gb} unit="GB" />
                    <DataRow label="Used / Total" value={`${selected.ram.used_gb} / ${selected.ram.total_gb} GB`} mono />
                    <DataRow label="Swap used" value={`${selected.ram.swap_used_gb} GB`} mono />
                  </div>
                </SpecCard>

                {selected.gpu && (
                  <SpecCard title="GPU" subtitle={selected.gpu.model} highlight>
                    <div className="space-y-2.5">
                      <Gauge label="Usage" value={selected.gpu.usage_pct} max={100} unit="%" />
                      <DataRow label="CUDA cores" value={selected.gpu.cores_cuda} mono />
                      <DataRow label="VRAM" value={`${selected.gpu.vram_gb} GB`} mono />
                      <DataRow label="Temperature" value={`${selected.gpu.temp_c}°C`} mono
                        valueColor={selected.gpu.temp_c > 70 ? 'var(--zp-busy)' : 'var(--zp-ink)'} />
                    </div>
                  </SpecCard>
                )}
                {!selected.gpu && (
                  <SpecCard title="GPU" subtitle="No dedicated GPU">
                    <div className="text-[12px] py-4 text-center" style={{ color: 'var(--zp-ink-3)' }}>
                      This host doesn't run CV inference.
                    </div>
                  </SpecCard>
                )}

                <SpecCard title="Storage" subtitle={selected.storage.type}>
                  <div className="space-y-2.5">
                    <Gauge label="Used" value={selected.storage.used_gb} max={selected.storage.total_gb} unit="GB" />
                    <DataRow label="Used / Total" value={`${selected.storage.used_gb} / ${selected.storage.total_gb} GB`} mono />
                    <DataRow label="Type" value={selected.storage.type} small />
                  </div>
                </SpecCard>
              </div>

              {/* Network */}
              <Panel title="Network" subtitle="Connection health">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <NetTile label="Download" value={`${selected.network.down_mbps}`} unit="Mbps cap" />
                  <NetTile label="Upload" value={`${selected.network.up_mbps}`} unit="Mbps cap" />
                  <NetTile label="Current" value={`${selected.network.current_mbps}`} unit="Mbps now" />
                  <NetTile label="Latency to Kgl" value={`${selected.network.latency_kgl_ms}`} unit="ms" tone={selected.network.latency_kgl_ms > 100 ? 'busy' : 'free'} />
                </div>
              </Panel>

              {/* Services */}
              <Panel title="Running Services" subtitle={`${selected.services.length} processes`}>
                <div className="space-y-1.5">
                  {selected.services.map(s => (
                    <div key={s.name} className="flex items-center justify-between py-2 px-2.5 rounded-md"
                      style={{ background: 'var(--zp-surface-2)' }}>
                      <div className="flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.status === 'running' ? 'var(--zp-free)' : 'var(--zp-busy)' }}></span>
                        <span className="font-mono text-[12px] font-semibold" style={{ color: 'var(--zp-ink)' }}>{s.name}</span>
                        {s.status !== 'running' && <Pill variant="warn">{s.status}</Pill>}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-[11px]" style={{ color: 'var(--zp-ink-3)' }}>CPU: <span style={{ color: 'var(--zp-ink-2)' }}>{s.cpu_pct}%</span></span>
                        <span className="font-mono text-[11px]" style={{ color: 'var(--zp-ink-3)' }}>MEM: <span style={{ color: 'var(--zp-ink-2)' }}>{s.mem_mb}MB</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Warnings */}
              {selected.warnings && selected.warnings.length > 0 && (
                <Panel title="Active Warnings" subtitle={`${selected.warnings.length} issues`}>
                  <div className="space-y-2">
                    {selected.warnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-md" style={{ background: 'var(--zp-busy-soft)' }}>
                        <span className="font-bold flex-shrink-0 mt-0.5" style={{ color: 'var(--zp-busy)' }}>⚠</span>
                        <span className="text-[12px]" style={{ color: 'var(--zp-ink-2)' }}>{w}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
              )}

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                <button
                  className="flex-1 min-w-[120px] px-3 py-2.5 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
                  style={{ background: 'var(--zp-surface-2)', color: 'var(--zp-ink-2)', border: '1px solid var(--zp-line)' }}
                >
                  Restart device
                </button>
                <button
                  className="flex-1 min-w-[120px] px-3 py-2.5 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
                  style={{ background: 'var(--zp-surface-2)', color: 'var(--zp-ink-2)', border: '1px solid var(--zp-line)' }}
                >
                  View logs
                </button>
                <button
                  className="flex-1 min-w-[120px] px-3 py-2.5 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
                  style={{ background: 'var(--zp-primary)', color: '#fff' }}
                >
                  SSH terminal →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function SpecCard({ title, subtitle, children, highlight }) {
  return (
    <div className="zp-card p-4" style={{ borderColor: highlight ? 'var(--zp-accent-soft)' : 'var(--zp-line)', boxShadow: highlight ? '0 0 0 1px var(--zp-accent-soft)' : 'var(--zp-shadow-1)' }}>
      <div className="flex items-baseline justify-between mb-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] font-semibold" style={{ color: highlight ? 'var(--zp-accent-ink)' : 'var(--zp-ink-3)' }}>{title}</div>
      </div>
      <div className="font-mono text-[11px] mb-3" style={{ color: 'var(--zp-ink-2)' }}>{subtitle}</div>
      {children}
    </div>
  )
}

function Gauge({ label, value, max, unit }) {
  const pct = Math.min(100, (value / max) * 100)
  const color = pct > 80 ? 'var(--zp-busy)' : pct > 60 ? 'var(--zp-info)' : 'var(--zp-free)'
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] font-semibold" style={{ color: 'var(--zp-ink-3)' }}>{label}</span>
        <span className="font-mono text-[12px] font-bold" style={{ color }}>{Math.round(pct)}{unit === '%' ? '%' : ''}</span>
      </div>
      <div className="zp-bar"><i style={{ width: `${pct}%`, background: color }} /></div>
    </div>
  )
}

function NetTile({ label, value, unit, tone = 'info' }) {
  const colorMap = {
    free: 'var(--zp-free)',
    info: 'var(--zp-ink)',
    busy: 'var(--zp-busy)',
  }
  return (
    <div className="rounded-md p-3" style={{ border: '1px solid var(--zp-line)' }}>
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] font-semibold" style={{ color: 'var(--zp-ink-3)' }}>{label}</div>
      <div className="font-mono text-lg font-bold mt-1 leading-none" style={{ color: colorMap[tone] }}>{value}</div>
      <div className="font-mono text-[10px] mt-1" style={{ color: 'var(--zp-ink-3)' }}>{unit}</div>
    </div>
  )
}