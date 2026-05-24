import React, { useState } from 'react'
import {
  useStaff, ROLES, ROLE_ACCESS, initialsOf,
} from '../lib/staffStore'
import { useAuth } from '../lib/auth'
import { Panel, MetricCard, Pill, Eyebrow } from '../components/ui'
import { Icons } from '../components/Icons'
import { useToast } from '../lib/toast'

export default function StaffView() {
  const { staff, inviteMember, updateMember, changeRole, suspendMember, reactivateMember, removeMember, activateInvite, resetPassword } = useStaff()
  const { user } = useAuth()
  const toast = useToast()
  const isAdmin = user?.role === 'admin'

  const [showInvite, setShowInvite] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [credModal, setCredModal] = useState(null) // { member, type, value }

  const filtered = staff.filter(m => {
    if (filter !== 'all' && m.role !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!m.name.toLowerCase().includes(q) && !m.email.toLowerCase().includes(q)) return false
    }
    return true
  })

  const counts = {
    admin: staff.filter(m => m.role === 'admin').length,
    staff: staff.filter(m => m.role === 'staff').length,
    'stadium-rep': staff.filter(m => m.role === 'stadium-rep').length,
    invited: staff.filter(m => m.status === 'invited').length,
  }

  return (
    <div className="space-y-5 fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard label="Total Members" value={staff.length} tone="info" />
        <MetricCard label="Admins" value={counts.admin} tone="busy" />
        <MetricCard label="Gate Operators" value={counts.staff} tone="info" />
        <MetricCard label="Pending Invites" value={counts.invited} tone={counts.invited > 0 ? 'busy' : 'free'} />
      </div>

      <Panel
        title="Team Directory"
        subtitle="Members & access control"
        noPadding
        action={
          <div className="flex items-center gap-2">
            <div
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-md"
              style={{ border: '1px solid var(--zp-line)', background: 'var(--zp-surface)' }}
            >
              <Icons.Search size={14} style={{ color: 'var(--zp-ink-3)' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name or email…"
                className="bg-transparent text-[13px] w-48 outline-none"
                style={{ color: 'var(--zp-ink)' }}
              />
            </div>
            {isAdmin && (
              <button
                onClick={() => { setShowInvite(true); setEditingId(null) }}
                className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
                style={{ background: 'var(--zp-primary)', color: '#fff' }}
              >
                <Icons.Plus size={13} /> Invite member
              </button>
            )}
          </div>
        }
      >
        {/* Filter chips */}
        <div className="flex items-center gap-1 px-5 py-3 flex-wrap" style={{ borderBottom: '1px solid var(--zp-line)', background: 'var(--zp-surface-2)' }}>
          {[
            { id: 'all', label: 'All', n: staff.length },
            { id: 'admin', label: 'Admins', n: counts.admin },
            { id: 'staff', label: 'Gate Operators', n: counts.staff },
            { id: 'stadium-rep', label: 'Stadium Reps', n: counts['stadium-rep'] },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="px-2.5 py-1 text-[11px] font-mono uppercase tracking-[0.12em] rounded font-semibold transition-colors"
              style={{
                background: filter === f.id ? 'var(--zp-primary-soft)' : 'transparent',
                color: filter === f.id ? 'var(--zp-primary)' : 'var(--zp-ink-2)',
              }}
            >
              {f.label} <span className="font-normal" style={{ opacity: 0.6 }}>{f.n}</span>
            </button>
          ))}
        </div>

        {/* Invite form */}
        {showInvite && (
          <MemberForm
            mode="invite"
            onSave={(data) => {
              const m = inviteMember(data)
              setShowInvite(false)
              // Show the credential to share
              if (m.inviteMethod === 'password') {
                setCredModal({ member: m, type: 'password', value: m.tempPassword })
              } else {
                setCredModal({ member: m, type: 'link', value: m.inviteCode })
              }
              toast.success('Member invited', m.name)
            }}
            onCancel={() => setShowInvite(false)}
          />
        )}

        {/* Member rows */}
        <div>
          {filtered.length === 0 && (
            <div className="px-5 py-10 text-center text-[13px]" style={{ color: 'var(--zp-ink-3)' }}>
              No members match this filter.
            </div>
          )}

          {filtered.map((m, i) => {
            if (editingId === m.id) {
              return (
                <MemberForm
                  key={m.id}
                  mode="edit"
                  initial={m}
                  onSave={(data) => {
                    updateMember(m.id, data)
                    toast.success('Member updated', data.name)
                    setEditingId(null)
                  }}
                  onCancel={() => setEditingId(null)}
                />
              )
            }
            return (
              <MemberRow
                key={m.id}
                member={m}
                isAdmin={isAdmin}
                isSelf={user?.id === m.id}
                topBorder={i > 0}
                onEdit={() => { setEditingId(m.id); setShowInvite(false) }}
                onChangeRole={(role) => { changeRole(m.id, role); toast.success('Role changed', `${m.name} → ${ROLES[role].label}`) }}
                onSuspend={() => { suspendMember(m.id); toast.warn('Member suspended', m.name) }}
                onReactivate={() => { reactivateMember(m.id); toast.success('Member reactivated', m.name) }}
                onRemove={() => {
                  if (confirm(`Remove ${m.name} from the team? This cannot be undone.`)) {
                    removeMember(m.id)
                    toast.error('Member removed', m.name)
                  }
                }}
                onActivateInvite={() => { activateInvite(m.id); toast.success('Invite completed', m.name) }}
                onResetPassword={() => {
                  const temp = resetPassword(m.id)
                  if (temp) setCredModal({ member: m, type: 'reset', value: temp })
                }}
                onShowInvite={() => {
                  setCredModal({
                    member: m,
                    type: m.inviteMethod === 'password' ? 'password' : 'link',
                    value: m.inviteMethod === 'password' ? m.tempPassword : m.inviteCode,
                  })
                }}
              />
            )
          })}
        </div>
      </Panel>

      {/* Credential modal */}
      {credModal && (
        <CredentialModal
          data={credModal}
          onClose={() => setCredModal(null)}
        />
      )}
    </div>
  )
}

/* ── Member row ────────────────────────────────────────────── */
function MemberRow({ member, isAdmin, isSelf, topBorder, onEdit, onChangeRole, onSuspend, onReactivate, onRemove, onActivateInvite, onResetPassword, onShowInvite }) {
  const [expanded, setExpanded] = useState(false)
  const m = member
  const suspended = m.status === 'suspended'
  const invited = m.status === 'invited'

  const roleColor = {
    admin: 'var(--zp-primary)',
    staff: 'var(--zp-info)',
    'stadium-rep': 'var(--zp-accent-ink)',
  }[m.role] || 'var(--zp-ink-3)'

  return (
    <div style={{ borderTop: topBorder ? '1px solid var(--zp-line)' : 'none', opacity: suspended ? 0.6 : 1 }}>
      <div className="px-5 py-3 flex items-center gap-3 flex-wrap">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
          style={{ background: roleColor, color: '#fff' }}
        >
          {initialsOf(m.name)}
        </div>

        {/* Name + title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14px] font-semibold" style={{ color: 'var(--zp-ink)' }}>{m.name}</span>
            {isSelf && <Pill variant="info">you</Pill>}
            {invited && <Pill variant="warn">invited</Pill>}
            {suspended && <Pill variant="danger">suspended</Pill>}
          </div>
          <div className="font-mono text-[11px] mt-0.5" style={{ color: 'var(--zp-ink-3)' }}>
            {m.title || 'No title'} · {m.team}
          </div>
        </div>

        {/* Role */}
        <div className="hidden md:block text-right">
          <div className="font-mono text-[9px] uppercase tracking-[0.14em] font-semibold" style={{ color: 'var(--zp-ink-3)' }}>Role</div>
          <div className="mt-0.5">
            <Pill variant={m.role === 'admin' ? 'accent' : m.role === 'staff' ? 'info' : 'warn'}>
              {ROLES[m.role]?.label || m.role}
            </Pill>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-[0.12em] rounded-md font-semibold"
            style={{ background: 'var(--zp-surface-2)', color: 'var(--zp-ink-2)', border: '1px solid var(--zp-line)' }}
          >
            {expanded ? 'Less' : 'Details'}
          </button>

          {/* Self-service password reset — every user, their own account */}
          {isSelf && m.canResetPassword && (
            <button
              onClick={onResetPassword}
              className="px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-[0.12em] rounded-md font-semibold"
              style={{ background: 'var(--zp-primary-soft)', color: 'var(--zp-primary)', border: '1px solid var(--zp-primary-soft)' }}
            >
              Reset my password
            </button>
          )}

          {isAdmin && (
            <button
              onClick={onEdit}
              className="px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-[0.12em] rounded-md font-semibold"
              style={{ background: 'var(--zp-surface-2)', color: 'var(--zp-ink-2)', border: '1px solid var(--zp-line)' }}
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="px-5 pb-4">
          <div className="rounded-md p-4" style={{ background: 'var(--zp-surface-2)' }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Contact */}
              <div>
                <Eyebrow>Contact</Eyebrow>
                <div className="space-y-1 mt-2 text-[12px]">
                  <Line label="Email" value={m.email || '—'} mono />
                  <Line label="Phone" value={m.phone || '—'} mono />
                  <Line label="Team" value={m.team} />
                  <Line label="Joined" value={m.joined} mono />
                </div>
              </div>

              {/* Access */}
              <div>
                <Eyebrow>Access · {ROLES[m.role]?.label}</Eyebrow>
                <p className="text-[11px] mt-1 mb-2" style={{ color: 'var(--zp-ink-3)' }}>
                  {ROLES[m.role]?.desc}
                </p>
                <div className="flex flex-wrap gap-1">
                  {(ROLE_ACCESS[m.role] || []).map(p => (
                    <span key={p} className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                      style={{ background: 'var(--zp-surface)', color: 'var(--zp-ink-2)', border: '1px solid var(--zp-line)' }}>
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Admin controls */}
              <div>
                <Eyebrow>Manage</Eyebrow>
                {isAdmin ? (
                  <div className="space-y-2 mt-2">
                    {/* Role selector */}
                    <div>
                      <label className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: 'var(--zp-ink-3)' }}>Change role</label>
                      <select
                        value={m.role}
                        onChange={e => onChangeRole(e.target.value)}
                        className="w-full mt-1 px-2 py-1.5 text-[12px] rounded-md outline-none"
                        style={{ background: 'var(--zp-surface)', border: '1px solid var(--zp-line)', color: 'var(--zp-ink)' }}
                      >
                        {Object.entries(ROLES).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                    {/* Buttons */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {invited && (
                        <ManageBtn onClick={onShowInvite} tone="info">Show invite</ManageBtn>
                      )}
                      {invited && (
                        <ManageBtn onClick={onActivateInvite} tone="free">Mark joined</ManageBtn>
                      )}
                      <ManageBtn onClick={onResetPassword} tone="info">Reset password</ManageBtn>
                      {suspended
                        ? <ManageBtn onClick={onReactivate} tone="free">Reactivate</ManageBtn>
                        : <ManageBtn onClick={onSuspend} tone="busy">Suspend</ManageBtn>}
                      <ManageBtn onClick={onRemove} tone="full">Remove</ManageBtn>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] mt-2" style={{ color: 'var(--zp-ink-3)' }}>
                    Only admins can manage team members.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ManageBtn({ children, onClick, tone }) {
  const map = {
    info: { bg: 'var(--zp-surface)', fg: 'var(--zp-ink-2)', bd: 'var(--zp-line)' },
    free: { bg: 'var(--zp-free-soft)', fg: 'var(--zp-free)', bd: 'color-mix(in srgb, var(--zp-free) 30%, transparent)' },
    busy: { bg: 'var(--zp-busy-soft)', fg: 'var(--zp-busy)', bd: 'color-mix(in srgb, var(--zp-busy) 30%, transparent)' },
    full: { bg: 'var(--zp-full-soft)', fg: 'var(--zp-full)', bd: 'color-mix(in srgb, var(--zp-full) 30%, transparent)' },
  }
  const t = map[tone] || map.info
  return (
    <button
      onClick={onClick}
      className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-[0.12em] rounded-md font-semibold"
      style={{ background: t.bg, color: t.fg, border: `1px solid ${t.bd}` }}
    >
      {children}
    </button>
  )
}

function Line({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: 'var(--zp-ink-3)' }}>{label}</span>
      <span className={mono ? 'font-mono' : ''} style={{ color: 'var(--zp-ink)' }}>{value}</span>
    </div>
  )
}

/* ── Invite / Edit form ────────────────────────────────────── */
function MemberForm({ mode, initial, onSave, onCancel }) {
  const [f, setF] = useState({
    name: initial?.name || '',
    email: initial?.email || '',
    phone: initial?.phone || '',
    role: initial?.role || 'staff',
    title: initial?.title || '',
    team: initial?.team || 'Operations',
    method: 'link',
  })
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }))

  const inputStyle = { background: 'var(--zp-surface)', border: '1px solid var(--zp-line)', color: 'var(--zp-ink)' }
  const labelCls = 'font-mono text-[10px] uppercase tracking-[0.14em]'

  return (
    <div className="px-5 py-4" style={{ background: 'var(--zp-primary-soft)', borderBottom: '1px solid var(--zp-line)' }}>
      <Eyebrow>{mode === 'invite' ? 'Invite a new member' : `Edit · ${initial.name}`}</Eyebrow>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-3">
        <div className="md:col-span-6">
          <label className={labelCls} style={{ color: 'var(--zp-ink-3)' }}>Full name</label>
          <input value={f.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Jean Mukiza"
            className="w-full mt-1 px-3 py-2 text-[13px] rounded-md outline-none" style={inputStyle} />
        </div>
        <div className="md:col-span-6">
          <label className={labelCls} style={{ color: 'var(--zp-ink-3)' }}>Email</label>
          <input value={f.email} onChange={e => set('email', e.target.value)} placeholder="name@example.com"
            className="w-full mt-1 px-3 py-2 text-[13px] font-mono rounded-md outline-none" style={inputStyle} />
        </div>
        <div className="md:col-span-4">
          <label className={labelCls} style={{ color: 'var(--zp-ink-3)' }}>Phone</label>
          <input value={f.phone} onChange={e => set('phone', e.target.value)} placeholder="+250 7XX XXX XXX"
            className="w-full mt-1 px-3 py-2 text-[13px] font-mono rounded-md outline-none" style={inputStyle} />
        </div>
        <div className="md:col-span-4">
          <label className={labelCls} style={{ color: 'var(--zp-ink-3)' }}>Title / position</label>
          <input value={f.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Gate Operator"
            className="w-full mt-1 px-3 py-2 text-[13px] rounded-md outline-none" style={inputStyle} />
        </div>
        <div className="md:col-span-4">
          <label className={labelCls} style={{ color: 'var(--zp-ink-3)' }}>Team</label>
          <input value={f.team} onChange={e => set('team', e.target.value)} placeholder="e.g. Gate Operations"
            className="w-full mt-1 px-3 py-2 text-[13px] rounded-md outline-none" style={inputStyle} />
        </div>

        {/* Role */}
        <div className="md:col-span-6">
          <label className={labelCls} style={{ color: 'var(--zp-ink-3)' }}>Role · access level</label>
          <select value={f.role} onChange={e => set('role', e.target.value)}
            className="w-full mt-1 px-3 py-2 text-[13px] rounded-md outline-none" style={inputStyle}>
            {Object.entries(ROLES).map(([k, v]) => (
              <option key={k} value={k}>{v.label} — {v.desc}</option>
            ))}
          </select>
        </div>

        {/* Invite method — only when inviting */}
        {mode === 'invite' && (
          <div className="md:col-span-6">
            <label className={labelCls} style={{ color: 'var(--zp-ink-3)' }}>Invite method</label>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => set('method', 'link')}
                className="flex-1 px-3 py-2 text-[11px] font-mono uppercase tracking-[0.12em] rounded-md font-semibold"
                style={{
                  background: f.method === 'link' ? 'var(--zp-primary)' : 'var(--zp-surface)',
                  color: f.method === 'link' ? '#fff' : 'var(--zp-ink-2)',
                  border: '1px solid ' + (f.method === 'link' ? 'var(--zp-primary)' : 'var(--zp-line)'),
                }}
              >
                Invite link
              </button>
              <button
                onClick={() => set('method', 'password')}
                className="flex-1 px-3 py-2 text-[11px] font-mono uppercase tracking-[0.12em] rounded-md font-semibold"
                style={{
                  background: f.method === 'password' ? 'var(--zp-primary)' : 'var(--zp-surface)',
                  color: f.method === 'password' ? '#fff' : 'var(--zp-ink-2)',
                  border: '1px solid ' + (f.method === 'password' ? 'var(--zp-primary)' : 'var(--zp-line)'),
                }}
              >
                Temp password
              </button>
            </div>
          </div>
        )}
      </div>

      {mode === 'invite' && (
        <div className="mt-2 font-mono text-[10px]" style={{ color: 'var(--zp-ink-3)' }}>
          {f.method === 'link'
            ? 'A shareable invite code will be generated — send it to the member to complete setup.'
            : 'A temporary password will be generated — share it with the member directly.'}
          {'  '}Password-reset permission is granted automatically.
        </div>
      )}

      <div className="flex justify-end gap-2 mt-3">
        <button onClick={onCancel}
          className="px-4 py-2 text-[11px] font-mono uppercase tracking-[0.12em] rounded-md font-semibold"
          style={{ background: 'var(--zp-surface)', color: 'var(--zp-ink-2)', border: '1px solid var(--zp-line)' }}>
          Cancel
        </button>
        <button
          onClick={() => {
            if (!f.name.trim()) { alert('Name is required'); return }
            onSave(f)
          }}
          className="px-4 py-2 text-[11px] font-mono uppercase tracking-[0.12em] rounded-md font-semibold"
          style={{ background: 'var(--zp-primary)', color: '#fff' }}>
          {mode === 'invite' ? 'Send invite' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}

/* ── Credential modal ──────────────────────────────────────── */
function CredentialModal({ data, onClose }) {
  const { member, type, value } = data
  const [copied, setCopied] = useState(false)

  const title = type === 'reset' ? 'Password reset' : type === 'password' ? 'Temporary password' : 'Invite link'
  const desc = type === 'reset'
    ? `A new temporary password for ${member.name}. Share it securely — they should change it after signing in.`
    : type === 'password'
    ? `Share this temporary password with ${member.name} so they can sign in for the first time.`
    : `Send this invite code to ${member.name}. They use it to complete their account setup.`

  const copy = () => {
    navigator.clipboard?.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="zp-card p-6 w-96" style={{ boxShadow: 'var(--zp-shadow-3)' }}>
        <Eyebrow>{title}</Eyebrow>
        <h3 className="text-lg font-semibold mt-1" style={{ color: 'var(--zp-ink)' }}>{member.name}</h3>
        <p className="text-[12px] mt-2" style={{ color: 'var(--zp-ink-2)' }}>{desc}</p>

        <div
          className="mt-4 flex items-center justify-between gap-3 px-4 py-3 rounded-md"
          style={{ background: 'var(--zp-surface-2)', border: '1px solid var(--zp-line)' }}
        >
          <span className="font-mono text-[15px] font-bold" style={{ color: 'var(--zp-ink)' }}>{value}</span>
          <button
            onClick={copy}
            className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-[0.12em] rounded-md font-semibold"
            style={{ background: copied ? 'var(--zp-free)' : 'var(--zp-primary)', color: '#fff' }}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <div className="mt-3 font-mono text-[10px]" style={{ color: 'var(--zp-ink-3)' }}>
          Note: real delivery (email / SMS) is sent automatically once the backend auth service is connected.
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-2.5 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
          style={{ background: 'var(--zp-primary)', color: '#fff' }}
        >
          Done
        </button>
      </div>
    </div>
  )
}