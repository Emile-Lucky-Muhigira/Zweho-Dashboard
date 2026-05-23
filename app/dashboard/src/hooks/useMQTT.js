import { useEffect, useRef, useState, useCallback } from 'react'
import mqtt from 'mqtt'

/**
 * Connect to an MQTT broker and subscribe to topics.
 *
 * @param {string} brokerUrl   WebSocket MQTT URL (ws:// or wss://)
 * @param {string[]} topics    Topic patterns to subscribe to (e.g. ['zweho/zones/+/occupancy'])
 * @param {object} options     { enabled: bool, clientId: string }
 * @returns {{
 *   status: 'connecting'|'connected'|'reconnecting'|'offline'|'error'|'disabled',
 *   lastMessage: { topic, payload, timestamp } | null,
 *   messages: Array,
 *   publish: (topic, message) => void,
 *   error: string|null
 * }}
 */
export function useMQTT(brokerUrl, topics = [], { enabled = true, clientId } = {}) {
  const [status, setStatus] = useState(enabled ? 'connecting' : 'disabled')
  const [lastMessage, setLastMessage] = useState(null)
  const [messages, setMessages] = useState([])
  const [error, setError] = useState(null)
  const clientRef = useRef(null)

  // Stable topics key to avoid reconnecting on every render
  const topicsKey = topics.join(',')

  useEffect(() => {
    if (!enabled || !brokerUrl) {
      setStatus('disabled')
      return
    }

    setStatus('connecting')
    setError(null)

    const id = clientId || `zweho-dashboard-${Math.random().toString(16).slice(2, 8)}`
    const client = mqtt.connect(brokerUrl, {
      clientId: id,
      reconnectPeriod: 3000,
      connectTimeout: 8000,
      clean: true,
    })
    clientRef.current = client

    client.on('connect', () => {
      setStatus('connected')
      setError(null)
      topics.forEach(topic => {
        client.subscribe(topic, (err) => {
          if (err) console.warn('[MQTT] Subscribe error', topic, err)
        })
      })
    })

    client.on('reconnect', () => setStatus('reconnecting'))
    client.on('offline',   () => setStatus('offline'))
    client.on('error', (err) => {
      setStatus('error')
      setError(err.message)
    })

    client.on('message', (topic, payload) => {
      let parsed
      try { parsed = JSON.parse(payload.toString()) }
      catch { parsed = payload.toString() }
      const msg = { topic, payload: parsed, timestamp: Date.now() }
      setLastMessage(msg)
      setMessages(prev => [msg, ...prev].slice(0, 50)) // keep last 50
    })

    return () => {
      client.end(true)
      clientRef.current = null
    }
  }, [brokerUrl, topicsKey, enabled, clientId])

  const publish = useCallback((topic, message) => {
    if (!clientRef.current || !clientRef.current.connected) return false
    const payload = typeof message === 'string' ? message : JSON.stringify(message)
    clientRef.current.publish(topic, payload)
    return true
  }, [])

  return { status, lastMessage, messages, publish, error }
}