import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { getAnalytics, isOffline } from '../lib/api'
import { useEvents, eventDateTime, isEventOver } from '../lib/eventsStore'
import { Panel, MetricCard, Pill, Eyebrow } from '../components/ui'

export default function AnalyticsView() {
  const { data = { hourly: [], heatmap: [], kpis: null } } = useQuery({
    queryKey: ['analytics'],
    queryFn: getAnalytics,
  })

  const { events } = useEvents()

  const offline = isOffline(data.hourly)
  const k = data.kpis || {}

  // Upcoming events — real, from the events store admins manage.
  const upcoming = useMemo(() => {
    return [...events]
      .filter(e => e.status === 'scheduled' && !isEventOver(e))
      .sort((a, b) => eventDateTime(a, 'start') - eventDateTime(b, 'start'))
      .slice(0, 5)
  }, [events])

  return (
    <div className="space-y-5 fade-in">
      {/* KPIs — from the real analytics API; blank until backend is live */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard
          label="Peak Occupancy"
          value={k.peakOccupancy != null ? k.peakOccupancy : '—'}
          unit={k.peakOccupancy != null ? '%' : ''}
          delta={k.peakOccupancyAt || ''}
          tone="busy"
        />
        <MetricCard
          label="Avg Stay Duration"
          value={k.avgStayHours != null ? k.avgStayHours : '—'}
          unit={k.avgStayHours != null ? 'hours' : ''}
          tone="info"
        />
        <MetricCard
          label="Avg Daily Bookings"
          value={k.avgDailyBookings != null ? k.avgDailyBookings : '—'}
          tone="free"
        />
        <MetricCard
          label="CV Accuracy"
          value={k.cvAccuracy != null ? k.cvAccuracy : '—'}
          unit={k.cvAccuracy != null ? '% benchmark' : ''}
          tone="free"
        />
      </div>

      <Panel title="Hourly Occupancy Curve" subtitle="Match day vs regular day overlay">
        {data.hourly.length === 0 ? (
          <ChartEmpty
            offline={offline}
            label="Hourly occupancy"
            note="This curve is built from real parking activity. It fills in once the backend is connected and data accumulates."
          />
        ) : (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.hourly} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="reg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--zp-primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--zp-primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="mat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--zp-accent)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--zp-accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--zp-line)" vertical={false} />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} interval={2} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={v => v + '%'} />
                <Tooltip cursor={{ stroke: 'var(--zp-line)', strokeDasharray: '3 3' }} />
                <Area type="monotone" dataKey="occupancy" stroke="var(--zp-primary)" strokeWidth={2} fill="url(#reg)" name="Regular day" />
                <Area type="monotone" dataKey="matchDay" stroke="var(--zp-accent)" strokeWidth={2.5} fill="url(#mat)" name="Match day" />
                <ReferenceLine
                  x="18:00"
                  stroke="var(--zp-busy)"
                  strokeDasharray="3 3"
                  label={{ value: 'Kickoff', fill: 'var(--zp-busy)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                />
              </AreaChart>
            </ResponsiveContainer>

            <div className="flex items-center gap-5 mt-3 pt-3 flex-wrap" style={{ borderTop: '1px solid var(--zp-line)' }}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ background: 'var(--zp-primary)' }}></div>
                <span className="font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color: 'var(--zp-ink-2)' }}>Regular day</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ background: 'var(--zp-accent)' }}></div>
                <span className="font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color: 'var(--zp-ink-2)' }}>Match day</span>
              </div>
            </div>
          </>
        )}
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
        <Panel title="Demand Heatmap" subtitle="Hour × Weekday · last 4 weeks" className="lg:col-span-2">
          {data.heatmap.length === 0 ? (
            <ChartEmpty
              offline={offline}
              label="Demand heatmap"
              note="The heatmap is built from weeks of real occupancy data. It appears once the backend is connected."
            />
          ) : (
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                <div className="flex gap-[3px] mb-2 ml-10">
                  {Array.from({ length: 24 }, (_, h) => (
                    <div key={h} className="w-[22px] text-center font-mono text-[9px] font-semibold" style={{ color: 'var(--zp-ink-3)' }}>
                      {h % 3 === 0 ? String(h).padStart(2, '0') : ''}
                    </div>
                  ))}
                </div>
                {data.heatmap.map((row, i) => (
                  <div key={i} className="flex gap-[3px] mb-[3px] items-center">
                    <div className="w-10 font-mono text-[10px] uppercase tracking-[0.12em] font-semibold" style={{ color: 'var(--zp-ink-3)' }}>{row.day}</div>
                    {row.hours.map((v, h) => (
                      <div
                        key={h}
                        title={`${row.day} ${String(h).padStart(2, '0')}:00 · ${v}%`}
                        className="w-[22px] h-[26px] rounded-[3px] cursor-pointer hover:scale-110 transition-transform"
                        style={{
                          background: v < 5
                            ? 'var(--zp-line-2)'
                            : `color-mix(in srgb, var(--zp-accent) ${Math.min(100, v * 1.1)}%, transparent)`
                        }}
                      />
                    ))}
                  </div>
                ))}
                <div className="flex items-center gap-2.5 mt-4 pt-3" style={{ borderTop: '1px solid var(--zp-line)' }}>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] font-semibold" style={{ color: 'var(--zp-ink-3)' }}>Less</span>
                  {[15, 35, 55, 75, 95].map(p => (
                    <div key={p} className="w-4 h-4 rounded-[2px]" style={{ background: `color-mix(in srgb, var(--zp-accent) ${p}%, transparent)` }}></div>
                  ))}
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] font-semibold" style={{ color: 'var(--zp-ink-3)' }}>More</span>
                </div>
              </div>
            </div>
          )}
        </Panel>

        <Panel title="Upcoming Events" subtitle="From the events you created">
          {upcoming.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-[13px] font-semibold" style={{ color: 'var(--zp-ink)' }}>No upcoming events</div>
              <p className="text-[12px] mt-1" style={{ color: 'var(--zp-ink-2)' }}>
                Events you create on the Events page will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcoming.map((e) => {
                const start = eventDateTime(e, 'start')
                const isMajor = e.type === 'Football match' || e.type === 'Concert'
                return (
                  <div
                    key={e.id}
                    className="rounded-md p-3"
                    style={{ border: '1px solid var(--zp-line)' }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[10px] uppercase tracking-[0.16em] font-semibold" style={{ color: 'var(--zp-primary)' }}>
                        {start.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })}
                      </span>
                      <Pill variant={isMajor ? 'accent' : 'default'}>{e.type}</Pill>
                    </div>
                    <div className="text-[13px] leading-snug font-semibold" style={{ color: 'var(--zp-ink)' }}>{e.name}</div>
                    <div className="font-mono text-[11px] mt-1.5" style={{ color: 'var(--zp-ink-3)' }}>
                      {e.startTime}–{e.endTime}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}

/* ── Empty chart placeholder ───────────────────────────────── */
function ChartEmpty({ offline, label, note }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="font-mono text-[11px] uppercase tracking-[0.16em] font-semibold" style={{ color: 'var(--zp-ink-3)' }}>
        {label} — no data yet
      </div>
      <p className="text-[12px] mt-2 max-w-sm" style={{ color: 'var(--zp-ink-2)' }}>
        {note}
      </p>
    </div>
  )
}