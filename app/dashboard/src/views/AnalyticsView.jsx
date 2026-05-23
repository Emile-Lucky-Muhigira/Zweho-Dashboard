import React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { getAnalytics } from '../lib/api'
import { Panel, MetricCard, Pill, Eyebrow } from '../components/ui'

export default function AnalyticsView() {
  const { data = { hourly: [], heatmap: [] } } = useQuery({
    queryKey: ['analytics'],
    queryFn: getAnalytics,
  })

  return (
    <div className="space-y-5 fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard label="Peak Occupancy" value="94" unit="%" delta="Tue 18:00" tone="busy" />
        <MetricCard label="Avg Stay Duration" value="2.4" unit="hours" tone="info" />
        <MetricCard label="Avg Daily Bookings" value="42" delta="+18% MoM" tone="free" />
        <MetricCard label="CV Accuracy" value="96.8" unit="% benchmark" delta="+1.2pp" tone="free" />
      </div>

      <Panel title="Hourly Occupancy Curve" subtitle="Match day vs regular day overlay">
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
            <Tooltip
              cursor={{ stroke: 'var(--zp-line)', strokeDasharray: '3 3' }}
            />
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
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
        <Panel title="Demand Heatmap" subtitle="Hour × Weekday · last 4 weeks" className="lg:col-span-2">
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
        </Panel>

        <Panel title="Upcoming Events" subtitle="From events table">
          <div className="space-y-2.5">
            {[
              { date: 'Sat 17 May', name: 'Rwanda vs Nigeria · AFCON Qual', capacity: '94%', tier: 'major' },
              { date: 'Wed 21 May', name: 'APR FC vs Police FC',           capacity: '60%', tier: 'regular' },
              { date: 'Sat 24 May', name: 'Liberation Day Concert',         capacity: '88%', tier: 'major' },
              { date: 'Sun 01 Jun', name: 'Rayon Sports vs Mukura',         capacity: '55%', tier: 'regular' },
            ].map((e, i) => (
              <div
                key={i}
                className="rounded-md p-3 cursor-pointer transition-colors"
                style={{ border: '1px solid var(--zp-line)' }}
                onMouseEnter={el => {
                  el.currentTarget.style.background = 'var(--zp-surface-2)'
                  el.currentTarget.style.borderColor = 'var(--zp-primary-soft)'
                }}
                onMouseLeave={el => {
                  el.currentTarget.style.background = 'transparent'
                  el.currentTarget.style.borderColor = 'var(--zp-line)'
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] font-semibold" style={{ color: 'var(--zp-primary)' }}>{e.date}</span>
                  <Pill variant={e.tier === 'major' ? 'accent' : 'default'}>{e.tier}</Pill>
                </div>
                <div className="text-[13px] leading-snug font-semibold" style={{ color: 'var(--zp-ink)' }}>{e.name}</div>
                <div className="font-mono text-[11px] mt-1.5" style={{ color: 'var(--zp-ink-3)' }}>
                  Projected fill: <span style={{ color: 'var(--zp-ink-2)' }}>{e.capacity}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}