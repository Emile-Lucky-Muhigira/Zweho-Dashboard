// ============================================================
// Demo Mode — controls whether the app shows sample data
// (for presentations) or behaves as real production
// (live API calls, empty states).
//
// OFF (default) = production behaviour: real API, empty states.
// ON            = sample data fills the dashboard for demos.
// ============================================================
import { useState, useEffect, useCallback } from 'react'
import { DEMO_MODE_KEY } from './constants'

// Read the current value from localStorage.
export function isDemoMode() {
  try {
    return localStorage.getItem(DEMO_MODE_KEY) === 'true'
  } catch {
    return false
  }
}

// Set the value and notify any listening components.
export function setDemoMode(on) {
  try {
    localStorage.setItem(DEMO_MODE_KEY, on ? 'true' : 'false')
    // Broadcast so all components using useDemoMode() re-render.
    window.dispatchEvent(new CustomEvent('zweho-demo-mode-changed', { detail: { on } }))
  } catch {
    /* ignore storage errors */
  }
}

// React hook — any component can call this to read demo mode
// and automatically re-render when it's toggled anywhere.
export function useDemoMode() {
  const [on, setOn] = useState(isDemoMode())

  useEffect(() => {
    const handler = () => setOn(isDemoMode())
    // Fires when toggled in this tab...
    window.addEventListener('zweho-demo-mode-changed', handler)
    // ...and when toggled in another tab.
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('zweho-demo-mode-changed', handler)
      window.removeEventListener('storage', handler)
    }
  }, [])

  const toggle = useCallback(() => setDemoMode(!isDemoMode()), [])

  return { demoMode: on, toggle, setDemoMode }
}