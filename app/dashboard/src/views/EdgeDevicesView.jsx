import React, { useState } from 'react'
import { Panel, MetricCard, Pill, Eyebrow, DataRow } from '../components/ui'
import { Icons } from '../components/Icons'
import { useDevices } from '../lib/devicesStore'
import { useToast } from '../lib/toast'

const TYPE_LABEL = { vps: 'Cloud VPS', edge: 'Edge Device', tablet: 'Gate Tablet' }

export default function EdgeDevicesView() {
  const { devices, addDevice, updateDevice, removeDevice } = useDevices()
  const toast = useToast()

  const [selectedId, setSelectedId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const filtered = filter === 'all' ? devices : devices.filter(d => d.type === filter)
  const selected = devices.find(d => d.id === selectedId) || null

  const counts = {
    vps: devices.filter(d => d.type === 'vps').length,
    edge: devices.filter(d => d.type === 'edge').length,
    tablet: devices.filter(d => d.type === 'tablet').length,
  }

  return (
    <div className="space-y-5 fade-in">
      {/* Context banner */}
      <div className="zp-card px-5 py-3 flex items-center gap-3 flex-wrap">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--zp-ink-3)' }}></span>
        <span className="text-[12px]" style={{ color: 'var(--zp-ink-2)' }}>
          This is the infrastructure inventory. Live metrics (CPU, memory, temperature, running
          services) appear once a monitoring agent is installed on each machine.
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard label="Total Hosts" value={devices.length} unit="machines" tone="info" />
        <MetricCard label="Cloud VPS" value={counts.vps} tone="info" />
        <MetricCard label="Edge Devices" value={counts.edge} tone="info" />
        <MetricCard label="Gate Tablets" value={counts.tablet} tone="info" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
        {/* Device list */}
        <div className="lg:col-span-5">
          <Panel
            title="Host Machines"
            subtitle="Infrastructure inventory"
            noPadding
            action={
              <button
                onClick={() => { setShowForm(true); setEditingId(null) }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
                style={{ background: 'var(--zp-primary)', color: '#fff' }}
              >
                <Icons.Plus size={13} /> Add device
              </button>
            }
          >
            {/* Filter chips */}
            <div className="flex items-center gap-1 px-5 py-3" style={{ borderBottom: '1px solid var(--zp-line)', background: 'var(--zp-surface-2)' }}>
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

            {/* Add form */}
            {showForm && (
              <DeviceForm
                mode="add"
                onSave={(data) => {
                  const d = addDevice(data)
                  setShowForm(false)
                  setSelectedId(d.id)
                  toast.success('Device added', d.name)
                }}
                onCancel={() => setShowForm(false)}
              />
            )}

            <div>
              {filtered.length === 0 && !showForm && (
                <div className="px-5 py-12 text-center">
                  <div className="text-[13px] font-semibold" style={{ color: 'var(--zp-ink)' }}>
                    {devices.length === 0 ? 'No devices registered' : 'No devices match this filter'}
                  </div>
                  <p className="text-[12px] mt-1 max-w-xs mx-auto" style={{ color: 'var(--zp-ink-2)' }}>
                    {devices.length === 0
                      ? 'Add your VPS, edge devices, and gate tablets to track the project\u2019s infrastructure.'
                      : 'Try a different filter.'}
                  </p>
                </div>
              )}

              {filtered.map((d, i) => {
                if (editingId === d.id) {
                  return (
                    <DeviceForm
                      key={d.id}
                      mode="edit"
                      initial={d}
                      onSave={(data) => { updateDevice(d.id, data); setEditingId(null); toast.success('Device updated', data.name) }}
                      onCancel={() => setEditingId(null)}
                    />
                  )
                }
                const isSelected = selectedId === d.id
                const TypeIcon = d.type === 'tablet' ? Icons.QrCode : Icons.Server
                return (
                  <div
                    key={d.id}
                    onClick={() => setSelectedId(d.id)}
                    className="px-5 py-3.5 cursor-pointer transition-colors"
                    style={{
                      background: isSelected ? 'var(--zp-primary-soft)' : 'transparent',
                      borderTop: i > 0 ? '1px solid var(--zp-line)' : 'none',
                    }}
                    onMouseEnter={el => { if (!isSelected) el.currentTarget.style.background = 'var(--zp-surface-2)' }}
                    onMouseLeave={el => { if (!isSelected) el.currentTarget.style.background = 'transparent' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ background: 'var(--zp-surface-2)', color: 'var(--zp-ink-2)' }}>
                        <TypeIcon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[14px] font-semibold" style={{ color: 'var(--zp-ink)' }}>{d.name}</span>
                          <Pill variant={d.type === 'vps' ? 'accent' : d.type === 'edge' ? 'info' : 'default'}>{d.type}</Pill>
                        </div>
                        <div className="font-mono text-[10px] mt-0.5" style={{ color: 'var(--zp-ink-3)' }}>
                          {d.id}{d.location ? ` \u00b7 ${d.location}` : ''}
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

        {/* Device detail */}
        <div className="lg:col-span-7 space-y-4">
          {!selected ? (
            <Panel title="Device detail">
              <div className="text-center py-10 text-[13px]" style={{ color: 'var(--zp-ink-3)' }}>
                Select a device from the list to see its specifications.
              </div>
            </Panel>
          ) : (
            <>
              <Panel
                title={selected.name}
                subtitle={selected.role || TYPE_LABEL[selected.type]}
                action={
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => { setEditingId(selected.id); setShowForm(false) }}
                      className="px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-[0.12em] rounded-md font-semibold"
                      style={{ background: 'var(--zp-surface-2)', color: 'var(--zp-ink-2)', border: '1px solid var(--zp-line)' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${selected.name}?`)) {
                          removeDevice(selected.id); setSelectedId(null); toast.error('Device removed', selected.name)
                        }
                      }}
                      className="px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-[0.12em] rounded-md font-semibold"
                      style={{ background: 'var(--zp-full-soft)', color: 'var(--zp-full)', border: '1px solid color-mix(in srgb, var(--zp-full) 30%, transparent)' }}
                    >
                      Remove
                    </button>
                  </div>
                }
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                  <DataRow label="Device ID" value={selected.id} mono small />
                  <DataRow label="Type" value={TYPE_LABEL[selected.type]} small />
                  <DataRow label="Location" value={selected.location || '\u2014'} small />
                  <DataRow label="OS" value={selected.os || '\u2014'} small />
                  <DataRow label="Added" value={selected.addedAt} mono small />
                </div>
              </Panel>

              {/* Hardware specs — admin-entered, real */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SpecCard title="CPU" subtitle={selected.cpuModel || 'Not specified'} />
                <SpecCard title="Memory" subtitle={selected.ramGb ? `${selected.ramGb} GB RAM` : 'Not specified'} />
                <SpecCard title="GPU" subtitle={selected.gpuModel || 'No dedicated GPU'} highlight={!!selected.gpuModel} />
                <SpecCard title="Storage" subtitle={selected.storageGb ? `${selected.storageGb} GB` : 'Not specified'} />
              </div>

              {/* Live metrics — honest unavailable state */}
              <Panel title="Live Metrics" subtitle="CPU · Memory · Temperature · Services">
                <div className="flex flex-col items-center text-center py-8 px-6">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: 'var(--zp-surface-2)' }}>
                    <Icons.Server size={22} style={{ color: 'var(--zp-ink-3)' }} />
                  </div>
                  <div className="text-[14px] font-semibold" style={{ color: 'var(--zp-ink)' }}>No live metrics yet</div>
                  <p className="text-[12px] mt-1.5 max-w-md" style={{ color: 'var(--zp-ink-2)' }}>
                    Real-time CPU, memory, GPU temperature, and running-service data appear here once a
                    monitoring agent is installed on this machine and reporting to the backend.
                  </p>
                  <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] px-2.5 py-1 rounded"
                    style={{ background: 'var(--zp-surface-2)', color: 'var(--zp-ink-3)' }}>
                    Awaiting monitoring agent
                  </div>
                </div>
              </Panel>

              {/* Actions — need backend, honestly disabled */}
              <div className="flex gap-2 flex-wrap">
                <DisabledAction>Restart device</DisabledAction>
                <DisabledAction>View logs</DisabledAction>
                <DisabledAction>SSH terminal</DisabledAction>
              </div>
              <p className="font-mono text-[10px]" style={{ color: 'var(--zp-ink-3)' }}>
                Remote actions become available once the backend management service is connected.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Add / edit form ───────────────────────────────────────── */
function DeviceForm({ mode, initial, onSave, onCancel }) {
  const [f, setF] = useState({
    name: initial?.name || '',
    type: initial?.type || 'edge',
    role: initial?.role || '',
    location: initial?.location || '',
    os: initial?.os || '',
    cpuModel: initial?.cpuModel || '',
    ramGb: initial?.ramGb ?? '',
    gpuModel: initial?.gpuModel || '',
    storageGb: initial?.storageGb ?? '',
  })
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }))
  const inputStyle = { background: 'var(--zp-surface)', border: '1px solid var(--zp-line)', color: 'var(--zp-ink)' }
  const labelCls = 'font-mono text-[10px] uppercase tracking-[0.14em]'

  return (
    <div className="px-5 py-4" style={{ background: 'var(--zp-primary-soft)', borderBottom: '1px solid var(--zp-line)' }}>
      <Eyebrow>{mode === 'add' ? 'Add a device' : `Edit \u00b7 ${initial.name}`}</Eyebrow>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-3">
        <div className="md:col-span-7">
          <label className={labelCls} style={{ color: 'var(--zp-ink-3)' }}>Name</label>
          <input value={f.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Edge Device · North"
            className="w-full mt-1 px-3 py-2 text-[13px] rounded-md outline-none" style={inputStyle} />
        </div>
        <div className="md:col-span-5">
          <label className={labelCls} style={{ color: 'var(--zp-ink-3)' }}>Type</label>
          <select value={f.type} onChange={e => set('type', e.target.value)}
            className="w-full mt-1 px-3 py-2 text-[13px] rounded-md outline-none" style={inputStyle}>
            <option value="vps">Cloud VPS</option>
            <option value="edge">Edge Device</option>
            <option value="tablet">Gate Tablet</option>
          </select>
        </div>
        <div className="md:col-span-12">
          <label className={labelCls} style={{ color: 'var(--zp-ink-3)' }}>Role / purpose</label>
          <input value={f.role} onChange={e => set('role', e.target.value)} placeholder="e.g. YOLOv8 inference for North & VIP cameras"
            className="w-full mt-1 px-3 py-2 text-[13px] rounded-md outline-none" style={inputStyle} />
        </div>
        <div className="md:col-span-6">
          <label className={labelCls} style={{ color: 'var(--zp-ink-3)' }}>Location</label>
          <input value={f.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Amahoro Stadium · Server room A"
            className="w-full mt-1 px-3 py-2 text-[13px] rounded-md outline-none" style={inputStyle} />
        </div>
        <div className="md:col-span-6">
          <label className={labelCls} style={{ color: 'var(--zp-ink-3)' }}>Operating system</label>
          <input value={f.os} onChange={e => set('os', e.target.value)} placeholder="e.g. Ubuntu 24.04 LTS"
            className="w-full mt-1 px-3 py-2 text-[13px] rounded-md outline-none" style={inputStyle} />
        </div>
        <div className="md:col-span-6">
          <label className={labelCls} style={{ color: 'var(--zp-ink-3)' }}>CPU model</label>
          <input value={f.cpuModel} onChange={e => set('cpuModel', e.target.value)} placeholder="e.g. NVIDIA ARM Cortex-A78AE"
            className="w-full mt-1 px-3 py-2 text-[13px] rounded-md outline-none" style={inputStyle} />
        </div>
        <div className="md:col-span-6">
          <label className={labelCls} style={{ color: 'var(--zp-ink-3)' }}>GPU model (optional)</label>
          <input value={f.gpuModel} onChange={e => set('gpuModel', e.target.value)} placeholder="e.g. NVIDIA Jetson Orin Nano"
            className="w-full mt-1 px-3 py-2 text-[13px] rounded-md outline-none" style={inputStyle} />
        </div>
        <div className="md:col-span-6">
          <label className={labelCls} style={{ color: 'var(--zp-ink-3)' }}>RAM (GB)</label>
          <input value={f.ramGb} onChange={e => set('ramGb', e.target.value.replace(/[^0-9]/g, ''))} placeholder="e.g. 8"
            className="w-full mt-1 px-3 py-2 text-[13px] font-mono rounded-md outline-none" style={inputStyle} />
        </div>
        <div className="md:col-span-6">
          <label className={labelCls} style={{ color: 'var(--zp-ink-3)' }}>Storage (GB)</label>
          <input value={f.storageGb} onChange={e => set('storageGb', e.target.value.replace(/[^0-9]/g, ''))} placeholder="e.g. 256"
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
          onClick={() => { if (!f.name.trim()) { alert('Name is required'); return } onSave(f) }}
          className="px-4 py-2 text-[11px] font-mono uppercase tracking-[0.12em] rounded-md font-semibold"
          style={{ background: 'var(--zp-primary)', color: '#fff' }}>
          {mode === 'add' ? 'Add device' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}

function SpecCard({ title, subtitle, highlight }) {
  return (
    <div className="zp-card p-4"
      style={{ borderColor: highlight ? 'var(--zp-accent-soft)' : 'var(--zp-line)', boxShadow: highlight ? '0 0 0 1px var(--zp-accent-soft)' : 'var(--zp-shadow-1)' }}>
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] font-semibold mb-2" style={{ color: highlight ? 'var(--zp-accent-ink)' : 'var(--zp-ink-3)' }}>{title}</div>
      <div className="text-[13px]" style={{ color: 'var(--zp-ink)' }}>{subtitle}</div>
    </div>
  )
}

function DisabledAction({ children }) {
  return (
    <button
      disabled
      title="Available once the backend is connected"
      className="flex-1 min-w-[120px] px-3 py-2.5 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
      style={{ background: 'var(--zp-surface-2)', color: 'var(--zp-ink-3)', border: '1px solid var(--zp-line)', cursor: 'not-allowed', opacity: 0.6 }}
    >
      {children}
    </button>
  )
}