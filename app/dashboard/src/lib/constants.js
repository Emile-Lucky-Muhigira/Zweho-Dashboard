// ============================================================
// Single source of truth for app-wide constants.
// ============================================================

// ── API ─────────────────────────────────────────────────────
// Bruno's backend, mounted at /api/v1.
// Override via VITE_API_BASE env var if needed (Vercel already has this set).
export const API_BASE = import.meta.env.VITE_API_BASE || 'https://parking.mixthubtechnology.com/api/v1'

// ── Active parking lot ──────────────────────────────────────
// The backend models everything (zones, events, bookings, reports, live
// occupancy) under a ParkingLot UUID. For MVP we operate on a single lot.
// When multi-lot support is added, this becomes a user-selected value.
export const ACTIVE_LOT_ID = import.meta.env.VITE_LOT_ID || 'd28d3867-fc98-4758-9145-c918f11b7b95'

// ── Zones ───────────────────────────────────────────────────
// DEFAULT/seed zones — used only when the backend is unreachable so the
// dashboard renders something instead of blanking. Once Phase B (zones
// store wired to backend) lands, zones come from /admin/lots/<id>/zones/.
export const DEFAULT_ZONES = [
  { id: 'A', name: 'Zone A · North Gate',    capacity: 60, color: '#163A6E', status: 'active' },
  { id: 'B', name: 'Zone B · East Stand',    capacity: 48, color: '#E4B228', status: 'active' },
  { id: 'C', name: 'Zone C · VIP Lot',       capacity: 24, color: '#2563A8', status: 'active' },
  { id: 'D', name: 'Zone D · South Gate',    capacity: 72, color: '#1F8A5B', status: 'active' },
  { id: 'E', name: 'Zone E · Press / Buses', capacity: 18, color: '#7A5CC4', status: 'active' },
]

// Backwards-compatible export. Existing pages still import { ZONES }.
export const ZONES = DEFAULT_ZONES

// ── CV / occupancy tuning ───────────────────────────────────
export const CV_CONFIDENCE_THRESHOLD = 0.78
export const STALE_THRESHOLD_MIN = 15
export const OCCUPANCY_REFRESH_MS = 5000

// ── MQTT (unused now — live updates will come via WebSocket Phase C) ──
export const MQTT_BROKER = import.meta.env.VITE_MQTT_BROKER || 'wss://mqtt.zwehopark.rw:8884'
export const USE_LIVE_MQTT = false
export const MQTT_BROKER_URL = import.meta.env.VITE_MQTT_BROKER || 'wss://test.mosquitto.org:8081/mqtt'
export const MQTT_TOPICS = [
  'zweho/zones/+/occupancy',
  'zweho/bookings/new',
  'zweho/payments/confirmed',
  'zweho/qr/validated',
]

// ── Demo mode ───────────────────────────────────────────────
export const DEMO_MODE_KEY = 'zweho_demo_mode'

// localStorage keys for admin-managed config
export const STORAGE_KEYS = {
  zones:  'zweho_zones',
  events: 'zweho_events',
  staff:  'zweho_staff',
  cameras: 'zweho_cameras',
}