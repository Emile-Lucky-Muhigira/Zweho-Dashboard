import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { getRevenue, getBookings } from '../lib/api'
import { ZONES } from '../lib/constants'
import { Panel, MetricCard, StatusDot, Eyebrow } from '../components/ui'

export default function RevenueView() {
  const [grain, setGrain] = useState('day')

  const { data: revenue = [] } = useQuery({
    queryKey: ['revenue', grain],
    queryFn: () => getRevenue({ grain }),
  })

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings-for-momo'],
    queryFn: () => getBookings(),
  })

  const totalRevenue = revenue.reduce((s, d) => s + d.revenue, 0)
  const totalBookings = revenue.reduce((s, d) => s + d.bookings, 0)
  const matchDayRev = revenue.filter(d => d.isMatchDay).reduce((s, d) => s + d.revenue, 0)
  const momoTxs = bookings.filter(b => b.momoTx).slice(0, 7)

  return (
    <div className="space-y-5 fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard
          label="Total Revenue · 14d"
          value={(totalRevenue / 1000).toFixed(0) + 'K'}
          unit="RWF"
          delta="+34%"
          tone="free"
        />
        <MetricCard
          label="Total Bookings"
          value={totalBookings}
          delta="+28%"
          tone="info"
        />
        <MetricCard
          label="Match-Day Revenue"
          value={(matchDayRev / 1000).toFixed(0) + 'K'}
          unit={`RWF · ${totalRevenue ? ((matchDayRev / totalRevenue) * 100).toFixed(0) : 0}% of total`}
          tone="busy"
        />
        <MetricCard
          label="Avg per Booking"
          value={totalBookings ? Math.floor(totalRevenue / totalBookings) : 0}
          unit="RWF"
          tone="info"
        />
      </div>

      <Panel
        title="Revenue Trend"
        subtitle="Last 14 days"
        action={
          <div className="flex items-center gap-1">
            {['day', 'week', 'month'].map(g => (
              <button
                key={g}
                onClick={() => setGrain(g)}
                className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.12em] rounded font-semibold transition-colors"
                style={{
                  background: grain === g ? 'var(--zp-primary)' : 'var(--zp-surface-2)',
                  color: grain === g ? '#fff' : 'var(--zp-ink-2)',
                  border: '1px solid ' + (grain === g ? 'var(--zp-primary)' : 'var(--zp-line)'),
                }}
              >{g}</button>
            ))}
          </div>
        }
      >
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenue} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="var(--zp-line)" vertical={false} />
            <XAxis dataKey="date" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} tickFormatter={v => (v / 1000).toFixed(0) + 'K'} />
            <Tooltip
              cursor={{ fill: 'var(--zp-primary-soft)', opacity: 0.4 }}
              formatter={(v) => [`${v.toLocaleString()} RWF`, 'Revenue']}
            />
            <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
              {revenue.map((d, i) => (
                <Cell
                  key={i}
                  fill={d.isMatchDay ? 'var(--zp-accent)' : 'var(--zp-primary)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-5 mt-3 pt-3 flex-wrap" style={{ borderTop: '1px solid var(--zp-line)' }}>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'var(--zp-accent)' }}></div>
            <span className="font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color: 'var(--zp-ink-2)' }}>Match Day</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'var(--zp-primary)' }}></div>
            <span className="font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color: 'var(--zp-ink-2)' }}>Regular Day</span>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        <Panel title="Revenue by Zone" subtitle="14-day total">
          <div className="space-y-3 mt-1">
            {ZONES.map((z, i) => {
              const pct = [38, 22, 18, 14, 8][i] || 0
              const rev = Math.floor(totalRevenue * pct / 100)
              return (
                <div key={z.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[13px]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: z.color }}></div>
                      <span style={{ color: 'var(--zp-ink)' }}>{z.name}</span>
                    </div>
                    <div className="flex items-center gap-4 font-mono">
                      <span className="tabular-nums text-[12px]" style={{ color: 'var(--zp-ink-3)' }}>{pct}%</span>
                      <span className="tabular-nums w-20 text-right font-semibold" style={{ color: 'var(--zp-ink)' }}>{rev.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="zp-bar">
                    <i style={{ width: `${pct}%`, background: z.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>

        <Panel title="Recent MoMo Transactions" subtitle="Live · MTN MoMo">
          <div className="space-y-1">
            {momoTxs.map(b => (
              <div
                key={b.id}
                className="flex items-center justify-between py-2 px-2.5 rounded-md text-[13px] transition-colors cursor-pointer"
                onMouseEnter={e => e.currentTarget.style.background = 'var(--zp-surface-2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div className="flex items-center gap-3">
                  <StatusDot status={b.status} />
                  <span className="font-mono text-[11px]" style={{ color: 'var(--zp-ink-2)' }}>{b.momoTx}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[10px]" style={{ color: 'var(--zp-ink-3)' }}>{b.id}</span>
                  <span className="font-mono tabular-nums w-24 text-right font-semibold" style={{ color: 'var(--zp-ink)' }}>
                    {b.amount.toLocaleString()} <span className="text-[10px] font-normal" style={{ color: 'var(--zp-ink-3)' }}>RWF</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}