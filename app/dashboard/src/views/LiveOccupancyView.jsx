import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getOccupancy, isOffline } from '../lib/api'
import { OCCUPANCY_REFRESH_MS, CV_CONFIDENCE_THRESHOLD } from '../lib/constants'
import { useZones } from '../lib/zonesStore'
import { Panel, MetricCard, Pill, DataRow } from '../components/ui'
import { Icons } from '../components/Icons'

export default function LiveOccupancyView() {
  const [selectedSpot, setSelectedSpot] = useState(null)
  const [selectedZone, setSelectedZone] = useState('all')

  const { activeZones } = useZones()
  const ZONES = activeZones

  // Real occupancy from the backend. Empty until Bruno's API is live.
  const { data: spots = [] } = useQuery({
    queryKey: ['occupancy'],
    queryFn: getOccupancy,
    refetchInterval: OCCUPANCY_REFRESH_MS,
  })

  const offline = isOffline(spots)
  const hasData = spots.length > 0

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
      {/* Status banner */}
      <div className="zp-card px-5 py-3 flex items-center gap-3 flex-wrap">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: hasData ? 'var(--zp-free)' : 'var(--zp-ink-3)' }}
        ></span>
        <span className="text-[12px]" style={{ color: 'var(--zp-ink-2)' }}>
          {hasData
            ? 'Live occupancy from the CV pipeline via MQTT.'
            : 'Waiting for the CV pipeline. Spot occupancy will appear here once the cameras and backend are connected.'}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <MetricCard label="Total Occupancy" value={hasData ? stats.pct : '—'} unit={hasData ? '%' : ''} tone="busy" />
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

                {hasData ? (
                  ZONES.map(z => (
                    <ZoneCluster
                      key={z.id}
                      ZONES={ZONES}
                      spots={filteredSpots.filter(s => s.zone === z.id)}
                      zoneId={z.id}
                      position={ZONE_POSITIONS[z.id] || 'absolute top-0 left-1/2 -translate-x-1/2'}
                      onSpotClick={setSelectedSpot}
                    />
                  ))
                ) : (
                  <div className="text-center px-6">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      <Icons.Map size={22} style={{ color: 'rgba(255,255,255,0.4)' }} />
                    </div>
                    <div className="font-mono text-[11px] uppercase tracking-[0.18em] font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      No live spot data
                    </div>
                    <div className="text-[12px] mt-1.5 max-w-xs mx-auto" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      Spot tiles appear here as soon as the CV pipeline starts publishing occupancy.
                    </div>
                  </div>
                )}
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
                  {selectedSpot.confidence < CV_CONFIDENCE_THRESHOLD && selectedSpot.status !== 'offline' && (
                    <Pill variant="warn">low conf</Pill>
                  )}
                </div>
                <DataRow label="Zone" value={ZONES.find(z => z.id === selectedSpot.zone)?.name || selectedSpot.zone} />
                {selectedSpot.plate && <DataRow label="Plate (CV)" value={selectedSpot.plate} mono />}
                {selectedSpot.confidence != null && (
                  <DataRow label="Confidence" value={`${(selectedSpot.confidence * 100).toFixed(1)}%`} mono />
                )}
                {selectedSpot.lastUpdate && (
                  <DataRow label="Last update" value={`${Math.floor((Date.now() - selectedSpot.lastUpdate) / 1000)}s ago`} mono />
                )}
                <DataRow label="MQTT topic" value={`zweho/zones/${selectedSpot.zone}/occupancy`} mono small />
              </div>
            ) : (
              <div className="text-center py-6 text-[13px]" style={{ color: 'var(--zp-ink-3)' }}>
                Click any spot tile to inspect its real-time state, plate detection, and CV confidence.
              </div>
            )}
          </Panel>

          <Panel title="Recent Activity" subtitle="Live events">
            <div className="text-center py-6">
              <div className="text-[13px] font-semibold" style={{ color: 'var(--zp-ink)' }}>No activity yet</div>
              <p className="text-[12px] mt-1" style={{ color: 'var(--zp-ink-2)' }}>
                Spot changes, bookings, and gate scans will stream here once the backend is connected.
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}

// Fixed map positions per zone id.
const ZONE_POSITIONS = {
  A: 'absolute top-0 left-1/2 -translate-x-1/2',
  B: 'absolute right-0 top-1/2 -translate-y-1/2',
  C: 'absolute left-0 top-0',
  D: 'absolute bottom-0 left-1/2 -translate-x-1/2',
  E: 'absolute left-0 top-1/2 -translate-y-1/2',
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

function ZoneCluster({ spots, zoneId, position, onSpotClick, ZONES }) {
  const zone = ZONES.find(z => z.id === zoneId)
  const cols = zoneId === 'C' ? 4 : zoneId === 'E' ? 3 : 8

  return (
    <div className={position}>
      <div className="text-center mb-1.5">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: zone?.color || 'var(--zp-ink-3)' }}>
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