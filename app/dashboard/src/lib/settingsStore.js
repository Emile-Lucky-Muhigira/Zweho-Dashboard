// ============================================================
// Settings store — admin-managed dashboard configuration.
// Persists in localStorage and works fully now. When Bruno's
// backend is live, these also sync to the API.
// ============================================================
import { useState, useEffect, useCallback } from 'react'

const KEY = 'zweho_settings'

// Real defaults — actual facts about the project, not demo data.
const DEFAULTS = {
  organisation: {
    legalName: 'Zweho Park Ltd',
    tradingName: 'SmartPark Amahoro',
    country: 'Rwanda',
    tin: '',                       // empty until RDB registration is done
    address: 'CMU-Africa, KG 11 Avenue, Kigali',
    logoDataUrl: null,             // set by the Upload logo picker
  },
  rules: {
    holdAfterKickoff: true,
    earlyBirdDiscount: true,
    autoRefundNoShow: true,
    maxBookingsPerUser: '5',
    holdMinutes: '30',
  },
  notifications: {
    bookingConfirmation: true,
    paymentConfirmation: true,
    kickoffReminder: true,
    spotReady: true,
    refundIssued: true,
  },
  // Per-zone prices keyed by zone id, e.g. { A: 2000, B: 2500 }
  zonePrices: {},
}

export function getSettings() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return structuredClone(DEFAULTS)
    const parsed = JSON.parse(raw)
    // Merge so new default keys appear even on old saved data.
    return {
      organisation:  { ...DEFAULTS.organisation,  ...(parsed.organisation  || {}) },
      rules:         { ...DEFAULTS.rules,         ...(parsed.rules         || {}) },
      notifications: { ...DEFAULTS.notifications, ...(parsed.notifications || {}) },
      zonePrices:    { ...(parsed.zonePrices || {}) },
    }
  } catch {
    return structuredClone(DEFAULTS)
  }
}

function save(settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings))
    window.dispatchEvent(new CustomEvent('zweho-settings-changed'))
  } catch {
    /* ignore storage errors */
  }
}

// Update one section (organisation | rules | notifications | zonePrices)
export function updateSettings(section, changes) {
  const current = getSettings()
  const next = { ...current, [section]: { ...current[section], ...changes } }
  save(next)
  return next
}

export function useSettings() {
  const [settings, setSettings] = useState(getSettings())

  useEffect(() => {
    const refresh = () => setSettings(getSettings())
    window.addEventListener('zweho-settings-changed', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('zweho-settings-changed', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const update = useCallback((section, changes) => updateSettings(section, changes), [])
  return { settings, update }
}