// ============================================================
// Cameras store — admin-managed CCTV / CV cameras.
//
// Cameras are configuration (the admin registers each physical
// camera as it's installed), so they persist in localStorage and
// work fully now. When Bruno's backend is live, each write also
// POSTs to the API. Starts EMPTY — no demo cameras.
//
// A camera:
//   {
//     id,                // CAM_xxx — auto-generated
//     name,              // human label, e.g. "North Gate Lot"
//     zone,              // zone id this camera covers (A, B, ...)
//     ipAddress,         // camera IP / RTSP host
//     edgeDevice,        // which edge device runs its inference
//     spotsCovered,      // how many parking slots it watches
//     status,            // 'online' | 'offline' | 'warning'
//   }
// ============================================================
import { useState, useEffect, useCallback } from 'react'
import { STORAGE_KEYS } from './constants'

const KEY = STORAGE_KEYS.cameras || 'zweho_cameras'

export function getCameras() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveCameras(cameras) {
  try {
    localStorage.setItem(KEY, JSON.stringify(cameras))
    window.dispatchEvent(new CustomEvent('zweho-cameras-changed'))
  } catch {
    /* ignore */
  }
}

// Generate the next camera id: CAM_01, CAM_02, ...
function nextCameraId(cameras) {
  let n = 1
  const used = new Set(cameras.map(c => c.id))
  while (used.has('CAM_' + String(n).padStart(2, '0'))) n++
  return 'CAM_' + String(n).padStart(2, '0')
}

export function addCamera({ name, zone, ipAddress, edgeDevice, spotsCovered }) {
  const cameras = getCameras()
  const camera = {
    id: nextCameraId(cameras),
    name: name?.trim() || 'New camera',
    zone: zone || '',
    ipAddress: ipAddress?.trim() || '',
    edgeDevice: edgeDevice?.trim() || '',
    spotsCovered: Math.max(0, parseInt(spotsCovered, 10) || 0),
    status: 'offline',   // a newly added camera is offline until it connects
  }
  saveCameras([...cameras, camera])
  return camera
}

export function updateCamera(id, changes) {
  const cameras = getCameras().map(c =>
    c.id === id
      ? {
          ...c,
          ...changes,
          spotsCovered: changes.spotsCovered != null
            ? Math.max(0, parseInt(changes.spotsCovered, 10) || c.spotsCovered)
            : c.spotsCovered,
        }
      : c
  )
  saveCameras(cameras)
}

export function removeCamera(id) {
  saveCameras(getCameras().filter(c => c.id !== id))
}

// React hook — components read cameras and stay in sync.
export function useCameras() {
  const [cameras, setCameras] = useState(getCameras())

  useEffect(() => {
    const refresh = () => setCameras(getCameras())
    window.addEventListener('zweho-cameras-changed', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('zweho-cameras-changed', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  return {
    cameras,
    addCamera:    useCallback((d) => addCamera(d), []),
    updateCamera: useCallback((id, c) => updateCamera(id, c), []),
    removeCamera: useCallback((id) => removeCamera(id), []),
  }
}