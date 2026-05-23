import React, { useState } from 'react'
import { Panel, Pill, Eyebrow } from '../components/ui'
import { Icons } from '../components/Icons'

const ENDPOINTS = [
  {
    category: 'Authentication',
    owner: 'Bruno',
    items: [
      { method: 'POST', path: '/auth/register', desc: 'Register a new user account', consumers: ['Mobile App', 'Web App'], req: { phone: 'string', name: 'string', password: 'string' }, res: { user_id: 'uuid', access_token: 'jwt' } },
      { method: 'POST', path: '/auth/login', desc: 'Issue JWT for existing user', consumers: ['Mobile App', 'Dashboard', 'Web App'], req: { phone: 'string', password: 'string' }, res: { access_token: 'jwt', user: 'object' } },
    ],
  },
  {
    category: 'Bookings',
    owner: 'Bruno',
    items: [
      { method: 'POST',   path: '/bookings',          desc: 'Create a new parking booking', consumers: ['Mobile App', 'Web App'], req: { event_id: 'uuid', zone: 'A|B|C|D|E', duration: 'string' }, res: { booking_id: 'uuid', qr_hash: 'string', amount_rwf: 'number' } },
      { method: 'GET',    path: '/bookings/{id}',     desc: 'Retrieve a single booking', consumers: ['Mobile App', 'Dashboard'], req: null, res: { booking: 'object' } },
      { method: 'DELETE', path: '/bookings/{id}',     desc: 'Cancel a booking · triggers refund', consumers: ['Dashboard', 'Mobile App'], req: null, res: { cancelled: 'boolean', refund_initiated: 'boolean' } },
    ],
  },
  {
    category: 'Spots & Occupancy',
    owner: 'Bruno',
    items: [
      { method: 'GET', path: '/spots',                desc: 'List all parking spots with real-time status', consumers: ['Dashboard', 'Mobile App'], req: null, res: { spots: 'array' } },
      { method: 'GET', path: '/spots/{zone}',         desc: 'Spots filtered by zone (A–E)', consumers: ['Dashboard', 'Mobile App'], req: null, res: { spots: 'array' } },
      { method: 'GET', path: '/admin/occupancy',      desc: 'Live occupancy summary for the dashboard', consumers: ['Dashboard'], req: null, res: { zones: 'array', total: 'number', occupied: 'number' } },
    ],
  },
  {
    category: 'Payments',
    owner: 'Bruno',
    items: [
      { method: 'POST', path: '/payments/initiate',   desc: 'Start an MTN MoMo payment flow', consumers: ['Mobile App', 'Web App'], req: { booking_id: 'uuid', phone: 'string' }, res: { tx_id: 'string', status: 'pending' } },
      { method: 'POST', path: '/payments/callback',   desc: 'Webhook · MTN MoMo notifies us of payment status', consumers: ['MTN MoMo (incoming)'], req: { tx_id: 'string', status: 'string' }, res: { acknowledged: 'boolean' } },
    ],
  },
  {
    category: 'QR Codes',
    owner: 'Bruno',
    items: [
      { method: 'GET',  path: '/qr/{booking_id}',     desc: 'Generate QR code image for a booking', consumers: ['Mobile App', 'Web App'], req: null, res: 'image/png' },
      { method: 'POST', path: '/qr/validate',         desc: 'Validate a QR at the gate · single-use enforcement', consumers: ['Dashboard (Scanner)'], req: { qr_hash: 'string', gate_id: 'string' }, res: { valid: 'boolean', booking: 'object', reason: 'string' } },
    ],
  },
  {
    category: 'Admin · Analytics',
    owner: 'Bruno',
    items: [
      { method: 'GET', path: '/admin/revenue',         desc: 'Revenue analytics (day/week/month)', consumers: ['Dashboard'], req: '?grain=day|week|month', res: { series: 'array', total: 'number' } },
      { method: 'GET', path: '/admin/analytics',       desc: 'Hourly curves + heatmap data', consumers: ['Dashboard'], req: null, res: { hourly: 'array', heatmap: 'array' } },
      { method: 'GET', path: '/admin/bookings/export', desc: 'CSV export of bookings (filtered)', consumers: ['Dashboard'], req: '?status=&zone=&from=&to=', res: 'text/csv' },
    ],
  },
  {
    category: 'CV Pipeline · MQTT',
    owner: 'Hafiz',
    isMqtt: true,
    items: [
      { method: 'PUB', path: 'zweho/zones/{A|B|C|D|E}/occupancy', desc: 'CV publishes a state change for one spot', consumers: ['Dashboard (subscribes)', 'Backend (subscribes)'], req: { zone_id: 'A-E', spot_id: 'string', status: 'occupied|free', confidence: 'float 0–1', timestamp: 'ISO 8601' }, res: null },
      { method: 'PUB', path: 'zweho/cameras/{id}/health',         desc: 'Camera health heartbeat every 30s', consumers: ['Dashboard'], req: { camera_id: 'string', status: 'online|warning|offline', latency_ms: 'number', fps: 'number' }, res: null },
      { method: 'PUB', path: 'zweho/cv/inference/{id}',           desc: 'Per-camera inference metrics', consumers: ['Dashboard'], req: { camera_id: 'string', confidence_avg: 'float', inference_ms: 'number', detections: 'number' }, res: null },
    ],
  },
  {
    category: 'CV Pipeline · Config',
    owner: 'Hafiz + Emile',
    items: [
      { method: 'GET',  path: '/admin/cv/zones-config',          desc: 'Fetch polygon annotations (from Annotate tool)', consumers: ['Edge devices', 'Dashboard'], req: '?camera_id=', res: { polygons: 'array' } },
      { method: 'POST', path: '/admin/cv/zones-config',          desc: 'Upload new polygon annotation JSON', consumers: ['Dashboard (Annotate)'], req: { camera_id: 'string', polygons: 'array' }, res: { saved: 'boolean' } },
      { method: 'GET',  path: '/admin/cv/benchmarks',            desc: 'CV accuracy benchmarks per camera', consumers: ['Dashboard'], req: null, res: { cameras: 'array' } },
    ],
  },
  {
    category: 'Events & Stadium',
    owner: 'Bruno',
    items: [
      { method: 'GET',  path: '/events',                desc: 'List of upcoming + past stadium events', consumers: ['Mobile App', 'Web App', 'Dashboard'], req: '?status=upcoming|past', res: { events: 'array' } },
      { method: 'POST', path: '/admin/events',          desc: 'Create a new stadium event', consumers: ['Dashboard'], req: { name: 'string', date: 'iso', tier: 'major|regular' }, res: { event: 'object' } },
    ],
  },
]

const STATUS_LEGEND = [
  { color: 'var(--zp-info)',  label: 'Implemented' },
  { color: 'var(--zp-busy)',  label: 'In progress' },
  { color: 'var(--zp-ink-3)', label: 'Planned' },
]

export default function ApiDocsView() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(ENDPOINTS[2].items[2]) // /admin/occupancy default
  const [filterOwner, setFilterOwner] = useState('all')

  const totalEndpoints = ENDPOINTS.reduce((n, c) => n + c.items.length, 0)
  const restCount = ENDPOINTS.filter(c => !c.isMqtt).reduce((n, c) => n + c.items.length, 0)
  const mqttCount = ENDPOINTS.filter(c => c.isMqtt).reduce((n, c) => n + c.items.length, 0)

  const filteredCategories = ENDPOINTS.map(cat => ({
    ...cat,
    items: cat.items.filter(it => {
      if (filterOwner !== 'all' && !cat.owner.includes(filterOwner)) return false
      if (!search) return true
      const q = search.toLowerCase()
      return it.path.toLowerCase().includes(q) || it.desc.toLowerCase().includes(q)
    }),
  })).filter(cat => cat.items.length > 0)

  return (
    <div className="space-y-5 fade-in">
      {/* Summary card */}
      <div className="zp-card p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <Eyebrow>Integration contract</Eyebrow>
            <h2 className="text-2xl font-semibold mt-1.5" style={{ color: 'var(--zp-ink)' }}>API Documentation</h2>
            <p className="text-[13px] mt-2 max-w-2xl" style={{ color: 'var(--zp-ink-2)' }}>
              Every endpoint and MQTT topic that connects the dashboard, mobile app, backend, and CV pipeline. This is the source of truth — Bruno builds these, Hafiz publishes to the MQTT topics, the dashboard consumes both. Update this page first whenever a contract changes.
            </p>
          </div>
          <div className="flex gap-2.5">
            <SummaryStat label="Total endpoints" value={totalEndpoints} />
            <SummaryStat label="REST" value={restCount} tone="info" />
            <SummaryStat label="MQTT topics" value={mqttCount} tone="accent" />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="zp-card px-4 py-3 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-md flex-1 min-w-[200px]"
          style={{ border: '1px solid var(--zp-line)', background: 'var(--zp-surface-2)' }}>
          <Icons.Search size={14} style={{ color: 'var(--zp-ink-3)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search endpoints by path or description…"
            className="bg-transparent text-[13px] font-mono flex-1 outline-none"
            style={{ color: 'var(--zp-ink)' }}
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] mr-2" style={{ color: 'var(--zp-ink-3)' }}>Owner:</span>
          {['all', 'Bruno', 'Hafiz'].map(o => (
            <button
              key={o}
              onClick={() => setFilterOwner(o)}
              className="px-2.5 py-1 text-[11px] font-mono uppercase tracking-[0.12em] rounded font-semibold transition-colors"
              style={{
                background: filterOwner === o ? 'var(--zp-primary-soft)' : 'transparent',
                color: filterOwner === o ? 'var(--zp-primary)' : 'var(--zp-ink-2)',
              }}
            >
              {o}
            </button>
          ))}
        </div>
        <button
          className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
          style={{ background: 'var(--zp-primary)', color: '#fff' }}
        >
          <Icons.Download size={13} /> Export OpenAPI
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
        {/* Endpoint list */}
        <div className="lg:col-span-7 space-y-4">
          {filteredCategories.map(cat => (
            <Panel
              key={cat.category}
              title={cat.category}
              subtitle={`Owner · ${cat.owner}${cat.isMqtt ? ' · MQTT' : ''}`}
              noPadding
              action={<Pill variant={cat.isMqtt ? 'accent' : 'info'}>{cat.items.length} endpoint{cat.items.length !== 1 ? 's' : ''}</Pill>}
            >
              <div>
                {cat.items.map((it, i) => {
                  const isSelected = selected?.path === it.path && selected?.method === it.method
                  return (
                    <div
                      key={it.path + it.method}
                      onClick={() => setSelected(it)}
                      className="px-4 py-3 cursor-pointer transition-colors flex items-center gap-3 flex-wrap"
                      style={{
                        background: isSelected ? 'var(--zp-primary-soft)' : 'transparent',
                        borderTop: i > 0 ? '1px solid var(--zp-line)' : 'none',
                      }}
                      onMouseEnter={el => { if (!isSelected) el.currentTarget.style.background = 'var(--zp-surface-2)' }}
                      onMouseLeave={el => { if (!isSelected) el.currentTarget.style.background = 'transparent' }}
                    >
                      <MethodTag method={it.method} />
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-[12px] font-semibold truncate" style={{ color: 'var(--zp-ink)' }}>{it.path}</div>
                        <div className="text-[11px] mt-0.5" style={{ color: 'var(--zp-ink-3)' }}>{it.desc}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Panel>
          ))}
        </div>

        {/* Endpoint detail */}
        <div className="lg:col-span-5">
          {selected && (
            <div className="space-y-4 sticky top-6">
              <Panel
                title={selected.path}
                subtitle="Endpoint detail"
                action={<MethodTag method={selected.method} />}
              >
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--zp-ink-2)' }}>
                  {selected.desc}
                </p>

                <div className="mt-4">
                  <Eyebrow>Consumers</Eyebrow>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selected.consumers.map(c => (
                      <span key={c} className="px-2 py-1 rounded text-[11px] font-mono"
                        style={{ background: 'var(--zp-surface-2)', color: 'var(--zp-ink-2)', border: '1px solid var(--zp-line)' }}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </Panel>

              {selected.req && (
                <Panel title="Request" subtitle={typeof selected.req === 'string' ? 'Query params' : 'JSON body'}>
                  <CodeBlock data={selected.req} />
                </Panel>
              )}

              {selected.res && (
                <Panel title="Response" subtitle={typeof selected.res === 'string' ? selected.res : 'JSON'}>
                  {typeof selected.res === 'string' ? (
                    <div className="font-mono text-[12px] p-3 rounded-md"
                      style={{ background: 'var(--zp-surface-2)', color: 'var(--zp-ink-2)' }}>
                      Content-Type: <span style={{ color: 'var(--zp-ink)' }}>{selected.res}</span>
                    </div>
                  ) : (
                    <CodeBlock data={selected.res} />
                  )}
                </Panel>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status legend at bottom */}
      <div className="zp-card px-5 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-5 flex-wrap">
          {STATUS_LEGEND.map(s => (
            <div key={s.label} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }}></span>
              <span className="font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color: 'var(--zp-ink-2)' }}>{s.label}</span>
            </div>
          ))}
        </div>
        <div className="font-mono text-[11px]" style={{ color: 'var(--zp-ink-3)' }}>
          Last updated: 2026-05-16 · Contact <span style={{ color: 'var(--zp-ink-2)' }}>Bruno Payang</span> for changes
        </div>
      </div>
    </div>
  )
}

function MethodTag({ method }) {
  const colors = {
    GET:    { bg: 'var(--zp-info-soft)', text: 'var(--zp-info)' },
    POST:   { bg: 'var(--zp-free-soft)', text: 'var(--zp-free)' },
    DELETE: { bg: 'var(--zp-full-soft)', text: 'var(--zp-full)' },
    PUT:    { bg: 'var(--zp-busy-soft)', text: 'var(--zp-busy)' },
    PATCH:  { bg: 'var(--zp-busy-soft)', text: 'var(--zp-busy)' },
    PUB:    { bg: 'var(--zp-accent-soft)', text: 'var(--zp-accent-ink)' },
  }
  const c = colors[method] || colors.GET
  return (
    <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded flex-shrink-0"
      style={{ background: c.bg, color: c.text, minWidth: 56, textAlign: 'center' }}>
      {method}
    </span>
  )
}

function SummaryStat({ label, value, tone }) {
  const colorMap = {
    info: 'var(--zp-info)',
    accent: 'var(--zp-accent-ink)',
    default: 'var(--zp-ink)',
  }
  return (
    <div className="rounded-md px-3 py-2 text-center" style={{ background: 'var(--zp-surface-2)', minWidth: 90 }}>
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] font-semibold" style={{ color: 'var(--zp-ink-3)' }}>{label}</div>
      <div className="font-mono text-xl font-bold mt-0.5" style={{ color: colorMap[tone] || colorMap.default }}>{value}</div>
    </div>
  )
}

function CodeBlock({ data }) {
  const str = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
  return (
    <pre className="font-mono text-[11px] p-3 rounded-md overflow-auto leading-relaxed"
      style={{ background: 'var(--zp-surface-2)', color: 'var(--zp-ink)', border: '1px solid var(--zp-line)', maxHeight: 200 }}>
      {str}
    </pre>
  )
}