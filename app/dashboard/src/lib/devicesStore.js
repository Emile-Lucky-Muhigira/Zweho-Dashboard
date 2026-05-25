// ============================================================
// Devices store — admin-managed infrastructure inventory.
// Hosts (VPS, edge devices, tablets) persist in localStorage.
//
// This stores the INVENTORY only — what machines exist and
// their fixed hardware specs. Live metrics (CPU %, temp,
// running services) come from a monitoring agent on each
// machine, which is separate infrastructure (Simeon's setup).
// Until that's connected, live metrics show as unavailable.
// ============================================================
import { useState, useEffect, useCallback } from 'react'

const KEY = 'zweho_devices'

// Starts empty — admins add their real machines.
export function getDevices() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function save(devices) {
  try {
    localStorage.setItem(KEY, JSON.stringify(devices))
    window.dispatchEvent(new CustomEvent('zweho-devices-changed'))
  } catch {
    /* ignore */
  }
}

function genId(type) {
  const prefix = type === 'vps' ? 'VPS' : type === 'edge' ? 'EDGE' : 'TABLET'
  return `${prefix}_${Date.now().toString(36).toUpperCase().slice(-4)}`
}

export function addDevice({ name, type, role, location, os, cpuModel, ramGb, gpuModel, storageGb }) {
  const devices = getDevices()
  const device = {
    id: genId(type || 'edge'),
    name: name?.trim() || 'New device',
    type: ['vps', 'edge', 'tablet'].includes(type) ? type : 'edge',
    role: role?.trim() || '',
    location: location?.trim() || '',
    os: os?.trim() || '',
    cpuModel: cpuModel?.trim() || '',
    ramGb: ramGb ? Number(ramGb) : null,
    gpuModel: gpuModel?.trim() || '',
    storageGb: storageGb ? Number(storageGb) : null,
    addedAt: new Date().toISOString().slice(0, 10),
  }
  save([...devices, device])
  return device
}

export function updateDevice(id, changes) {
  save(getDevices().map(d => (d.id === id ? { ...d, ...changes } : d)))
}

export function removeDevice(id) {
  save(getDevices().filter(d => d.id !== id))
}

export function useDevices() {
  const [devices, setDevices] = useState(getDevices())

  useEffect(() => {
    const refresh = () => setDevices(getDevices())
    window.addEventListener('zweho-devices-changed', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('zweho-devices-changed', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  return {
    devices,
    addDevice: useCallback((d) => addDevice(d), []),
    updateDevice: useCallback((id, c) => updateDevice(id, c), []),
    removeDevice: useCallback((id) => removeDevice(id), []),
  }
}