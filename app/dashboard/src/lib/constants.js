// Single source of truth for zones. Update when stadium layout is confirmed.
export const ZONES = [
  { id: 'A', name: 'Zone A · North Gate',    capacity: 60, color: '#ff7849' },
  { id: 'B', name: 'Zone B · East Stand',    capacity: 48, color: '#fbbf24' },
  { id: 'C', name: 'Zone C · VIP Lot',       capacity: 24, color: '#60a5fa' },
  { id: 'D', name: 'Zone D · South Gate',    capacity: 72, color: '#4ade80' },
  { id: 'E', name: 'Zone E · Press / Buses', capacity: 18, color: '#a78bfa' },
]

// CV confidence threshold below which a spot is flagged as uncertain.
// Tune with Hafiz once we have benchmark data on stadium footage.
export const CV_CONFIDENCE_THRESHOLD = 0.78

// Minutes after which a spot's last update is considered stale.
export const STALE_THRESHOLD_MIN = 15

// Refresh interval for /admin/occupancy polling (ms).
// Per tech spec: dashboard refreshes every 5s.
export const OCCUPANCY_REFRESH_MS = 5000

// API base URL — set via .env in production
export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

// MQTT broker (optional — for direct subscribe if needed)
export const MQTT_BROKER = import.meta.env.VITE_MQTT_BROKER || 'wss://mqtt.zwehopark.rw:8884'
// MQTT broker — toggle between test and production
export const USE_LIVE_MQTT = false  // set to true to connect to broker

// For dev: free public test broker (HiveMQ)
// For prod: replace with your VPS MQTT broker URL (wss://mqtt.zwehopark.rw:8884)
export const MQTT_BROKER_URL = import.meta.env.VITE_MQTT_BROKER || 'wss://test.mosquitto.org:8081/mqtt'

// Topics the dashboard subscribes to
export const MQTT_TOPICS = [
  'zweho/zones/+/occupancy',   // + is MQTT wildcard for any zone (A, B, C, D, E)
  'zweho/bookings/new',
  'zweho/payments/confirmed',
  'zweho/qr/validated',
]