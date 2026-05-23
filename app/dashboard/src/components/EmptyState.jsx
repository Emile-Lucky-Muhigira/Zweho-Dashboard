// ============================================================
// EmptyState — shown when a page has no data to display.
//
// Two main uses:
//  • <EmptyState variant="empty" />        → nothing created yet
//  • <EmptyState variant="offline" />      → backend unreachable
// ============================================================
import React from 'react'
import { Icons } from './Icons'

export default function EmptyState({
  variant = 'empty',     // 'empty' | 'offline' | 'error'
  title,
  message,
  icon,
  action,                // optional: { label, onClick }
  compact = false,
}) {
  const presets = {
    empty: {
      icon: 'Receipt',
      title: 'Nothing here yet',
      message: 'No records to show. New data will appear here automatically.',
      tone: 'var(--zp-ink-3)',
      bg: 'var(--zp-surface-2)',
    },
    offline: {
      icon: 'Server',
      title: 'Backend not connected',
      message: 'The dashboard can\'t reach the server yet. Once Bruno\'s API is deployed, live data will appear here automatically.',
      tone: 'var(--zp-busy)',
      bg: 'var(--zp-busy-soft)',
    },
    error: {
      icon: 'Shield',
      title: 'Something went wrong',
      message: 'This data couldn\'t be loaded. Try again in a moment.',
      tone: 'var(--zp-full)',
      bg: 'var(--zp-full-soft)',
    },
  }

  const p = presets[variant] || presets.empty
  const Icon = Icons[icon || p.icon] || Icons.Receipt
  const finalTitle = title || p.title
  const finalMessage = message || p.message

  return (
    <div
      className="flex flex-col items-center justify-center text-center rounded-md"
      style={{
        padding: compact ? '32px 24px' : '56px 32px',
        background: 'var(--zp-surface)',
        border: '1px solid var(--zp-line)',
      }}
    >
      <div
        className="rounded-full flex items-center justify-center mb-4"
        style={{ width: 56, height: 56, background: p.bg, color: p.tone }}
      >
        <Icon size={26} />
      </div>

      <div className="text-[16px] font-semibold" style={{ color: 'var(--zp-ink)' }}>
        {finalTitle}
      </div>

      <p className="text-[13px] mt-1.5 max-w-sm" style={{ color: 'var(--zp-ink-2)' }}>
        {finalMessage}
      </p>

      {variant === 'offline' && (
        <div
          className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] px-2.5 py-1 rounded"
          style={{ background: 'var(--zp-busy-soft)', color: 'var(--zp-busy)' }}
        >
          Waiting for backend
        </div>
      )}

      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
          style={{ background: 'var(--zp-primary)', color: '#fff' }}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

// Small inline version for use inside panels / table bodies.
export function EmptyRow({ message = 'No records', colSpan = 1 }) {
  return (
    <tr>
      <td colSpan={colSpan} className="text-center py-10">
        <div className="text-[13px]" style={{ color: 'var(--zp-ink-3)' }}>
          {message}
        </div>
      </td>
    </tr>
  )
}