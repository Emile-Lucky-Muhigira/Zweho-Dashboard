import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const DEMO_ACCOUNTS = [
  {
    phone: '+250 791 447 448',
    password: 'admin123',
    user: { id: 'usr_001', name: 'Nouba-Asra Goursam Tresor', initials: 'NT', role: 'admin', title: 'Product Lead' },
  },
  {
    phone: '+250 784 007 708',
    password: 'admin123',
    user: { id: 'usr_002', name: 'Emile Muhigira', initials: 'EM', role: 'admin', title: 'Dashboard Lead' },
  },
  {
    phone: '+250 788 100 001',
    password: 'staff123',
    user: { id: 'usr_003', name: 'Daniel K.', initials: 'DK', role: 'staff', title: 'Gate Operator' },
  },
  {
    phone: '+250 788 100 002',
    password: 'stadium123',
    user: { id: 'usr_004', name: 'Joseph Habimana', initials: 'JH', role: 'stadium-rep', title: 'Stadium Liaison' },
  },
]

export const ROLE_PERMISSIONS = {
  admin: ['occupancy', 'zones', 'bookings', 'revenue', 'analytics', 'events', 'cameras', 'staff', 'scanner', 'scan-history', 'annotation', 'edge-devices', 'api-docs', 'settings'],
  staff: ['scanner', 'scan-history'],
  'stadium-rep': ['revenue', 'analytics', 'events'],
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('zweho_user')
    const token = localStorage.getItem('zweho_jwt')
    if (saved && token) {
      try { setUser(JSON.parse(saved)) } catch { /* ignore */ }
    }
    setLoading(false)
  }, [])

  const login = async ({ phone, password }) => {
    const normalize = (s) => s.replace(/\s+/g, '').replace(/^0/, '+250')
    const match = DEMO_ACCOUNTS.find(a => normalize(a.phone) === normalize(phone) && a.password === password)
    if (!match) throw new Error('Invalid phone or password')
    const fakeToken = `demo-${match.user.role}-${Date.now()}`
    localStorage.setItem('zweho_jwt', fakeToken)
    localStorage.setItem('zweho_user', JSON.stringify(match.user))
    setUser(match.user)
    return match.user
  }

  const logout = () => {
    localStorage.removeItem('zweho_jwt')
    localStorage.removeItem('zweho_user')
    setUser(null)
  }

  const can = (viewId) => {
    if (!user) return false
    return ROLE_PERMISSIONS[user.role]?.includes(viewId) || false
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, can, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export const DEMO_HINTS = DEMO_ACCOUNTS.map(a => ({
  phone: a.phone, password: a.password, role: a.user.role, name: a.user.name,
}))