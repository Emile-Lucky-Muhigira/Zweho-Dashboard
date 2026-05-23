import React, { useState, useRef, useEffect } from 'react'

export default function MQTTStatus({ status, error, messageCount, lastMessage }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const config = {
    connected:    { color: 'bg-green-500',  text: 'text-green-400',  label: 'MQTT live',     pulse: true  },
    connecting:   { color: 'bg-amber-400',  text: 'text-amber-400',  label: 'Connecting',    pulse: true  },
    reconnecting: { color: 'bg-amber-400',  text: 'text-amber-400',  label: 'Reconnecting',  pulse: true  },
    offline:      { color: 'bg-red-400',    text: 'text-red-400',    label: 'Offline',       pulse: false },
    error:        { color: 'bg-red-500',    text: 'text-red-400',    label: 'MQTT error',    pulse: false },
    disabled:     { color: 'bg-gray-500',   text: 'text-gray-400',   label: 'Mock data',     pulse: false },
  }
  const c = config[status] || config.disabled

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <span className={`w-2 h-2 rounded-full ${c.color} ${c.pulse ? 'live-dot' : ''}`}></span>
        <span className={`text-[11px] font-mono uppercase tracking-[0.18em] ${c.text}`}>{c.label}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-[var(--bg-panel)] border border-[var(--border)] rounded shadow-2xl shadow-black/40 fade-in z-50">
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <div className="font-display text-[14px] font-medium text-zinc-50">MQTT Connection</div>
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--text-muted)] mt-0.5">Live event stream</div>
          </div>
          <div className="p-4 space-y-2.5 text-[12px]">
            <Row label="Status" value={c.label} valueClass={c.text} />
            <Row label="Messages received" value={messageCount.toString()} mono />
            {lastMessage && (
              <Row label="Last topic" value={lastMessage.topic} mono small />
            )}
            {lastMessage && (
              <Row label="Last update" value={`${Math.floor((Date.now() - lastMessage.timestamp) / 1000)}s ago`} mono />
            )}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-sm px-2.5 py-2 text-[11px] text-red-400 font-mono mt-2">
                ⚠ {error}
              </div>
            )}
            {status === 'disabled' && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-sm px-2.5 py-2 text-[11px] text-amber-400 font-mono mt-2">
                Using mock data. Toggle <span className="text-zinc-200">USE_LIVE_MQTT</span> in constants.js
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, mono, small, valueClass }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--text-muted)] text-[10px] uppercase tracking-[0.15em] font-mono">{label}</span>
      <span className={`text-zinc-200 ${mono ? 'font-mono' : ''} ${small ? 'text-[10px]' : ''} ${valueClass || ''}`}>{value}</span>
    </div>
  )
}