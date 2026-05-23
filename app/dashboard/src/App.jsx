import React, { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Shell from './components/TopBar'
import ProtectedRoute from './components/ProtectedRoute'
import LoginView from './views/LoginView'
import LiveOccupancyView from './views/LiveOccupancyView'
import ZonesView from './views/ZonesView'
import BookingsView from './views/BookingsView'
import RevenueView from './views/RevenueView'
import AnalyticsView from './views/AnalyticsView'
import ScannerView from './views/ScannerView'
import ScanHistoryView from './views/ScanHistoryView'
import AnnotationView from './views/AnnotationView'
import EventsView from './views/EventsView'
import CamerasView from './views/CamerasView'
import StaffView from './views/StaffView'
import EdgeDevicesView from './views/EdgeDevicesView'
import ApiDocsView from './views/ApiDocsView'
import SettingsView from './views/SettingsView'
import { useAuth } from './lib/auth'

export default function App() {
  const [now, setNow] = useState(new Date())
  const location = useLocation()
  const { user } = useAuth()

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const isLoginPage = location.pathname === '/login'

  // Login screen — no shell
  if (isLoginPage || !user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginView />} />
        <Route path="*" element={
          <ProtectedRoute viewId="occupancy"><LiveOccupancyView /></ProtectedRoute>
        } />
      </Routes>
    )
  }

  return (
    <Shell now={now}>
      <Routes>
        <Route path="/" element={
          <ProtectedRoute viewId="occupancy"><LiveOccupancyView /></ProtectedRoute>
        } />
        <Route path="/zones" element={
          <ProtectedRoute viewId="zones"><ZonesView /></ProtectedRoute>
        } />
        <Route path="/bookings" element={
          <ProtectedRoute viewId="bookings"><BookingsView /></ProtectedRoute>
        } />
        <Route path="/revenue" element={
          <ProtectedRoute viewId="revenue"><RevenueView /></ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute viewId="analytics"><AnalyticsView /></ProtectedRoute>
        } />
        <Route path="/events" element={
          <ProtectedRoute viewId="events"><EventsView /></ProtectedRoute>
        } />
        <Route path="/cameras" element={
          <ProtectedRoute viewId="cameras"><CamerasView /></ProtectedRoute>
        } />
        <Route path="/staff" element={
          <ProtectedRoute viewId="staff"><StaffView /></ProtectedRoute>
        } />
        <Route path="/scan-history" element={
          <ProtectedRoute viewId="scan-history"><ScanHistoryView /></ProtectedRoute>
        } />
        <Route path="/annotation" element={
          <ProtectedRoute viewId="annotation"><AnnotationView /></ProtectedRoute>
        } />
        <Route path="/edge-devices" element={
          <ProtectedRoute viewId="edge-devices"><EdgeDevicesView /></ProtectedRoute>
        } />
        <Route path="/api-docs" element={
          <ProtectedRoute viewId="api-docs"><ApiDocsView /></ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute viewId="settings"><SettingsView /></ProtectedRoute>
        } />
      </Routes>
    </Shell>
  )
}