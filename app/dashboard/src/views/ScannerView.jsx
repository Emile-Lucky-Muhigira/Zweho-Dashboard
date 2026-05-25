import React, { useState } from 'react'
import { Panel, Pill, Eyebrow } from '../components/ui'
import { useToast } from '../lib/toast'
import { Icons } from '../components/Icons'
import { useDemoMode } from '../lib/demoMode'

// Sample tickets — used ONLY when Demo Mode is ON, for previews.
const SAMPLE_QUEUE = [
  { id: 'BK-2841', valid: true,  plate: 'RAB 472 G', zone: 'A', spot: 'A-14', zoneName: 'North Gate', paid: true,  time: '14:22:54' },
  { id: 'BK-2839', valid: true,  plate: 'RAC 118 K', zone: 'D', spot: 'D-31', zoneName: 'South Gate', paid: true,  time: '14:21:30' },
  { id: 'BK-2838', valid: false, plate: 'RAD 905 B', zone: '—', spot: '—',    zoneName: '—',          paid: false, time: '14:19:12', reason: 'Ticket already used at 14:05' },
]

export default function ScannerView() {
  const toast = useToast()
  const { demoMode } = useDemoMode()

  // current = the scanned ticket on display. null = waiting.
  const [current, setCurrent] = useState(null)
  const [queueIndex, setQueueIndex] = useState(0)

  // Demo-only: cycle through sample tickets.
  const demoNext = () => {
    const next = (queueIndex) % SAMPLE_QUEUE.length
    setQueueIndex(next + 1)
    setCurrent(SAMPLE_QUEUE[next])
  }

  const clearTicket = () => {
    setCurrent(null)
    toast.info('Ready', 'Waiting for next scan')
  }

  return (
    <div className="space-y-5 fade-in">
      {/* Context banner */}
      <div className="zp-card px-5 py-3 flex items-center gap-3 flex-wrap">
        <span className="w-1.5 h-1.5 rounded-full zp-pulse-dot" style={{ background: 'var(--zp-free)' }}></span>
        <span className="text-[12px]" style={{ color: 'var(--zp-ink-2)' }}>
          Scans come from the standalone gate scanner app. This screen shows the operator the details of each scanned ticket in real time.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
        {/* LEFT — scanner feed + manual lookup */}
        <div className="lg:col-span-6 space-y-4">
          <Panel
            title="Gate Scanner · North Gate"
            subtitle="Live feed from scanner app"
            action={<Pill variant={demoMode ? 'success' : 'default'}>{demoMode ? 'Connected' : 'Awaiting backend'}</Pill>}
          >
            <div className="zp-map-surface relative aspect-video rounded-md overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-64 h-64">
                  <div className="absolute top-0 left-0 w-12 h-12" style={{ borderTop: '2px solid var(--zp-accent)', borderLeft: '2px solid var(--zp-accent)' }}></div>
                  <div className="absolute top-0 right-0 w-12 h-12" style={{ borderTop: '2px solid var(--zp-accent)', borderRight: '2px solid var(--zp-accent)' }}></div>
                  <div className="absolute bottom-0 left-0 w-12 h-12" style={{ borderBottom: '2px solid var(--zp-accent)', borderLeft: '2px solid var(--zp-accent)' }}></div>
                  <div className="absolute bottom-0 right-0 w-12 h-12" style={{ borderBottom: '2px solid var(--zp-accent)', borderRight: '2px solid var(--zp-accent)' }}></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="font-mono text-[11px] uppercase tracking-[0.2em] font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>Scanner feed</div>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4 font-mono text-[10px] uppercase tracking-[0.16em] font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Operator scans with the handheld app — results appear here
              </div>
            </div>
          </Panel>

          <Panel title="Manual Lookup" subtitle="If a QR is damaged">
            <div className="flex gap-2">
              <input
                placeholder="BK-XXXX or phone number"
                className="flex-1 px-3 py-2.5 text-[13px] font-mono outline-none rounded-md"
                style={{ background: 'var(--zp-surface-2)', border: '1px solid var(--zp-line)', color: 'var(--zp-ink)' }}
              />
              <button
                onClick={() => toast.info('Lookup', 'Connects to the backend when live')}
                className="px-4 py-2.5 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
                style={{ background: 'var(--zp-primary)', color: '#fff' }}
              >
                Verify
              </button>
            </div>
            <div className="mt-2.5 font-mono text-[11px] leading-relaxed" style={{ color: 'var(--zp-ink-3)' }}>
              Use only if the QR code is damaged or unreadable. All manual entries are logged with the operator's ID.
            </div>

            {/* Test buttons — Demo Mode only */}
            {demoMode && (
              <div className="mt-3 pt-3 flex gap-2" style={{ borderTop: '1px solid var(--zp-line)' }}>
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] self-center" style={{ color: 'var(--zp-ink-3)' }}>Demo</span>
                <button
                  onClick={() => { setCurrent(SAMPLE_QUEUE[0]) }}
                  className="flex-1 px-3 py-2 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
                  style={{ background: 'var(--zp-free-soft)', color: 'var(--zp-free)', border: '1px solid color-mix(in srgb, var(--zp-free) 30%, transparent)' }}
                >
                  Test valid scan
                </button>
                <button
                  onClick={() => { setCurrent(SAMPLE_QUEUE[2]) }}
                  className="flex-1 px-3 py-2 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
                  style={{ background: 'var(--zp-full-soft)', color: 'var(--zp-full)', border: '1px solid color-mix(in srgb, var(--zp-full) 30%, transparent)' }}
                >
                  Test invalid scan
                </button>
              </div>
            )}
          </Panel>
        </div>

        {/* RIGHT — scanned ticket / waiting */}
        <div className="lg:col-span-6">
          {current
            ? <TicketPanel ticket={current} onNext={demoMode ? demoNext : clearTicket} demoMode={demoMode} />
            : <WaitingPanel demoMode={demoMode} />}
        </div>
      </div>
    </div>
  )
}

/* ── Waiting state — real, no scan yet ─────────────────────── */
function WaitingPanel({ demoMode }) {
  return (
    <div className="zp-card h-full flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--zp-surface-2)' }}>
        <Icons.QrCode size={28} style={{ color: 'var(--zp-ink-3)' }} />
      </div>
      <div className="font-display text-xl" style={{ color: 'var(--zp-ink)' }}>Waiting for next scan</div>
      <p className="text-[12px] mt-2 max-w-xs" style={{ color: 'var(--zp-ink-2)' }}>
        {demoMode
          ? 'Demo mode is on. Use the test buttons under Manual Lookup to preview a scan.'
          : 'When the gate operator scans a ticket with the scanner app, the visitor\u2019s details will appear here automatically.'}
      </p>
      <div className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: 'var(--zp-ink-3)' }}>
        <span className="w-1.5 h-1.5 rounded-full blink" style={{ background: demoMode ? 'var(--zp-free)' : 'var(--zp-ink-3)' }}></span>
        {demoMode ? 'Listening (demo)' : 'Listening for scans'}
      </div>
    </div>
  )
}

/* ── Scanned ticket ────────────────────────────────────────── */
function TicketPanel({ ticket, onNext, demoMode }) {
  const valid = ticket.valid
  return (
    <div className="rounded-md overflow-hidden" style={{ border: '2px solid ' + (valid ? 'var(--zp-free)' : 'var(--zp-full)') }}>
      <div className="px-5 py-4 flex items-center gap-4" style={{ background: valid ? 'var(--zp-free-soft)' : 'var(--zp-full-soft)' }}>
        <div className="w-14 h-14 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: valid ? 'var(--zp-free)' : 'var(--zp-full)', color: '#fff' }}>
          <span className="text-3xl">{valid ? '✓' : '✗'}</span>
        </div>
        <div>
          <div className="font-display text-3xl leading-none" style={{ color: valid ? 'var(--zp-free)' : 'var(--zp-full)' }}>
            {valid ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
          </div>
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] mt-1.5" style={{ color: 'var(--zp-ink-2)' }}>
            {ticket.id} · scanned {ticket.time}
          </div>
        </div>
      </div>

      <div className="p-5" style={{ background: 'var(--zp-surface)' }}>
        {valid ? (
          <>
            <div className="text-center py-2">
              <div className="font-display text-2xl" style={{ color: 'var(--zp-ink)' }}>Welcome to Amahoro</div>
              <div className="text-[13px] mt-1" style={{ color: 'var(--zp-ink-2)' }}>Please direct this vehicle to their reserved slot.</div>
            </div>
            <div className="mt-4 rounded-md p-4 text-center" style={{ background: 'var(--zp-primary-soft)' }}>
              <Eyebrow>Direct visitor to</Eyebrow>
              <div className="font-mono text-4xl font-bold mt-1" style={{ color: 'var(--zp-primary)' }}>{ticket.spot}</div>
              <div className="text-[13px] mt-1" style={{ color: 'var(--zp-ink-2)' }}>Zone {ticket.zone} · {ticket.zoneName}</div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <DetailTile label="Plate number" value={ticket.plate} />
              <DetailTile label="Payment" value={ticket.paid ? 'Paid' : 'Not paid'} tone={ticket.paid ? 'free' : 'full'} />
            </div>
          </>
        ) : (
          <>
            <div className="text-center py-3">
              <div className="font-display text-2xl" style={{ color: 'var(--zp-full)' }}>Do not admit</div>
              <div className="text-[13px] mt-1" style={{ color: 'var(--zp-ink-2)' }}>{ticket.reason}</div>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3">
              <DetailTile label="Plate number" value={ticket.plate} />
            </div>
            <div className="mt-3 p-3 rounded-md text-[12px]" style={{ background: 'var(--zp-full-soft)', color: 'var(--zp-ink-2)' }}>
              Ask the visitor to contact the booking desk or rebook via the app.
            </div>
          </>
        )}

        <button
          onClick={onNext}
          className="w-full mt-5 py-3 text-[13px] font-mono uppercase tracking-[0.16em] rounded-md font-bold flex items-center justify-center gap-2"
          style={{ background: 'var(--zp-primary)', color: '#fff' }}
        >
          {demoMode ? 'Next visitor (demo)' : 'Next visitor'}
          <Icons.ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

function DetailTile({ label, value, tone }) {
  const colorMap = { free: 'var(--zp-free)', full: 'var(--zp-full)' }
  return (
    <div className="rounded-md p-3" style={{ border: '1px solid var(--zp-line)' }}>
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] font-semibold" style={{ color: 'var(--zp-ink-3)' }}>{label}</div>
      <div className="font-mono text-[16px] font-bold mt-1" style={{ color: colorMap[tone] || 'var(--zp-ink)' }}>{value}</div>
    </div>
  )
}