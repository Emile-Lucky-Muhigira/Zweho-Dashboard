import React from 'react'

export function StatusDot({ status, className = '' }) {
  const colors = {
    occupied: 'bg-[var(--zp-busy)]',
    free:     'bg-[var(--zp-free)]',
    reserved: 'bg-[var(--zp-info)]',
    offline:  'bg-[var(--zp-ink-3)]',
    paid:     'bg-[var(--zp-free)]',
    used:     'bg-[var(--zp-info)]',
    pending:  'bg-[var(--zp-busy)]',
    cancelled:'bg-[var(--zp-ink-3)]',
    expired:  'bg-[var(--zp-full)]',
  }
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[status] || 'bg-[var(--zp-ink-3)]'} ${className}`} />
}

export function Pill({ children, variant = 'default', size = 'sm' }) {
  const variants = {
    default: { bg: 'var(--zp-line-2)', text: 'var(--zp-ink-2)' },
    success: { bg: 'var(--zp-free-soft)', text: 'var(--zp-free)' },
    warn:    { bg: 'var(--zp-busy-soft)', text: 'var(--zp-busy)' },
    danger:  { bg: 'var(--zp-full-soft)', text: 'var(--zp-full)' },
    info:    { bg: 'var(--zp-info-soft)', text: 'var(--zp-info)' },
    accent:  { bg: 'var(--zp-accent-soft)', text: 'var(--zp-accent-ink)' },
  }
  const v = variants[variant] || variants.default
  const padding = size === 'md' ? 'px-2.5 py-1' : 'px-2 py-0.5'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full uppercase tracking-wider font-mono font-semibold text-[10px] ${padding}`}
      style={{ background: v.bg, color: v.text }}
    >
      {children}
    </span>
  )
}

export function Eyebrow({ children, className = '' }) {
  return <div className={`zp-eyebrow ${className}`}>{children}</div>
}

export function Panel({ title, subtitle, action, children, className = '', noPadding = false }) {
  return (
    <div className={`zp-card ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'var(--zp-line)' }}>
          <div>
            {subtitle && <Eyebrow>{subtitle}</Eyebrow>}
            {title && (
              <h3
                className="text-[15px] font-semibold leading-tight"
                style={{ color: 'var(--zp-ink)', fontFamily: 'var(--zp-font-ui)', marginTop: subtitle ? 2 : 0 }}
              >
                {title}
              </h3>
            )}
          </div>
          {action}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </div>
  )
}

export function MetricCard({ label, value, unit, delta, deltaLabel, tone = 'info' }) {
  const toneMap = {
    free: 'success', busy: 'warn', full: 'danger', info: 'info',
  }
  return (
    <div className="zp-card p-5">
      <div className="flex items-center justify-between">
        <Eyebrow>{label}</Eyebrow>
        {delta && <Pill variant={toneMap[tone] || 'info'}>{delta}</Pill>}
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="font-mono text-3xl font-bold tabular-nums" style={{ color: 'var(--zp-ink)' }}>{value}</span>
        {unit && <span className="text-xs font-mono" style={{ color: 'var(--zp-ink-3)' }}>{unit}</span>}
      </div>
      {deltaLabel && (
        <div className="mt-1 font-mono text-[11px]" style={{ color: 'var(--zp-ink-3)' }}>{deltaLabel}</div>
      )}
    </div>
  )
}

export function LegendDot({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-sm ${color}`}></div>
      <span className="font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color: 'var(--zp-ink-2)' }}>{label}</span>
    </div>
  )
}

export function DataRow({ label, value, mono, small }) {
  return (
    <div className="flex items-center justify-between text-[13px] py-1">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: 'var(--zp-ink-3)' }}>{label}</span>
      <span className={`${mono ? 'font-mono' : ''} ${small ? 'text-[11px]' : ''}`} style={{ color: 'var(--zp-ink)' }}>{value}</span>
    </div>
  )
}

export function maskPhone(phone) {
  return phone.replace(/(\+250 \d{2})\d/, '$1*').replace(/(\d{3}) (\d{3})$/, '*** $2')
}

export function ZoneTile({ id, status }) {
  const colorMap = {
    free: 'var(--zp-free-soft)',
    busy: 'var(--zp-busy-soft)',
    full: 'var(--zp-full-soft)',
  }
  const inkMap = {
    free: 'var(--zp-free)',
    busy: 'var(--zp-busy)',
    full: 'var(--zp-full)',
  }
  return (
    <div
      className="w-10 h-10 rounded-[10px] flex items-center justify-center font-mono font-bold text-sm"
      style={{ background: colorMap[status] || 'var(--zp-line-2)', color: inkMap[status] || 'var(--zp-ink-2)' }}
    >
      {id}
    </div>
  )
}