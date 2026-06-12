// ============================================================
// Staff store — admin-managed team members & access control.
//
// Members persist in localStorage and work fully now. When
// Bruno's auth backend is live, invite / reset / role-change
// also call the API. Until then the flow is real, only the
// final network write waits.
//
// A member:
//   {
//     id, name, email, phone, role, title, team,
//     status,            // 'active' | 'invited' | 'suspended'
//     inviteMethod,      // 'link' | 'password' | null
//     inviteCode,        // share code/link (when invited by link)
//     tempPassword,      // temp password (when invited by password)
//     canResetPassword,  // true once added — team requirement
//     joined,            // ISO date
//   }
// ============================================================
import { useState, useEffect, useCallback } from 'react'
import { STORAGE_KEYS } from './constants'

const KEY = STORAGE_KEYS.staff

// ── ROLES ───────────────────────────────────────────────────
// All defined roles — kept here so existing code that reads
// ROLES[member.role] keeps working for legacy data.
//
// ROLES_AVAILABLE controls what shows in invite/edit dropdowns.
// "Stadium Rep" exists in our spec but Bruno's backend doesn't
// support it yet (only USER, ADMIN, GATE_STAFF). When he adds
// it server-side, add 'stadium-rep' back into ROLES_AVAILABLE.
// TODO: restore Stadium Rep once Bruno's backend supports it.
export const ROLES = {
  admin:          { label: 'Admin',         desc: 'Full access to every page and action' },
  staff:          { label: 'Gate Operator', desc: 'Gate Scan and Scan History only' },
  'stadium-rep':  { label: 'Stadium Rep',   desc: 'Revenue, Analytics and Events only' },
}

// Only these roles appear in the UI for selecting / inviting.
export const ROLES_AVAILABLE = ['admin', 'staff']

export const ROLE_ACCESS = {
  admin:         ['Overview', 'Zones', 'Bookings', 'Revenue', 'Analytics', 'Events', 'Cameras', 'Staff', 'Gate Scan', 'Scan History', 'Annotate', 'Edge Devices', 'API Docs', 'Settings'],
  staff:         ['Gate Scan', 'Scan History'],
  'stadium-rep': ['Revenue', 'Analytics', 'Events'],
}

// Seed = your real team directory.
const SEED_STAFF = [
  { id: 'usr_001', name: 'Nouba-Asra Goursam Tresor', email: 'ngoursam@andrew.cmu.edu', phone: '+250 791 447 448', role: 'admin', title: 'Product / Operations Lead', team: 'Leadership',  status: 'active', joined: '2026-01-15' },
  { id: 'usr_002', name: 'Emile Lucky Muhigira',       email: 'emuhigir@andrew.cmu.edu', phone: '+250 784 007 708', role: 'admin', title: 'Dashboard / Web Engineer', team: 'Engineering', status: 'active', joined: '2026-01-15' },
  { id: 'usr_003', name: 'Bruno Payang',               email: 'bpayang@andrew.cmu.edu', phone: '+250 796 893 424', role: 'admin', title: 'Backend Engineer',        team: 'Engineering', status: 'active', joined: '2026-01-15' },
  { id: 'usr_004', name: 'Hafiz Adjei',                email: 'hadjei@andrew.cmu.edu',  phone: '+233 549 201 359', role: 'admin', title: 'CV / AI Engineer',         team: 'Engineering', status: 'active', joined: '2026-01-15' },
  { id: 'usr_005', name: 'Simeon Hatangimana',         email: 'shatangi@andrew.cmu.edu', phone: '+250 784 004 300', role: 'admin', title: 'DevOps / Hardware Lead',  team: 'Engineering', status: 'active', joined: '2026-01-15' },
  { id: 'usr_006', name: 'Denys Ntwaritaganzwa',       email: 'dntwarit@andrew.cmu.edu', phone: '+250 788 945 193', role: 'admin', title: 'Mobile / Frontend Engineer', team: 'Engineering', status: 'active', joined: '2026-01-15' },
]

// ── Read / write ────────────────────────────────────────────
export function getStaff() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      const seeded = SEED_STAFF.map(m => ({
        ...m, inviteMethod: null, inviteCode: null, tempPassword: null, canResetPassword: true,
      }))
      localStorage.setItem(KEY, JSON.stringify(seeded))
      return seeded
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveStaff(staff) {
  try {
    localStorage.setItem(KEY, JSON.stringify(staff))
    window.dispatchEvent(new CustomEvent('zweho-staff-changed'))
  } catch {
    /* ignore */
  }
}

function genId() {
  return 'usr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
}

function genInviteCode() {
  const s = Math.random().toString(36).toUpperCase().slice(2, 7)
  return 'ZWEHO-' + s
}

function genTempPassword() {
  const n = Math.floor(1000 + Math.random() * 9000)
  const s = Math.random().toString(36).slice(2, 4)
  return `Zw-${n}-${s}`
}

function initialsOf(name) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('')
}

// ── Invite / add a member ───────────────────────────────────
export function inviteMember({ name, email, phone, role, title, team, method }) {
  const staff = getStaff()
  // Guard: only allow roles that are currently available in the UI.
  const safeRole = ROLES_AVAILABLE.includes(role) ? role : 'staff'
  const member = {
    id: genId(),
    name: name?.trim() || 'New member',
    email: email?.trim() || '',
    phone: phone?.trim() || '',
    role: safeRole,
    title: title?.trim() || '',
    team: team?.trim() || 'Operations',
    status: 'invited',
    inviteMethod: method === 'password' ? 'password' : 'link',
    inviteCode: method === 'password' ? null : genInviteCode(),
    tempPassword: method === 'password' ? genTempPassword() : null,
    canResetPassword: true,
    joined: new Date().toISOString().slice(0, 10),
  }
  saveStaff([...staff, member])
  return member
}

export function updateMember(id, changes) {
  saveStaff(getStaff().map(m => (m.id === id ? { ...m, ...changes } : m)))
}

export function changeRole(id, role) {
  // Guard: only allow available roles.
  if (!ROLES_AVAILABLE.includes(role)) return
  updateMember(id, { role })
}

export function suspendMember(id) { updateMember(id, { status: 'suspended' }) }
export function reactivateMember(id) { updateMember(id, { status: 'active' }) }

export function removeMember(id) {
  saveStaff(getStaff().filter(m => m.id !== id))
}

export function activateInvite(id) {
  updateMember(id, { status: 'active', inviteCode: null, tempPassword: null })
}

// ── Password reset ──────────────────────────────────────────
export function resetPassword(id) {
  const member = getStaff().find(m => m.id === id)
  if (!member || !member.canResetPassword) return null
  const temp = genTempPassword()
  updateMember(id, { tempPassword: temp })
  return temp
}

export { initialsOf }

// ── React hook ──────────────────────────────────────────────
export function useStaff() {
  const [staff, setStaff] = useState(getStaff())

  useEffect(() => {
    const refresh = () => setStaff(getStaff())
    window.addEventListener('zweho-staff-changed', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('zweho-staff-changed', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  return {
    staff,
    inviteMember:     useCallback((d) => inviteMember(d), []),
    updateMember:     useCallback((id, c) => updateMember(id, c), []),
    changeRole:       useCallback((id, r) => changeRole(id, r), []),
    suspendMember:    useCallback((id) => suspendMember(id), []),
    reactivateMember: useCallback((id) => reactivateMember(id), []),
    removeMember:     useCallback((id) => removeMember(id), []),
    activateInvite:   useCallback((id) => activateInvite(id), []),
    resetPassword:    useCallback((id) => resetPassword(id), []),
  }
}