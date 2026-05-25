// ============================================================
// Single source of truth for app-wide constants.
// ============================================================

// ── Zones ───────────────────────────────────────────────────
// These are the DEFAULT/seed zones. From Phase 4 onward, zones
// are admin-managed and stored in localStorage (see lib/zonesStore.js).
// This array is only used to seed an empty install on first run.
export const DEFAULT_ZONES = [
  { id: 'A', name: 'Zone A · North Gate',    capacity: 60, color: '#163A6E', status: 'active' },
  { id: 'B', name: 'Zone B · East Stand',    capacity: 48, color: '#E4B228', status: 'active' },
  { id: 'C', name: 'Zone C · VIP Lot',       capacity: 24, color: '#2563A8', status: 'active' },
  { id: 'D', name: 'Zone D · South Gate',    capacity: 72, color: '#1F8A5B', status: 'active' },
  { id: 'E', name: 'Zone E · Press / Buses', capacity: 18, color: '#7A5CC4', status: 'active' },
]

// Backwards-compatible export. Existing pages import { ZONES }.
// After Phase 4 Step 2, pages will switch to the live zones store,
// but keeping this prevents anything breaking in the meantime.
export const ZONES = DEFAULT_ZONES

// ── CV / occupancy tuning ───────────────────────────────────
export const CV_CONFIDENCE_THRESHOLD = 0.78
export const STALE_THRESHOLD_MIN = 15
export const OCCUPANCY_REFRESH_MS = 5000

// ── API ─────────────────────────────────────────────────────
// Bruno's backend. Set VITE_API_BASE in Vercel when the API is live.
// Until then this URL is unreachable and API calls fail gracefully.
export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

// ── MQTT ────────────────────────────────────────────────────
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
// localStorage key for the demo-data toggle. When ON, the app
// shows sample data for presentations. When OFF, it behaves as
// real production: live API calls, empty states when none reached.
export const DEMO_MODE_KEY = 'zweho_demo_mode'

// localStorage key prefixes for admin-managed config
export const STORAGE_KEYS = {
  zones:  'zweho_zones',
  events: 'zweho_events',
  staff:  'zweho_staff',
  cameras: 'zweho_cameras',
}