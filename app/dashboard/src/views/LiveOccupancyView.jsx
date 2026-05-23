import React, { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getOccupancy } from '../lib/api'
import { ZONES, OCCUPANCY_REFRESH_MS, CV_CONFIDENCE_THRESHOLD } from '../lib/constants'
import { generatePlate } from '../lib/mockData'
import { Panel, MetricCard, Pill, LegendDot, DataRow, Eyebrow } from '../components/ui'

export default function LiveOccupancyView() {
  const [selectedSpot, setSelectedSpot] = useState(null)
  const [selectedZone, setSelectedZone] = useState('all')

  const { data: rawSpots = [] } = useQuery({
    queryKey: ['occupancy'],
    queryFn: getOccupancy,
    refetchInterval: OCCUPANCY_REFRESH_MS,
  })

  const [spots, setSpots] = useState([])
  useEffect(() => { setSpots(rawSpots) }, [rawSpots])

  useEffect(() => {
    const id = setInterval(() => {
      setSpots(prev => {
        if (!prev.length) return prev
        const next = [...prev]
        const idx = Math.floor(Math.random() * next.length)
        const cur = next[idx]
        if (cur.status === 'occupied') next[idx] = { ...cur, status: 'free', plate: null, lastUpdate: Date.now() }
        else if (cur.status === 'free') next[idx] = { ...cur, status: 'occupied', plate: generatePlate(), lastUpdate: Date.now() }
        return next
      })
    }, 4000)
    return () => clearInterval(id)
  }, [])

  const stats = useMemo(() => {
    const total = spots.length
    const occupied = spots.filter(s => s.status === 'occupied').length
    const free = spots.filter(s => s.status === 'free').length
    const reserved = spots.filter(s => s.status === 'reserved').length
    const lowConf = spots.filter(s => s.confidence < CV_CONFIDENCE_THRESHOLD && s.status !== 'offline').length
    return { total, occupied, free, reserved, lowConf, pct: total ? Math.round((occupied / total) * 100) : 0 }
  }, [spots])

  const zoneStats = ZONES.map(z => {
    const zs = spots.filter(s => s.zone === z.id)
    const occ = zs.filter(s => s.status === 'occupied').length
    return { ...z, occupied: occ, total: zs.length, pct: zs.length ? (occ / zs.length) * 100 : 0 }
  })

  const filteredSpots = selectedZone === 'all' ? spots : spots.filter(s => s.zone === selectedZone)

  return (
    <div className="space-y-5 fade-in">
      <LiveTicker spots={spots} />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <MetricCard label="Total Occupancy" value={stats.pct} unit="%" delta="+8% / hr" tone="busy" />
        <MetricCard label="Occupied" value={stats.occupied} unit={`/ ${stats.total}`} tone="info" />
        <MetricCard label="Available" value={stats.free} tone="free" />
        <MetricCard label="Reserved" value={stats.reserved} tone="info" />
        <MetricCard label="CV Warnings" value={stats.lowConf} unit="low conf" tone="full" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
        <div className="lg:col-span-8">
          <Panel
            title="Stadium Parking Map"
            subtitle="Amahoro · Live MQTT feed"
            action={
              <div className="flex items-center gap-1 flex-wrap">
                <ZoneButton zone="all" selected={selectedZone === 'all'} onClick={() => setSelectedZone('all')}>All</ZoneButton>
                {ZONES.map(z => (
                  <ZoneButton key={z.id} zone={z.id} selected={selectedZone === z.id} onClick={() => setSelectedZone(z.id)}>
                    Zone {z.id}
                  </ZoneButton>
                ))}
              </div>
            }
          >
            <div className="zp-map-surface relative rounded-md p-6 overflow-hidden">
              <div className="absolute top-3 right-3 flex flex-col items-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <div className="font-mono text-[10px] font-bold">N</div>
                <div className="w-px h-3" style={{ background: 'var(--zp-accent)' }}></div>
                <div className="w-1 h-1 rounded-full" style={{ background: 'var(--zp-accent)' }}></div>
              </div>

              <div className="relative h-[460px] flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className="w-[280px] h-[170px] rounded-[50%] flex items-center justify-center"
                    style={{ border: '2px solid var(--zp-accent)' }}
                  >
                    <div className="text-center">
                      <div className="font-display text-lg" style={{ color: 'rgba(255,255,255,0.85)' }}>AMAHORO STADIUM</div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.24em] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Capacity 30,000</div>
                    </div>
                  </div>
                </div>

                <ZoneCluster spots={filteredSpots.filter(s => s.zone === 'A')} zoneId="A"
                  position="absolute top-0 left-1/2 -translate-x-1/2" onSpotClick={setSelectedSpot} />
                <ZoneCluster spots={filteredSpots.filter(s => s.zone === 'B')} zoneId="B"
                  position="absolute right-0 top-1/2 -translate-y-1/2" onSpotClick={setSelectedSpot} />
                <ZoneCluster spots={filteredSpots.filter(s => s.zone === 'C')} zoneId="C"
                  position="absolute left-0 top-0" onSpotClick={setSelectedSpot} />
                <ZoneCluster spots={filteredSpots.filter(s => s.zone === 'D')} zoneId="D"
                  position="absolute bottom-0 left-1/2 -translate-x-1/2" onSpotClick={setSelectedSpot} />
                <ZoneCluster spots={filteredSpots.filter(s => s.zone === 'E')} zoneId="E"
                  position="absolute left-0 top-1/2 -translate-y-1/2" onSpotClick={setSelectedSpot} />
              </div>

              <div className="mt-5 flex items-center gap-5 pt-3 flex-wrap" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <LegendItem color="var(--zp-busy)" label="Occupied" />
                <LegendItem color="var(--zp-free)" label="Free" />
                <LegendItem color="var(--zp-info)" label="Reserved" />
                <LegendItem color="rgba(255,255,255,0.25)" label="Offline" />
                <div className="ml-auto font-mono text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Refresh: <span style={{ color: 'rgba(255,255,255,0.85)' }}>5s</span>
                </div>
              </div>
            </div>
          </Panel>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <Panel title="Zone Breakdown" subtitle="Occupancy by Lot">
            <div className="space-y-3">
              {zoneStats.map(z => (
                <div key={z.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[13px]">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: z.color }}></div>
                      <span style={{ color: 'var(--zp-ink)' }}>{z.name}</span>
                    </div>
                    <span className="font-mono tabular-nums" style={{ color: 'var(--zp-ink-2)' }}>{z.occupied}/{z.total}</span>
                  </div>
                  <div className="zp-bar">
                    <i style={{ width: `${z.pct}%`, background: z.color }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title={selectedSpot ? `Spot ${selectedSpot.id}` : 'Select a Spot'} subtitle={selectedSpot ? 'Detail view' : 'Click any tile'}>
            {selectedSpot ? (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <Pill variant={selectedSpot.status === 'occupied' ? 'warn' : selectedSpot.status === 'free' ? 'success' : selectedSpot.status === 'reserved' ? 'info' : 'default'}>
                    {selectedSpot.status}
                  </Pill>
                  {selectedSpot.stale && <Pill variant="warn">stale {Math.floor((Date.now() - selectedSpot.lastUpdate) / 60000)}m</Pill>}
                  {selectedSpot.confidence < CV_CONFIDENCE_THRESHOLD && selectedSpot.status !== 'offline' && (
                    <Pill variant="warn">low conf</Pill>
                  )}
                </div>
                <DataRow label="Zone" value={ZONES.find(z => z.id === selectedSpot.zone)?.name} />
                {selectedSpot.plate && <DataRow label="Plate (CV)" value={selectedSpot.plate} mono />}
                <DataRow label="Confidence" value={`${(selectedSpot.confidence * 100).toFixed(1)}%`} mono />
                <DataRow label="Last update" value={`${Math.floor((Date.now() - selectedSpot.lastUpdate) / 1000)}s ago`} mono />
                <DataRow label="MQTT topic" value={`zweho/zones/${selectedSpot.zone}/occupancy`} mono small />
                <div className="pt-2 flex gap-2" style={{ borderTop: '1px solid var(--zp-line)' }}>
                  <button
                    className="flex-1 text-[11px] font-mono uppercase tracking-[0.12em] py-2 rounded-md"
                    style={{ background: 'var(--zp-surface-2)', color: 'var(--zp-ink-2)', border: '1px solid var(--zp-line)' }}
                  >Flag for review</button>
                  <button
                    className="flex-1 text-[11px] font-mono uppercase tracking-[0.12em] py-2 rounded-md"
                    style={{ background: 'var(--zp-surface-2)', color: 'var(--zp-ink-2)', border: '1px solid var(--zp-line)' }}
                  >View camera</button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-[13px]" style={{ color: 'var(--zp-ink-3)' }}>
                Click any spot tile to inspect its real-time state, plate detection, and CV confidence.
              </div>
            )}
          </Panel>

          <Panel title="Recent Activity" subtitle="Last 5 events">
            <div className="space-y-2.5">
              {[
                { t: '12s', type: 'spot',    msg: 'A-14 occupied',           tone: 'busy' },
                { t: '34s', type: 'booking', msg: 'BK-2847 confirmed',       tone: 'free' },
                { t: '1m',  type: 'qr',      msg: 'Gate North · validated',  tone: 'info' },
                { t: '1m',  type: 'spot',    msg: 'B-07 freed',              tone: 'busy' },
                { t: '2m',  type: 'cv',      msg: 'Low confidence C-03',     tone: 'accent' },
              ].map((a, i) => (
                <div key={i} className="flex items-start gap-2.5 text-[12px]">
                  <span className="font-mono tabular-nums w-7" style={{ color: 'var(--zp-ink-3)' }}>{a.t}</span>
                  <span className={`zp-badge zp-badge--${a.tone}`} style={{ minWidth: 50, justifyContent: 'center' }}>{a.type}</span>
                  <span className="leading-tight" style={{ color: 'var(--zp-ink-2)' }}>{a.msg}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}

function LiveTicker({ spots }) {
  const events = useMemo(() => {
    const recent = [...spots].sort((a, b) => b.lastUpdate - a.lastUpdate).slice(0, 8)
    return recent.map(s => ({
      time: new Date(s.lastUpdate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      label: s.status === 'occupied' ? 'OCCUPIED' : s.status === 'free' ? 'FREED' : 'UPDATE',
      spot: s.id,
      detail: s.plate ? `plate ${s.plate}` : `confidence ${(s.confidence * 100).toFixed(0)}%`,
      tone: s.status === 'occupied' ? 'busy' : 'free',
    }))
  }, [spots])

  if (!events.length) return null
  return (
    <div className="zp-card overflow-hidden">
      <div className="flex items-center">
        <div className="px-4 py-2 flex items-center gap-2 flex-shrink-0" style={{ borderRight: '1px solid var(--zp-line)' }}>
          <span className="w-1.5 h-1.5 rounded-full zp-pulse-dot" style={{ background: 'var(--zp-free)' }}></span>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] font-semibold" style={{ color: 'var(--zp-free)' }}>Live feed</span>
        </div>
        <div className="flex-1 overflow-x-auto py-2 px-3">
          <div className="flex items-center gap-6 whitespace-nowrap">
            {events.map((e, i) => (
              <span key={i} className="flex items-center gap-2 text-[12px]">
                <span className="font-mono" style={{ color: 'var(--zp-ink-3)' }}>{e.time}</span>
                <span className={`zp-badge zp-badge--${e.tone}`}>{e.label}</span>
                <span className="font-mono font-semibold" style={{ color: 'var(--zp-ink)' }}>{e.spot}</span>
                <span style={{ color: 'var(--zp-ink-2)' }}>· {e.detail}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ZoneButton({ children, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-[0.12em] rounded-md font-semibold transition-colors"
      style={{
        background: selected ? 'var(--zp-primary)' : 'var(--zp-surface-2)',
        color: selected ? '#fff' : 'var(--zp-ink-2)',
        border: '1px solid ' + (selected ? 'var(--zp-primary)' : 'var(--zp-line)'),
      }}
    >
      {children}
    </button>
  )
}

function ZoneCluster({ spots, zoneId, position, onSpotClick }) {
  const zone = ZONES.find(z => z.id === zoneId)
  const cols = zoneId === 'C' ? 4 : zoneId === 'E' ? 3 : 8

  return (
    <div className={position}>
      <div className="text-center mb-1.5">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: zone.color }}>
          Zone {zoneId}
        </div>
      </div>
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
        {spots.map(s => <SpotTile key={s.id} spot={s} onClick={onSpotClick} />)}
      </div>
    </div>
  )
}

function SpotTile({ spot, onClick }) {
  const bgMap = {
    occupied: 'var(--zp-busy)',
    free:     'var(--zp-free)',
    reserved: 'var(--zp-info)',
    offline:  'rgba(255,255,255,0.18)',
  }
  return (
    <button
      onClick={() => onClick(spot)}
      title={`${spot.id} · ${spot.status}`}
      className="w-3.5 h-3.5 rounded-[2px] relative transition-transform hover:scale-[1.4] hover:z-10"
      style={{ background: bgMap[spot.status] }}
    >
      {spot.confidence < CV_CONFIDENCE_THRESHOLD && spot.status !== 'offline' && (
        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--zp-accent)' }}></span>
      )}
    </button>
  )
}

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-3 h-3 rounded-sm" style={{ background: color }}></div>
      <span className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</span>
    </div>
  )
}