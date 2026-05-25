import React, { useState, useRef } from 'react'
import { Panel, Pill, Eyebrow, DataRow } from '../components/ui'
import { Icons } from '../components/Icons'
import { useDemoMode } from '../lib/demoMode'
import { useSettings } from '../lib/settingsStore'
import { useZones } from '../lib/zonesStore'
import { useToast } from '../lib/toast'

const SECTIONS = [
  { id: 'demo',          label: 'Demo Mode',           icon: 'Refresh' },
  { id: 'organisation',  label: 'Organisation',        icon: 'Stadium' },
  { id: 'pricing',       label: 'Zone Pricing',        icon: 'Chart' },
  { id: 'rules',         label: 'Business Rules',      icon: 'Settings' },
  { id: 'languages',     label: 'Languages',           icon: 'Code' },
  { id: 'notifications', label: 'Notifications',       icon: 'Bell' },
  { id: 'momo',          label: 'Integrations · MoMo', icon: 'Receipt' },
  { id: 'audit',         label: 'Audit Log',           icon: 'Shield' },
]

export default function SettingsView() {
  const [section, setSection] = useState('demo')

  return (
    <div className="fade-in">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        <aside className="md:col-span-3">
          <div className="zp-card p-2 sticky top-6">
            {SECTIONS.map(s => {
              const Icon = Icons[s.icon] || Icons.Settings
              const active = section === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => setSection(s.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left mb-0.5 transition-colors"
                  style={{
                    background: active ? 'var(--zp-primary-soft)' : 'transparent',
                    color: active ? 'var(--zp-primary)' : 'var(--zp-ink-2)',
                    fontWeight: active ? 600 : 500,
                    fontSize: 13,
                  }}
                >
                  <Icon size={16} stroke={active ? 1.8 : 1.6} />
                  <span>{s.label}</span>
                </button>
              )
            })}
          </div>
        </aside>

        <div className="md:col-span-9">
          {section === 'demo' && <DemoModeSection />}
          {section === 'organisation' && <OrganisationSection />}
          {section === 'pricing' && <PricingSection />}
          {section === 'rules' && <RulesSection />}
          {section === 'languages' && <LanguagesSection />}
          {section === 'notifications' && <NotificationsSection />}
          {section === 'momo' && <MoMoSection />}
          {section === 'audit' && <AuditSection />}
        </div>
      </div>
    </div>
  )
}

/* ── Organisation — real, editable, persists ───────────────── */
function OrganisationSection() {
  const { settings, update } = useSettings()
  const toast = useToast()
  const fileRef = useRef(null)
  const [form, setForm] = useState(settings.organisation)

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const onLogoPick = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Invalid file', 'Please choose an image'); return }
    if (file.size > 500_000) { toast.error('Too large', 'Logo must be under 500KB'); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      set('logoDataUrl', ev.target.result)
      update('organisation', { logoDataUrl: ev.target.result })
      toast.success('Logo updated', 'Saved')
    }
    reader.readAsDataURL(file)
  }

  const inputStyle = { background: 'var(--zp-surface-2)', border: '1px solid var(--zp-line)', color: 'var(--zp-ink)' }

  return (
    <div className="space-y-5">
      <SectionHeader title="Organisation" desc="Company details and branding. Changes are saved to this browser." />

      <Panel title="Company">
        <div className="space-y-3">
          <EditField label="Legal name" value={form.legalName} onChange={v => set('legalName', v)} style={inputStyle} />
          <EditField label="Trading name" value={form.tradingName} onChange={v => set('tradingName', v)} style={inputStyle} />
          <EditField label="Country" value={form.country} onChange={v => set('country', v)} style={inputStyle} />
          <EditField label="TIN" value={form.tin} onChange={v => set('tin', v)} placeholder="Pending RDB registration" style={inputStyle} mono />
          <EditField label="Address" value={form.address} onChange={v => set('address', v)} style={inputStyle} />
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={() => { update('organisation', form); toast.success('Saved', 'Company details updated') }}
            className="px-4 py-2 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
            style={{ background: 'var(--zp-primary)', color: '#fff' }}
          >
            Save changes
          </button>
        </div>
      </Panel>

      <Panel title="Stadium partner">
        <p className="text-[12px]" style={{ color: 'var(--zp-ink-2)' }}>
          The Amahoro Stadium concession is managed by the Product Lead. Partnership and liaison details
          live in the team's Registration &amp; Compliance document, not here.
        </p>
      </Panel>

      <Panel title="Branding">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-16 h-16 rounded-md flex items-center justify-center overflow-hidden" style={{ background: 'var(--zp-primary)' }}>
            {form.logoDataUrl ? (
              <img src={form.logoDataUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <svg width="32" height="32" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="5" height="5" fill="#F4F0E8"/><rect x="9" y="2" width="5" height="5" fill="#F4F0E8"/>
                <rect x="2" y="9" width="5" height="5" fill="#F4F0E8"/><rect x="9" y="9" width="5" height="5" fill="#F4F0E8"/>
              </svg>
            )}
          </div>
          <div>
            <div className="text-[14px] font-semibold" style={{ color: 'var(--zp-ink)' }}>Zweho.Park</div>
            <div className="font-mono text-[11px]" style={{ color: 'var(--zp-ink-3)' }}>Primary: Lake Kivu Blue · Accent: Acacia Gold</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onLogoPick} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            className="ml-auto px-3 py-2 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
            style={{ background: 'var(--zp-surface-2)', color: 'var(--zp-ink-2)', border: '1px solid var(--zp-line)' }}
          >
            {form.logoDataUrl ? 'Replace logo' : 'Upload logo'}
          </button>
          {form.logoDataUrl && (
            <button
              onClick={() => { set('logoDataUrl', null); update('organisation', { logoDataUrl: null }); toast.info('Logo removed', '') }}
              className="px-3 py-2 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
              style={{ background: 'var(--zp-full-soft)', color: 'var(--zp-full)', border: '1px solid color-mix(in srgb, var(--zp-full) 30%, transparent)' }}
            >
              Remove
            </button>
          )}
        </div>
      </Panel>
    </div>
  )
}

/* ── Zone Pricing — reads LIVE zones, persists per-zone price ─ */
function PricingSection() {
  const { activeZones } = useZones()
  const { settings, update } = useSettings()
  const toast = useToast()
  const [prices, setPrices] = useState(() => {
    const init = {}
    activeZones.forEach(z => { init[z.id] = settings.zonePrices[z.id] ?? '' })
    return init
  })

  const setPrice = (id, v) => setPrices(prev => ({ ...prev, [id]: v.replace(/[^0-9]/g, '') }))

  return (
    <div className="space-y-5">
      <SectionHeader title="Zone Pricing" desc="Base parking price per zone, in RWF. Zones come from the Zones page." />

      {activeZones.length === 0 ? (
        <Panel title="Base prices per zone">
          <p className="text-[13px]" style={{ color: 'var(--zp-ink-2)' }}>
            No active zones yet. Add zones on the Zones page first, then set their prices here.
          </p>
        </Panel>
      ) : (
        <>
          <Panel title="Base prices per zone" noPadding>
            <div>
              {activeZones.map((z, i) => (
                <div key={z.id} className="px-5 py-3 flex items-center gap-4 flex-wrap"
                  style={{ borderTop: i > 0 ? '1px solid var(--zp-line)' : 'none' }}>
                  <div className="w-10 h-10 rounded-md flex items-center justify-center font-mono font-bold flex-shrink-0"
                    style={{ background: z.color, color: '#fff' }}>
                    {z.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold" style={{ color: 'var(--zp-ink)' }}>{z.name}</div>
                    <div className="font-mono text-[11px]" style={{ color: 'var(--zp-ink-3)' }}>
                      {z.capacity} slots
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-mono text-[11px]" style={{ color: 'var(--zp-ink-3)' }}>RWF</span>
                    <input
                      type="text"
                      value={prices[z.id] ?? ''}
                      onChange={e => setPrice(z.id, e.target.value)}
                      placeholder="0"
                      className="w-28 px-3 py-2 font-mono font-semibold text-right rounded-md outline-none"
                      style={{ background: 'var(--zp-surface-2)', border: '1px solid var(--zp-line)', color: 'var(--zp-ink)' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <div className="flex justify-end">
            <button
              onClick={() => {
                const clean = {}
                Object.entries(prices).forEach(([id, v]) => { clean[id] = v === '' ? 0 : Number(v) })
                update('zonePrices', clean)
                toast.success('Prices saved', 'Zone pricing updated')
              }}
              className="px-4 py-2.5 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
              style={{ background: 'var(--zp-primary)', color: '#fff' }}
            >
              Save prices
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/* ── Business Rules — persists ─────────────────────────────── */
function RulesSection() {
  const { settings, update } = useSettings()
  const r = settings.rules

  return (
    <div className="space-y-5">
      <SectionHeader title="Business Rules" desc="Booking and pricing rules. Changes are saved automatically." />

      <Panel title="Toggles" noPadding>
        <Toggle label="Hold spot after kickoff"
          desc="Auto-release a booking after the hold period if not scanned at the gate."
          on={r.holdAfterKickoff}
          onChange={v => update('rules', { holdAfterKickoff: v })} />
        <Toggle label="Early-bird discount"
          desc="10% off when booked more than 24h before kickoff."
          on={r.earlyBirdDiscount}
          onChange={v => update('rules', { earlyBirdDiscount: v })} />
        <Toggle label="Auto-refund on no-show"
          desc="Auto-refund to MoMo if the gate scan never happens."
          on={r.autoRefundNoShow}
          onChange={v => update('rules', { autoRefundNoShow: v })} />
      </Panel>

      <Panel title="Limits">
        <div className="space-y-3">
          <Field label="Max bookings per user · per event">
            <input value={r.maxBookingsPerUser}
              onChange={e => update('rules', { maxBookingsPerUser: e.target.value.replace(/[^0-9]/g, '') })}
              className="w-20 px-3 py-2 font-mono font-semibold text-right rounded-md outline-none"
              style={{ background: 'var(--zp-surface-2)', border: '1px solid var(--zp-line)', color: 'var(--zp-ink)' }} />
          </Field>
          <Field label="Hold period after kickoff (minutes)">
            <input value={r.holdMinutes}
              onChange={e => update('rules', { holdMinutes: e.target.value.replace(/[^0-9]/g, '') })}
              className="w-20 px-3 py-2 font-mono font-semibold text-right rounded-md outline-none"
              style={{ background: 'var(--zp-surface-2)', border: '1px solid var(--zp-line)', color: 'var(--zp-ink)' }} />
          </Field>
        </div>
      </Panel>
    </div>
  )
}

/* ── Languages — real roadmap info ─────────────────────────── */
function LanguagesSection() {
  return (
    <div className="space-y-5">
      <SectionHeader title="Languages" desc="Languages planned for the visitor mobile and web app." />
      <Panel title="Planned languages" noPadding>
        {[
          { code: 'EN', name: 'English' },
          { code: 'RW', name: 'Kinyarwanda' },
          { code: 'FR', name: 'French' },
          { code: 'SW', name: 'Swahili' },
        ].map((l, i) => (
          <div key={l.code} className="px-5 py-3.5 flex items-center gap-4"
            style={{ borderTop: i > 0 ? '1px solid var(--zp-line)' : 'none' }}>
            <span className="font-mono text-[12px] font-bold w-10 px-2 py-1 rounded text-center flex-shrink-0"
              style={{ background: 'var(--zp-primary-soft)', color: 'var(--zp-primary)' }}>{l.code}</span>
            <div className="flex-1 text-[14px] font-semibold" style={{ color: 'var(--zp-ink)' }}>{l.name}</div>
          </div>
        ))}
      </Panel>
      <p className="text-[12px]" style={{ color: 'var(--zp-ink-3)' }}>
        Translation coverage will be tracked here once the mobile app's localisation files are in place.
      </p>
    </div>
  )
}

/* ── Notifications — persists ──────────────────────────────── */
function NotificationsSection() {
  const { settings, update } = useSettings()
  const n = settings.notifications

  return (
    <div className="space-y-5">
      <SectionHeader title="Notifications" desc="Which messages are sent to visitors. Changes are saved automatically." />
      <div className="zp-card px-5 py-3" style={{ background: 'var(--zp-busy-soft)' }}>
        <p className="text-[12px]" style={{ color: 'var(--zp-ink-2)' }}>
          These toggles set the policy. Actual SMS/push delivery starts once the backend and a messaging
          provider are connected.
        </p>
      </div>
      <Panel title="Visitor notifications" noPadding>
        <Toggle label="Booking confirmation" desc="Sent when a booking is created."
          on={n.bookingConfirmation} onChange={v => update('notifications', { bookingConfirmation: v })} />
        <Toggle label="Payment confirmation" desc="Sent when MTN MoMo confirms the payment."
          on={n.paymentConfirmation} onChange={v => update('notifications', { paymentConfirmation: v })} />
        <Toggle label="Kickoff reminder" desc="Sent 2 hours before kickoff with directions and QR."
          on={n.kickoffReminder} onChange={v => update('notifications', { kickoffReminder: v })} />
        <Toggle label="Spot ready" desc="Sent when the visitor's spot becomes available."
          on={n.spotReady} onChange={v => update('notifications', { spotReady: v })} />
        <Toggle label="Refund issued" desc="Sent when an auto-refund is processed to MoMo."
          on={n.refundIssued} onChange={v => update('notifications', { refundIssued: v })} />
      </Panel>
    </div>
  )
}

/* ── MoMo — real status, no fake credentials ───────────────── */
function MoMoSection() {
  return (
    <div className="space-y-5">
      <SectionHeader title="MTN MoMo Integration" desc="Mobile money payments — the payment method for the MVP." />

      <Panel title="Connection status">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--zp-ink-3)' }}></span>
            <div>
              <div className="text-[14px] font-semibold" style={{ color: 'var(--zp-ink)' }}>Not connected</div>
              <div className="font-mono text-[11px]" style={{ color: 'var(--zp-ink-3)' }}>
                Requires a registered TIN and an MTN MoMo merchant account
              </div>
            </div>
          </div>
          <Pill variant="default">Not set up</Pill>
        </div>
      </Panel>

      <Panel title="Credentials">
        <p className="text-[13px]" style={{ color: 'var(--zp-ink-2)' }}>
          MoMo API credentials are not configured yet. They're obtained after company incorporation
          with RDB and an MTN MoMo merchant account is approved. Once Bruno wires the payment service,
          credentials are stored securely server-side — never in the dashboard.
        </p>
        <div className="mt-3 space-y-1.5">
          <DataRow label="Subscription Key" value="Not configured" small />
          <DataRow label="API User ID" value="Not configured" small />
          <DataRow label="Environment" value="Not set" small />
        </div>
      </Panel>

      <Panel title="Compliance">
        <div className="space-y-2">
          <ComplianceRow label="Company incorporation (RDB)" status="pending"
            desc="Required before a MoMo merchant account can be opened." />
          <ComplianceRow label="BNR Payment Service compliance" status="pending"
            desc="Required for transactions over RWF 1M; the API will enforce CDD." />
          <ComplianceRow label="AML/CFT documentation" status="pending"
            desc="Customer Due Diligence template to be reviewed by legal." />
        </div>
      </Panel>
    </div>
  )
}

/* ── Audit Log — honest empty state, no fake entries ───────── */
function AuditSection() {
  return (
    <div className="space-y-5">
      <SectionHeader title="Audit Log" desc="A record of administrative actions, for accountability." />
      <div className="zp-card flex flex-col items-center justify-center text-center py-14 px-6">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--zp-surface-2)' }}>
          <Icons.Shield size={24} style={{ color: 'var(--zp-ink-3)' }} />
        </div>
        <div className="text-[15px] font-semibold" style={{ color: 'var(--zp-ink)' }}>No actions recorded yet</div>
        <p className="text-[12px] mt-1.5 max-w-md" style={{ color: 'var(--zp-ink-2)' }}>
          Administrative actions — pricing changes, refunds, role changes, camera restarts — will be
          logged here once the backend audit service is connected. An audit trail must be recorded
          server-side to be reliable.
        </p>
      </div>
    </div>
  )
}

/* ── Demo Mode — unchanged, real toggle ────────────────────── */
function DemoModeSection() {
  const { demoMode, toggle } = useDemoMode()

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Demo Mode"
        desc="Controls whether the dashboard shows sample data or behaves as the real production system."
      />

      <Panel title="Sample data">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold" style={{ color: 'var(--zp-ink)' }}>
              {demoMode ? 'Demo data is ON' : 'Demo data is OFF'}
            </div>
            <div className="text-[12px] mt-1" style={{ color: 'var(--zp-ink-2)' }}>
              {demoMode
                ? 'The dashboard is filled with sample bookings, occupancy, and revenue for presentations. This data is not real.'
                : 'The dashboard behaves as real production: it shows live data from the backend, or empty states when the backend is not connected.'}
            </div>
          </div>
          <button
            onClick={toggle}
            className="relative w-12 h-7 rounded-full transition-colors flex-shrink-0"
            style={{ background: demoMode ? 'var(--zp-primary)' : 'var(--zp-line)' }}
          >
            <span
              className="absolute top-1 w-5 h-5 rounded-full transition-all"
              style={{
                background: '#fff',
                left: demoMode ? 'calc(100% - 24px)' : '4px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
              }}
            ></span>
          </button>
        </div>
      </Panel>

      <Panel title="When to use which">
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-md" style={{ background: 'var(--zp-primary-soft)' }}>
            <span className="font-bold flex-shrink-0" style={{ color: 'var(--zp-primary)' }}>ON</span>
            <div className="text-[12px]" style={{ color: 'var(--zp-ink-2)' }}>
              <strong style={{ color: 'var(--zp-ink)' }}>Presentations &amp; demos.</strong> Turn this on before showing the dashboard to the team or mentors. Every page looks populated.
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-md" style={{ background: 'var(--zp-surface-2)' }}>
            <span className="font-bold flex-shrink-0" style={{ color: 'var(--zp-ink-3)' }}>OFF</span>
            <div className="text-[12px]" style={{ color: 'var(--zp-ink-2)' }}>
              <strong style={{ color: 'var(--zp-ink)' }}>Real operation.</strong> Leave this off for production. The dashboard shows real data — or honest empty states until the backend is connected.
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Backend status">
        <div className="space-y-1.5">
          <DataRow label="API base URL" value={import.meta.env.VITE_API_BASE || 'http://localhost:8000'} mono small />
          <DataRow label="Connection" value={demoMode ? 'Bypassed (demo data)' : 'Live calls — empty if unreachable'} small />
          <DataRow label="Bookings source" value={demoMode ? 'Sample generator' : 'GET /bookings'} mono small />
        </div>
      </Panel>
    </div>
  )
}

/* ── Shared sub-components ──────────────────────────────────── */
function SectionHeader({ title, desc }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold" style={{ color: 'var(--zp-ink)' }}>{title}</h2>
      <p className="text-[13px] mt-2 max-w-2xl" style={{ color: 'var(--zp-ink-2)' }}>{desc}</p>
    </div>
  )
}

function Field({ label, value, mono, children }) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap py-1">
      <span className="font-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: 'var(--zp-ink-3)' }}>{label}</span>
      {children ? children : (
        <span className={mono ? 'font-mono text-[13px]' : 'text-[13px]'} style={{ color: 'var(--zp-ink)' }}>{value}</span>
      )}
    </div>
  )
}

function EditField({ label, value, onChange, placeholder, style, mono }) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap py-1">
      <span className="font-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: 'var(--zp-ink-3)' }}>{label}</span>
      <input
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`px-3 py-2 text-[13px] rounded-md outline-none w-64 ${mono ? 'font-mono' : ''}`}
        style={style}
      />
    </div>
  )
}

function Toggle({ label, desc, on, onChange }) {
  return (
    <div className="px-5 py-3.5 flex items-center gap-4 flex-wrap" style={{ borderTop: '1px solid var(--zp-line)' }}>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold" style={{ color: 'var(--zp-ink)' }}>{label}</div>
        <div className="text-[12px] mt-1" style={{ color: 'var(--zp-ink-2)' }}>{desc}</div>
      </div>
      <button
        onClick={() => onChange(!on)}
        className="relative w-10 h-6 rounded-full transition-colors flex-shrink-0"
        style={{ background: on ? 'var(--zp-primary)' : 'var(--zp-line)' }}
      >
        <span className="absolute top-1 w-4 h-4 rounded-full transition-all"
          style={{ background: '#fff', left: on ? 'calc(100% - 20px)' : '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}></span>
      </button>
    </div>
  )
}

function ComplianceRow({ label, status, desc }) {
  const colors = { live: 'success', pending: 'warn', na: 'default' }
  return (
    <div className="flex items-start justify-between gap-3 p-3 rounded-md" style={{ background: 'var(--zp-surface-2)' }}>
      <div className="flex-1">
        <div className="text-[13px] font-semibold" style={{ color: 'var(--zp-ink)' }}>{label}</div>
        <div className="text-[11px] mt-0.5" style={{ color: 'var(--zp-ink-2)' }}>{desc}</div>
      </div>
      <Pill variant={colors[status]}>{status}</Pill>
    </div>
  )
}