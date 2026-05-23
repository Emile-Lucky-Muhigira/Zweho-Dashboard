import React, { useState } from 'react'
import { Panel, Pill, Eyebrow } from '../components/ui'
import { useToast } from '../lib/toast'

export default function ScannerView() {
  const toast = useToast()
  const [lastScan] = useState({ id: 'BK-2841', valid: true, time: '14:22:54', spot: 'A-14', plate: 'RAB 472 G' })
  const [recentScans] = useState([
    { id: 'BK-2841', valid: true,  time: '14:22:54', gate: 'North' },
    { id: 'BK-2839', valid: true,  time: '14:21:30', gate: 'South' },
    { id: 'BK-2838', valid: false, time: '14:19:12', gate: 'North', reason: 'Already used' },
    { id: 'BK-2836', valid: true,  time: '14:18:01', gate: 'North' },
    { id: 'BK-2834', valid: true,  time: '14:16:45', gate: 'East' },
  ])

  return (
    <div className="space-y-5 fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
        {/* Left — camera viewport + result */}
        <div className="lg:col-span-7 space-y-4">
          <Panel
            title="Gate Scanner · North Gate"
            subtitle="Tablet Mode · Staff: Daniel K."
            action={<Pill variant="success">Online · {recentScans.length} today</Pill>}
          >
            {/* Camera viewport — keep dark for that camera-feed feel */}
            <div className="zp-map-surface relative aspect-video rounded-md overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-72 h-72">
                  {/* Corner brackets */}
                  <div className="absolute top-0 left-0 w-14 h-14" style={{ borderTop: '2px solid var(--zp-accent)', borderLeft: '2px solid var(--zp-accent)' }}></div>
                  <div className="absolute top-0 right-0 w-14 h-14" style={{ borderTop: '2px solid var(--zp-accent)', borderRight: '2px solid var(--zp-accent)' }}></div>
                  <div className="absolute bottom-0 left-0 w-14 h-14" style={{ borderBottom: '2px solid var(--zp-accent)', borderLeft: '2px solid var(--zp-accent)' }}></div>
                  <div className="absolute bottom-0 right-0 w-14 h-14" style={{ borderBottom: '2px solid var(--zp-accent)', borderRight: '2px solid var(--zp-accent)' }}></div>

                  {/* Scanning line */}
                  <div
                    className="absolute left-0 right-0"
                    style={{
                      height: 2,
                      top: '50%',
                      background: 'linear-gradient(90deg, transparent, var(--zp-accent), transparent)',
                      boxShadow: '0 0 18px var(--zp-accent)',
                    }}
                  ></div>

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="font-mono text-[11px] uppercase tracking-[0.2em] font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>Awaiting QR</div>
                      <div className="font-display text-3xl mt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>⌗</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* HUD */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.18em] flex items-center gap-2 font-semibold" style={{ color: 'var(--zp-free)' }}>
                    <span className="w-1.5 h-1.5 rounded-full blink" style={{ background: 'var(--zp-free)' }}></span>
                    Rec · 1080p
                  </div>
                  <div className="font-mono text-[11px] mt-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>CAM_NORTH_01 · 30fps</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>14:23:47 CAT</div>
                  <div className="font-mono text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Latency 142ms</div>
                </div>
              </div>

              <div className="absolute bottom-4 left-4 right-4 flex justify-between font-mono text-[10px] uppercase tracking-[0.18em] pointer-events-none font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>
                <span>Distance: hold QR 15–30cm from camera</span>
                <span>Auto-detect: ON</span>
              </div>
            </div>
          </Panel>

          {/* Big result feedback */}
          <div
            className="rounded-md p-5 md:p-6"
            style={{
              background: lastScan.valid ? 'var(--zp-free-soft)' : 'var(--zp-full-soft)',
              border: '2px solid ' + (lastScan.valid ? 'var(--zp-free)' : 'var(--zp-full)'),
            }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ background: lastScan.valid ? 'var(--zp-free)' : 'var(--zp-full)', color: '#fff' }}
                >
                  <span className="text-4xl">{lastScan.valid ? '✓' : '✗'}</span>
                </div>
                <div>
                  <div
                    className="font-display text-4xl font-medium leading-none"
                    style={{ color: lastScan.valid ? 'var(--zp-free)' : 'var(--zp-full)' }}
                  >
                    {lastScan.valid ? 'GRANTED' : 'DENIED'}
                  </div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.18em] mt-1.5" style={{ color: 'var(--zp-ink-2)' }}>
                    Last scan · {lastScan.time}
                  </div>
                </div>
              </div>
              <div className="text-left sm:text-right space-y-0.5">
                <div className="font-mono text-base font-semibold" style={{ color: 'var(--zp-ink)' }}>{lastScan.id}</div>
                <div className="font-mono text-[13px]" style={{ color: 'var(--zp-ink-2)' }}>Spot {lastScan.spot}</div>
                <div className="font-mono text-[13px]" style={{ color: 'var(--zp-ink-2)' }}>{lastScan.plate}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-5 space-y-4">
          <Panel title="Recent Scans" subtitle="This shift">
            <div className="space-y-1.5">
              {recentScans.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-md"
                  style={{ background: s.valid ? 'transparent' : 'var(--zp-full-soft)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-md flex items-center justify-center text-base font-semibold flex-shrink-0"
                      style={{
                        background: s.valid ? 'var(--zp-free-soft)' : 'var(--zp-full-soft)',
                        color: s.valid ? 'var(--zp-free)' : 'var(--zp-full)',
                      }}
                    >
                      {s.valid ? '✓' : '✗'}
                    </div>
                    <div>
                      <div className="font-mono text-[13px] font-semibold" style={{ color: 'var(--zp-ink)' }}>{s.id}</div>
                      <div className="font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color: 'var(--zp-ink-3)' }}>
                        {s.gate} gate · {s.time}
                      </div>
                    </div>
                  </div>
                  {!s.valid && <Pill variant="danger">{s.reason}</Pill>}
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Shift Summary">
            <div className="grid grid-cols-2 gap-3">
              <SummaryStat label="Granted"          value="38"  color="var(--zp-free)" />
              <SummaryStat label="Denied"           value="2"   color="var(--zp-full)" />
              <SummaryStat label="Queue (offline)"  value="0"   color="var(--zp-busy)" />
              <SummaryStat label="Avg scan time"    value="1.4" unit="s" color="var(--zp-ink)" />
            </div>
          </Panel>

          <Panel title="Manual Lookup" subtitle="If scanner fails">
            <div className="flex gap-2">
              <input
                placeholder="BK-XXXX or phone"
                className="flex-1 px-3 py-2.5 text-[13px] font-mono outline-none rounded-md"
                style={{
                  background: 'var(--zp-surface-2)',
                  border: '1px solid var(--zp-line)',
                  color: 'var(--zp-ink)',
                }}
              />
              <button
                className="px-4 py-2.5 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
                style={{ background: 'var(--zp-primary)', color: '#fff' }}
              >
                Verify
              </button>
            </div>
            <div className="mt-2.5 font-mono text-[11px] leading-relaxed" style={{ color: 'var(--zp-ink-3)' }}>
              Use only if QR is damaged or unreadable. All manual entries are logged with staff ID.
            </div>

            {/* Test buttons for the prototype */}
            <div className="mt-3 pt-3 flex gap-2" style={{ borderTop: '1px solid var(--zp-line)' }}>
              <button
                onClick={() => toast.success('Access granted', 'BK-2847 · Spot A-14 · RAB 472 G')}
                className="flex-1 px-3 py-2 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
                style={{ background: 'var(--zp-free-soft)', color: 'var(--zp-free)', border: '1px solid color-mix(in srgb, var(--zp-free) 30%, transparent)' }}
              >
                ✓ Test granted
              </button>
              <button
                onClick={() => toast.error('Access denied', 'BK-2838 · Already used at 14:19')}
                className="flex-1 px-3 py-2 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
                style={{ background: 'var(--zp-full-soft)', color: 'var(--zp-full)', border: '1px solid color-mix(in srgb, var(--zp-full) 30%, transparent)' }}
              >
                ✗ Test denied
              </button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}

function SummaryStat({ label, value, unit, color }) {
  return (
    <div className="rounded-md p-4" style={{ border: '1px solid var(--zp-line)' }}>
      <div className="font-mono text-[11px] uppercase tracking-[0.16em] font-semibold" style={{ color: 'var(--zp-ink-3)' }}>{label}</div>
      <div className="font-mono text-3xl mt-1.5 leading-none font-bold" style={{ color }}>
        {value}{unit && <span className="text-base font-normal">{unit}</span>}
      </div>
    </div>
  )
}