import React, { useState } from 'react'
import { Panel, Pill, Eyebrow, DataRow } from '../components/ui'
import { Icons } from '../components/Icons'
import { ZONES } from '../lib/constants'
import { useDemoMode } from '../lib/demoMode'

const SECTIONS = [
  { id: 'demo',           label: 'Demo Mode',            icon: 'Refresh' },
  { id: 'organisation',   label: 'Organisation',         icon: 'Stadium' },
  { id: 'pricing',        label: 'Zone Pricing',         icon: 'Chart' },
  { id: 'rules',          label: 'Business Rules',       icon: 'Settings' },
  { id: 'languages',      label: 'Languages',            icon: 'Code' },
  { id: 'notifications',  label: 'Notifications',        icon: 'Bell' },
  { id: 'momo',           label: 'Integrations · MoMo',  icon: 'Receipt' },
  { id: 'audit',          label: 'Audit Log',            icon: 'Shield' },
  { id: 'billing',        label: 'Billing',              icon: 'Receipt' },
]

export default function SettingsView() {
  const [section, setSection] = useState('demo')

  return (
    <div className="fade-in">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left nav */}
        <aside className="md:col-span-3 lg:col-span-3">
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

        {/* Content */}
        <div className="md:col-span-9 lg:col-span-9">
          {section === 'demo' && <DemoModeSection />}
          {section === 'organisation' && <OrganisationSection />}
          {section === 'pricing' && <PricingSection />}
          {section === 'rules' && <RulesSection />}
          {section === 'languages' && <LanguagesSection />}
          {section === 'notifications' && <NotificationsSection />}
          {section === 'momo' && <MoMoSection />}
          {section === 'audit' && <AuditSection />}
          {section === 'billing' && <BillingSection />}
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   Organisation
   ────────────────────────────────────────────────────────────── */
function OrganisationSection() {
  return (
    <div className="space-y-5">
      <SectionHeader title="Organisation" desc="Basic company details, contact info, and stadium partnership." />

      <Panel title="Company">
        <div className="space-y-3">
          <Field label="Legal name" value="Zweho Park Ltd" />
          <Field label="Trading name" value="SmartPark Amahoro" />
          <Field label="Country" value="Rwanda" />
          <Field label="TIN" value="119 234 567 (pending RDB registration)" />
          <Field label="Address" value="CMU-Africa, KG 11 Avenue, Kigali" />
        </div>
      </Panel>

      <Panel title="Stadium partner">
        <div className="space-y-3">
          <Field label="Partner" value="Amahoro National Stadium" />
          <Field label="Concession status" value={<Pill variant="warn">In negotiation</Pill>} />
          <Field label="Liaison" value="Joseph Habimana · stadium-rep role" />
        </div>
      </Panel>

      <Panel title="Branding">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-16 h-16 rounded-md flex items-center justify-center" style={{ background: 'var(--zp-primary)' }}>
            <svg width="32" height="32" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="5" height="5" fill="#F4F0E8"/><rect x="9" y="2" width="5" height="5" fill="#F4F0E8"/>
              <rect x="2" y="9" width="5" height="5" fill="#F4F0E8"/><rect x="9" y="9" width="5" height="5" fill="#F4F0E8"/>
            </svg>
          </div>
          <div>
            <div className="text-[14px] font-semibold" style={{ color: 'var(--zp-ink)' }}>Zweho.Park</div>
            <div className="font-mono text-[11px]" style={{ color: 'var(--zp-ink-3)' }}>Primary: Lake Kivu Blue · Accent: Acacia Gold</div>
          </div>
          <button className="ml-auto px-3 py-2 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
            style={{ background: 'var(--zp-surface-2)', color: 'var(--zp-ink-2)', border: '1px solid var(--zp-line)' }}>
            Upload logo
          </button>
        </div>
      </Panel>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   Zone Pricing
   ────────────────────────────────────────────────────────────── */
function PricingSection() {
  const PRICES = [
    { id: 'A', name: 'North Gate',  price: 2000, walk: '5–8 min',  spots: 60, status: 'busy' },
    { id: 'B', name: 'East Stand',  price: 2500, walk: '3–6 min',  spots: 48, status: 'busy' },
    { id: 'C', name: 'VIP Lot',     price: 5000, walk: '1–3 min',  spots: 24, status: 'full' },
    { id: 'D', name: 'South Gate',  price: 1500, walk: '7–10 min', spots: 72, status: 'free' },
    { id: 'E', name: 'Press / Buses', price: 0,  walk: '4–6 min',  spots: 18, status: 'free' },
  ]

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Zone Pricing"
        desc="Per-zone base prices in RWF. Phase 2 will unlock demand-based dynamic pricing — the hooks are already wired."
      />

      <Panel title="Base prices per zone" noPadding>
        <div>
          {PRICES.map((z, i) => (
            <div key={z.id} className="px-5 py-3 flex items-center gap-4 flex-wrap"
              style={{ borderTop: i > 0 ? '1px solid var(--zp-line)' : 'none' }}>
              <div className="w-10 h-10 rounded-md flex items-center justify-center font-mono font-bold flex-shrink-0"
                style={{
                  background: `var(--zp-${z.status}-soft)`,
                  color: `var(--zp-${z.status})`,
                }}>
                {z.id}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold" style={{ color: 'var(--zp-ink)' }}>{z.name}</div>
                <div className="font-mono text-[11px]" style={{ color: 'var(--zp-ink-3)' }}>{z.spots} spots · {z.walk}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-mono text-[11px]" style={{ color: 'var(--zp-ink-3)' }}>RWF</span>
                <input
                  type="text"
                  defaultValue={z.price.toLocaleString()}
                  className="w-28 px-3 py-2 font-mono font-semibold text-right rounded-md outline-none"
                  style={{ background: 'var(--zp-surface-2)', border: '1px solid var(--zp-line)', color: 'var(--zp-ink)' }}
                />
                <button className="px-2.5 py-2 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
                  style={{ background: 'transparent', color: 'var(--zp-primary)' }}>
                  History
                </button>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="flex justify-end gap-2">
        <button className="px-4 py-2.5 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
          style={{ background: 'var(--zp-surface-2)', color: 'var(--zp-ink-2)', border: '1px solid var(--zp-line)' }}>
          Reset to defaults
        </button>
        <button className="px-4 py-2.5 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
          style={{ background: 'var(--zp-primary)', color: '#fff' }}>
          Save prices
        </button>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   Business Rules
   ────────────────────────────────────────────────────────────── */
function RulesSection() {
  const [rules, setRules] = useState({
    holdAfterKickoff:  true,
    earlyBirdDiscount: true,
    dynamicPricing:    false,
    autoRefundNoShow:  true,
    maxBookingsPerUser: '5',
    holdMinutes: '30',
  })

  return (
    <div className="space-y-5">
      <SectionHeader title="Business Rules" desc="Applied on top of base prices and bookings for every transaction." />

      <Panel title="Toggles" noPadding>
        <Toggle label="Hold spot after kickoff"
          desc="Auto-release booking 30 min after kickoff if not scanned at gate."
          on={rules.holdAfterKickoff}
          onChange={v => setRules({ ...rules, holdAfterKickoff: v })} />
        <Toggle label="Early-bird discount"
          desc="10% off if booked more than 24h before kickoff."
          on={rules.earlyBirdDiscount}
          onChange={v => setRules({ ...rules, earlyBirdDiscount: v })} />
        <Toggle label="Dynamic pricing"
          desc="Phase 2 — adjust price by zone fill rate."
          on={rules.dynamicPricing}
          onChange={v => setRules({ ...rules, dynamicPricing: v })}
          locked />
        <Toggle label="Auto-refund on no-show"
          desc="Auto-refund to MoMo if the gate scan never happens."
          on={rules.autoRefundNoShow}
          onChange={v => setRules({ ...rules, autoRefundNoShow: v })} />
      </Panel>

      <Panel title="Limits">
        <div className="space-y-3">
          <Field label="Max bookings per user · per event">
            <input value={rules.maxBookingsPerUser} onChange={e => setRules({ ...rules, maxBookingsPerUser: e.target.value })}
              className="w-20 px-3 py-2 font-mono font-semibold text-right rounded-md outline-none"
              style={{ background: 'var(--zp-surface-2)', border: '1px solid var(--zp-line)', color: 'var(--zp-ink)' }} />
          </Field>
          <Field label="Hold period after kickoff (minutes)">
            <input value={rules.holdMinutes} onChange={e => setRules({ ...rules, holdMinutes: e.target.value })}
              className="w-20 px-3 py-2 font-mono font-semibold text-right rounded-md outline-none"
              style={{ background: 'var(--zp-surface-2)', border: '1px solid var(--zp-line)', color: 'var(--zp-ink)' }} />
          </Field>
        </div>
      </Panel>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   Languages
   ────────────────────────────────────────────────────────────── */
function LanguagesSection() {
  return (
    <div className="space-y-5">
      <SectionHeader title="Languages" desc="Available languages for the visitor mobile/web app." />

      <Panel title="Supported languages" noPadding>
        {[
          { code: 'EN', name: 'English',     status: 'live',     coverage: 100 },
          { code: 'RW', name: 'Kinyarwanda', status: 'live',     coverage: 95 },
          { code: 'FR', name: 'French',      status: 'live',     coverage: 85 },
          { code: 'SW', name: 'Swahili',     status: 'phase-2',  coverage: 0 },
        ].map((l, i) => (
          <div key={l.code} className="px-5 py-3.5 flex items-center gap-4 flex-wrap"
            style={{ borderTop: i > 0 ? '1px solid var(--zp-line)' : 'none' }}>
            <span className="font-mono text-[12px] font-bold w-10 px-2 py-1 rounded text-center flex-shrink-0"
              style={{ background: 'var(--zp-primary-soft)', color: 'var(--zp-primary)' }}>{l.code}</span>
            <div className="flex-1">
              <div className="text-[14px] font-semibold" style={{ color: 'var(--zp-ink)' }}>{l.name}</div>
              <div className="font-mono text-[11px]" style={{ color: 'var(--zp-ink-3)' }}>Translation coverage: {l.coverage}%</div>
            </div>
            <Pill variant={l.status === 'live' ? 'success' : 'default'}>{l.status}</Pill>
          </div>
        ))}
      </Panel>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   Notifications
   ────────────────────────────────────────────────────────────── */
function NotificationsSection() {
  const [notifs, setNotifs] = useState({
    bookingConfirmation: true,
    paymentConfirmation: true,
    kickoffReminder: true,
    spotReady: true,
    refundIssued: true,
  })

  return (
    <div className="space-y-5">
      <SectionHeader title="Notifications" desc="Which messages get sent to visitors automatically." />

      <Panel title="Visitor notifications · SMS / Push" noPadding>
        <Toggle label="Booking confirmation"
          desc="Sent immediately when a booking is created."
          on={notifs.bookingConfirmation}
          onChange={v => setNotifs({ ...notifs, bookingConfirmation: v })} />
        <Toggle label="Payment confirmation"
          desc="Sent when MTN MoMo confirms the payment."
          on={notifs.paymentConfirmation}
          onChange={v => setNotifs({ ...notifs, paymentConfirmation: v })} />
        <Toggle label="Kickoff reminder"
          desc="Sent 2 hours before kickoff with directions and QR."
          on={notifs.kickoffReminder}
          onChange={v => setNotifs({ ...notifs, kickoffReminder: v })} />
        <Toggle label="Spot ready"
          desc="Sent when the visitor's spot becomes available (after gate scan)."
          on={notifs.spotReady}
          onChange={v => setNotifs({ ...notifs, spotReady: v })} />
        <Toggle label="Refund issued"
          desc="Sent when an auto-refund is processed to MoMo."
          on={notifs.refundIssued}
          onChange={v => setNotifs({ ...notifs, refundIssued: v })} />
      </Panel>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   MoMo Integration
   ────────────────────────────────────────────────────────────── */
function MoMoSection() {
  return (
    <div className="space-y-5">
      <SectionHeader title="MTN MoMo Integration" desc="Mobile money payments — the only payment method for MVP." />

      <Panel title="Connection status">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full zp-pulse-dot" style={{ background: 'var(--zp-busy)' }}></span>
            <div>
              <div className="text-[14px] font-semibold" style={{ color: 'var(--zp-ink)' }}>Sandbox · Test environment</div>
              <div className="font-mono text-[11px]" style={{ color: 'var(--zp-ink-3)' }}>Production credentials pending company registration with RDB</div>
            </div>
          </div>
          <Pill variant="warn">Sandbox</Pill>
        </div>
      </Panel>

      <Panel title="Credentials">
        <div className="space-y-3">
          <Field label="Subscription Key" value="••••••••••••••••" mono />
          <Field label="API User ID" value="zweho-prod-9482" mono />
          <Field label="Target Environment" value="sandbox" mono />
          <Field label="Callback URL" value="https://api.zwehopark.rw/payments/callback" mono />
        </div>
        <div className="flex gap-2 mt-4">
          <button className="px-3 py-2 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
            style={{ background: 'var(--zp-surface-2)', color: 'var(--zp-ink-2)', border: '1px solid var(--zp-line)' }}>
            Test connection
          </button>
          <button className="px-3 py-2 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
            style={{ background: 'var(--zp-primary)', color: '#fff' }}>
            Rotate credentials
          </button>
        </div>
      </Panel>

      <Panel title="Compliance">
        <div className="space-y-2">
          <ComplianceRow label="BNR Payment Service compliance" status="pending" desc="Required for transactions over RWF 1M. Bruno's API enforces CDD." />
          <ComplianceRow label="AML/CFT documentation" status="pending" desc="Customer Due Diligence template ready for legal review." />
          <ComplianceRow label="PCI-DSS scope" status="na" desc="N/A — we don't handle card data directly, MoMo is the processor." />
        </div>
      </Panel>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   Audit Log
   ────────────────────────────────────────────────────────────── */
function AuditSection() {
  const LOGS = [
    { time: '14:32:08', actor: 'Nouba-Asra',    action: 'Updated Zone C pricing', detail: '4,000 → 5,000 RWF' },
    { time: '14:21:50', actor: 'Emile M.',      action: 'Annotated camera CAM_NORTH_01', detail: '60 polygons saved' },
    { time: '13:08:22', actor: 'Bruno P.',      action: 'Refunded booking', detail: 'BK-2789 · 2,000 RWF' },
    { time: '12:44:11', actor: 'Daniel K.',     action: 'Manual QR lookup', detail: 'BK-2754 · damaged QR' },
    { time: '11:30:00', actor: 'System',        action: 'Auto-refund issued',  detail: 'BK-2741 · no-show' },
    { time: '10:15:34', actor: 'Simeon H.',     action: 'Restarted CAM_VIP_03', detail: 'High latency · 218ms' },
    { time: '09:02:18', actor: 'Hafiz A.',      action: 'Updated CV model',    detail: 'v0.4 → v0.5 · +1.2pp accuracy' },
  ]

  return (
    <div className="space-y-5">
      <SectionHeader title="Audit Log" desc="Every administrative action is recorded here for accountability." />

      <Panel title="Recent actions" noPadding>
        <div>
          {LOGS.map((l, i) => (
            <div key={i} className="px-5 py-3 flex items-center gap-4 flex-wrap"
              style={{ borderTop: i > 0 ? '1px solid var(--zp-line)' : 'none' }}>
              <span className="font-mono text-[11px] tabular-nums w-16 flex-shrink-0" style={{ color: 'var(--zp-ink-3)' }}>{l.time}</span>
              <span className="text-[12px] font-semibold w-28 flex-shrink-0" style={{ color: 'var(--zp-primary)' }}>{l.actor}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px]" style={{ color: 'var(--zp-ink)' }}>{l.action}</div>
                <div className="font-mono text-[11px] mt-0.5" style={{ color: 'var(--zp-ink-3)' }}>{l.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   Billing
   ────────────────────────────────────────────────────────────── */
function BillingSection() {
  return (
    <div className="space-y-5">
      <SectionHeader title="Billing" desc="Infrastructure and service costs for Zweho Park's operations." />

      <Panel title="Monthly costs · May 2026">
        <div className="space-y-2">
          <BillRow item="Hetzner VPS (Falkenstein)" cost="38.00" unit="USD" />
          <BillRow item="MTN MoMo · per transaction" cost="0.8%" unit="of value" />
          <BillRow item="Vercel hosting · dashboard" cost="0.00" unit="USD (hobby)" />
          <BillRow item="Domain · zwehopark.rw" cost="3.50" unit="USD" />
          <BillRow item="SSL certificates" cost="0.00" unit="USD (Let's Encrypt)" />
          <BillRow item="GitHub" cost="0.00" unit="USD (free tier)" />
          <div className="pt-3" style={{ borderTop: '1px solid var(--zp-line)' }}>
            <BillRow item="Total monthly" cost="41.50" unit="USD" bold />
          </div>
        </div>
      </Panel>

      <Panel title="One-time hardware (per tech spec)">
        <div className="space-y-2">
          <BillRow item="3× IP cameras (PoE, 4MP)" cost="900" unit="USD" />
          <BillRow item="3× Jetson Orin Nano (edge devices)" cost="450" unit="USD" />
          <BillRow item="Networking · PoE switch + cabling" cost="150" unit="USD" />
          <BillRow item="Tablet for gate staff" cost="150" unit="USD" />
          <div className="pt-3" style={{ borderTop: '1px solid var(--zp-line)' }}>
            <BillRow item="Total hardware" cost="1,650" unit="USD" bold />
          </div>
        </div>
      </Panel>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   Demo Mode
   ────────────────────────────────────────────────────────────── */
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
              <strong style={{ color: 'var(--zp-ink)' }}>Presentations & demos.</strong> Turn this on before showing the dashboard to the team, mentors, or in a pitch. Every page looks populated and alive.
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-md" style={{ background: 'var(--zp-surface-2)' }}>
            <span className="font-bold flex-shrink-0" style={{ color: 'var(--zp-ink-3)' }}>OFF</span>
            <div className="text-[12px]" style={{ color: 'var(--zp-ink-2)' }}>
              <strong style={{ color: 'var(--zp-ink)' }}>Real operation.</strong> Leave this off for production. The dashboard shows real data from Bruno's backend — or honest empty states until it is connected.
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

/* ──────────────────────────────────────────────────────────────
   Shared sub-components
   ────────────────────────────────────────────────────────────── */
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

function Toggle({ label, desc, on, onChange, locked }) {
  return (
    <div className="px-5 py-3.5 flex items-center gap-4 flex-wrap"
      style={{ borderTop: '1px solid var(--zp-line)' }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-[14px] font-semibold" style={{ color: 'var(--zp-ink)' }}>{label}</div>
          {locked && <Pill variant="default">phase 2</Pill>}
        </div>
        <div className="text-[12px] mt-1" style={{ color: 'var(--zp-ink-2)' }}>{desc}</div>
      </div>
      <button
        onClick={() => !locked && onChange(!on)}
        disabled={locked}
        className="relative w-10 h-6 rounded-full transition-colors flex-shrink-0"
        style={{
          background: locked ? 'var(--zp-line-2)' : on ? 'var(--zp-primary)' : 'var(--zp-line)',
          opacity: locked ? 0.5 : 1,
          cursor: locked ? 'not-allowed' : 'pointer',
        }}
      >
        <span className="absolute top-1 w-4 h-4 rounded-full transition-all"
          style={{
            background: '#fff',
            left: on ? 'calc(100% - 20px)' : '4px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}></span>
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

function BillRow({ item, cost, unit, bold }) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? 'text-[14px] font-semibold' : 'text-[13px]'} style={{ color: 'var(--zp-ink)' }}>{item}</span>
      <span className="flex items-center gap-2">
        <span className={`font-mono ${bold ? 'text-[16px] font-bold' : 'text-[13px] font-semibold'}`} style={{ color: 'var(--zp-ink)' }}>{cost}</span>
        <span className="font-mono text-[11px]" style={{ color: 'var(--zp-ink-3)' }}>{unit}</span>
      </span>
    </div>
  )
}