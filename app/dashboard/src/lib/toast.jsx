import React, { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

let idCounter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback(({ title, message, variant = 'info', duration = 4000 }) => {
    const id = ++idCounter
    setToasts(prev => [...prev, { id, title, message, variant }])
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration)
    }
    return id
  }, [dismiss])

  // Convenience methods
  const success = useCallback((title, message) => toast({ title, message, variant: 'success' }), [toast])
  const error   = useCallback((title, message) => toast({ title, message, variant: 'error', duration: 6000 }), [toast])
  const info    = useCallback((title, message) => toast({ title, message, variant: 'info' }), [toast])
  const warn    = useCallback((title, message) => toast({ title, message, variant: 'warn' }), [toast])

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warn, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map(t => <Toast key={t.id} {...t} onDismiss={() => onDismiss(t.id)} />)}
    </div>
  )
}

function Toast({ title, message, variant, onDismiss }) {
  const styles = {
    success: { bg: 'bg-green-500/10', border: 'border-green-500/40', icon: '✓', iconColor: 'text-green-400', titleColor: 'text-green-300' },
    error:   { bg: 'bg-red-500/10',   border: 'border-red-500/40',   icon: '✗', iconColor: 'text-red-400',   titleColor: 'text-red-300' },
    info:    { bg: 'bg-blue-500/10',  border: 'border-blue-500/40',  icon: 'ⓘ', iconColor: 'text-blue-400',  titleColor: 'text-blue-300' },
    warn:    { bg: 'bg-amber-500/10', border: 'border-amber-500/40', icon: '⚠', iconColor: 'text-amber-400', titleColor: 'text-amber-300' },
  }
  const s = styles[variant] || styles.info

  return (
    <div className={`pointer-events-auto fade-in ${s.bg} border ${s.border} backdrop-blur-md rounded shadow-2xl shadow-black/40 p-4 flex items-start gap-3 min-w-[300px]`}>
      <div className={`text-xl leading-none ${s.iconColor} flex-shrink-0 mt-0.5`}>{s.icon}</div>
      <div className="flex-1 min-w-0">
        <div className={`text-[13px] font-medium ${s.titleColor}`}>{title}</div>
        {message && <div className="text-[12px] text-zinc-300 mt-0.5 font-mono">{message}</div>}
      </div>
      <button
        onClick={onDismiss}
        className="text-[var(--text-muted)] hover:text-zinc-200 transition-colors text-lg leading-none flex-shrink-0 -mt-1"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}