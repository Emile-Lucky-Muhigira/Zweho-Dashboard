import { useEffect, useState } from 'react'
import { useMQTT } from './useMQTT'
import { USE_LIVE_MQTT, MQTT_BROKER_URL, MQTT_TOPICS } from '../lib/constants'

/**
 * Main live-data hook. Connects to MQTT and surfaces:
 *  - connection status
 *  - spot occupancy updates
 *  - recent activity feed
 */
export function useZwehoLiveData() {
  const { status, lastMessage, messages, error, publish } = useMQTT(
    MQTT_BROKER_URL,
    MQTT_TOPICS,
    { enabled: USE_LIVE_MQTT, clientId: `zweho-dash-${Date.now()}` }
  )

  const [spotUpdates, setSpotUpdates] = useState({})

  // Process incoming MQTT messages
  useEffect(() => {
    if (!lastMessage) return
    const { topic, payload } = lastMessage

    // zweho/zones/A/occupancy → spot update
    const match = topic.match(/^zweho\/zones\/([A-E])\/occupancy$/)
    if (match && payload?.spot_id) {
      setSpotUpdates(prev => ({
        ...prev,
        [payload.spot_id]: {
          status: payload.status,
          confidence: payload.confidence,
          timestamp: payload.timestamp || lastMessage.timestamp,
        }
      }))
    }
  }, [lastMessage])

  return {
    mqttStatus: status,
    mqttError: error,
    messageCount: messages.length,
    lastMessage,
    recentMessages: messages,
    spotUpdates,        // map of spot_id -> latest state from MQTT
    publish,            // useful for testing — fire fake messages
  }
}