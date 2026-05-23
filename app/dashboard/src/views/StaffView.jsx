import React, { useState } from 'react'
import { Panel, MetricCard, Pill, Eyebrow } from '../components/ui'
import { Icons } from '../components/Icons'

const STAFF = [
  {
    id: 'usr_001', name: 'Nouba-Asra Goursam Tresor', initials: 'NT', email: 'ngoursam@andrew.cmu.edu',
    phone: '+250 791 447 448', role: 'admin', title: 'Product / Operations Lead', team: 'leadership',
    status: 'active', last_seen: '2 min ago', joined: '2026-01-15', shifts_this_month: 0,
  },
  {
    id: 'usr_002', name: 'Emile Lucky Muhigira', initials: 'EM', email: 'emuhigir@andrew.cmu.edu',
    phone: '+250 784 007 708', role: 'admin', title: 'Dashboard / Web Engineer', team: 'engineering',
    status: 'active', last_seen: 'now', joined: '2026-01-15', shifts_this_month: 0,
  },
  {
    id: 'usr_003', name: 'Bruno Payang', initials: 'BP', email: 'bpayang@andrew.cmu.edu',
    phone: '+250 796 893 424', role: 'admin', title: 'Backend Engineer', team: 'engineering',
    status: 'active', last_seen: '14 min ago', joined: '2026-01-15', shifts_this_month: 0,
  },
  {
    id: 'usr_004', name: 'Hafiz Adjei', initials: 'HA', email: 'hadjei@andrew.cmu.edu',
    phone: '+233 549 201 359', role: 'admin', title: 'CV / AI Engineer', team: 'engineering',
    status: 'active', last_seen: '1 hour ago', joined: '2026-01-15', shifts_this_month: 0,
  },
  {
    id: 'usr_005', name: 'Simeon Hatangimana', initials: 'SH', email: 'shatangi@andrew.cmu.edu',
    phone: '+250 784 004 300', role: 'admin', title: 'DevOps / Hardware Lead', team: 'engineering',
    status: 'active', last_seen: '6 min ago', joined: '2026-01-15', shifts_this_month: 0,
  },
  {
    id: 'usr_006', name: 'Denys Ntwaritaganzwa', initials: 'DN', email: 'dntwarit@andrew.cmu.edu',
    phone: '+250 788 945 193', role: 'admin', title: 'Mobile / Frontend Engineer', team: 'engineering',
    status: 'active', last_seen: '30 min ago', joined: '2026-01-15', shifts_this_month: 0,
  },
  {
    id: 'usr_010', name: 'Daniel Kayisire', initials: 'DK', email: 'dkayisire@zwehopark.rw',
    phone: '+250 788 100 001', role: 'staff', title: 'Gate Operator · North', team: 'gate-ops',
    status: 'active', last_seen: '12 min ago', joined: '2026-04-20', shifts_this_month: 8,
  },
  {
    id: 'usr_011', name: 'Aimable Niyonzima', initials: 'AN', email: 'aniyonzima@zwehopark.rw',
    phone: '+250 788 100 003', role: 'staff', title: 'Gate Operator · South', team: 'gate-ops',
    status: 'active', last_seen: '3 hours ago', joined: '2026-04-22', shifts_this_month: 7,
  },
  {
    id: 'usr_012', name: 'Marie Uwizeye', initials: 'MU', email: 'muwizeye@zwehopark.rw',
    phone: '+250 788 100 004', role: 'staff', title: 'Gate Operator · East', team: 'gate-ops',
    status: 'inactive', last_seen: '5 days ago', joined: '2026-04-25', shifts_this_month: 2,
  },
  {
    id: 'usr_020', name: 'Joseph Habimana', initials: 'JH', email: 'joseph.h@amahoro-stadium.rw',
    phone: '+250 788 100 002', role: 'stadium-rep', title: 'Stadium Liaison', team: 'external',
    status: 'active', last_seen: '2 days ago', joined: '2026-03-15', shifts_this_month: 0,
  },
]

export default function StaffView() {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const filtered = STAFF.filter(s => {
    if (filter !== 'all' && s.role !== filter) return false
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.email.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const counts = {
    admin: STAFF.filter(s => s.role === 'admin').length,
    staff: STAFF.filter(s => s.role === 'staff').length,
    'stadium-rep': STAFF.filter(s => s.role === 'stadium-rep').length,
    active: STAFF.filter(s => s.status === 'active').length,
  }

  return (
    <div className="space-y-5 fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard label="Total Staff" value={STAFF.length} tone="info" />
        <MetricCard label="Admins" value={counts.admin} unit="full access" tone="busy" />
        <MetricCard label="Gate Operators" value={counts.staff} unit="scanner only" tone="info" />
        <MetricCard label="Currently Active" value={counts.active} delta="online today" tone="free" />
      </div>

      <Panel
        title="Team Directory"
        subtitle="Manage access · Role-based permissions"
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
                placeholder="Search by name or email…"
                className="bg-transparent text-[13px] w-52 outline-none"
                style={{ color: 'var(--zp-ink)' }}
              />
            </div>
            <button
              className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
              style={{ background: 'var(--zp-primary)', color: '#fff' }}
            >
              <Icons.Plus size={13} /> Invite member
            </button>
          </div>
        }
      >
        <div className="flex items-center gap-1 px-5 py-3 flex-wrap" style={{ borderBottom: '1px solid var(--zp-line)', background: 'var(--zp-surface-2)' }}>
          {[
            { id: 'all', label: 'All', count: STAFF.length },
            { id: 'admin', label: 'Admins', count: counts.admin },
            { id: 'staff', label: 'Gate Staff', count: counts.staff },
            { id: 'stadium-rep', label: 'Stadium Reps', count: counts['stadium-rep'] },
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
              {f.label}
              <span className="ml-1.5 font-normal" style={{ opacity: 0.6 }}>{f.count}</span>
            </button>
          ))}
        </div>

        <div>
          {filtered.map((s, i) => {
            const isSelected = selected?.id === s.id
            return (
              <div
                key={s.id}
                onClick={() => setSelected(isSelected ? null : s)}
                className="px-5 py-3 cursor-pointer transition-colors"
                style={{
                  background: isSelected ? 'var(--zp-primary-soft)' : 'transparent',
                  borderTop: i > 0 ? '1px solid var(--zp-line)' : 'none',
                }}
                onMouseEnter={el => { if (!isSelected) el.currentTarget.style.background = 'var(--zp-surface-2)' }}
                onMouseLeave={el => { if (!isSelected) el.currentTarget.style.background = 'transparent' }}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                    style={{
                      background: s.role === 'admin'
                        ? 'linear-gradient(135deg, var(--zp-primary), color-mix(in srgb, var(--zp-primary) 60%, black))'
                        : s.role === 'staff'
                        ? 'linear-gradient(135deg, var(--zp-info), color-mix(in srgb, var(--zp-info) 60%, black))'
                        : 'linear-gradient(135deg, var(--zp-accent), var(--zp-accent-ink))',
                      color: '#fff',
                    }}
                  >
                    {s.initials}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-semibold" style={{ color: 'var(--zp-ink)' }}>{s.name}</span>
                      {s.status === 'inactive' && <Pill variant="default">inactive</Pill>}
                    </div>
                    <div className="font-mono text-[11px] mt-0.5" style={{ color: 'var(--zp-ink-3)' }}>
                      {s.title}
                    </div>
                  </div>

                  <div className="hidden md:flex items-center gap-5 flex-shrink-0">
                    <div className="text-right">
                      <div className="font-mono text-[9px] uppercase tracking-[0.14em] font-semibold" style={{ color: 'var(--zp-ink-3)' }}>Role</div>
                      <div className="mt-0.5">
                        <Pill variant={s.role === 'admin' ? 'accent' : s.role === 'staff' ? 'info' : 'warn'}>{s.role}</Pill>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-[9px] uppercase tracking-[0.14em] font-semibold" style={{ color: 'var(--zp-ink-3)' }}>Last seen</div>
                      <div className="font-mono text-[12px] mt-1" style={{ color: 'var(--zp-ink-2)' }}>{s.last_seen}</div>
                    </div>
                  </div>

                  <Icons.ChevronRight size={16} style={{ color: 'var(--zp-ink-3)', transform: isSelected ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>

                {isSelected && (
                  <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--zp-line)' }}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <Eyebrow>Contact</Eyebrow>
                        <div className="space-y-1.5 mt-3 text-[12px]">
                          <div className="flex items-center justify-between"><span style={{ color: 'var(--zp-ink-3)' }}>Email</span><span className="font-mono" style={{ color: 'var(--zp-ink)' }}>{s.email}</span></div>
                          <div className="flex items-center justify-between"><span style={{ color: 'var(--zp-ink-3)' }}>Phone</span><span className="font-mono" style={{ color: 'var(--zp-ink)' }}>{s.phone}</span></div>
                          <div className="flex items-center justify-between"><span style={{ color: 'var(--zp-ink-3)' }}>Team</span><span style={{ color: 'var(--zp-ink)' }}>{s.team}</span></div>
                          <div className="flex items-center justify-between"><span style={{ color: 'var(--zp-ink-3)' }}>Joined</span><span className="font-mono" style={{ color: 'var(--zp-ink)' }}>{s.joined}</span></div>
                        </div>
                      </div>

                      <div>
                        <Eyebrow>Access permissions</Eyebrow>
                        <div className="space-y-1.5 mt-3 text-[12px]">
                          {(s.role === 'admin'
                            ? ['Overview', 'Bookings', 'Revenue', 'Analytics', 'Events', 'Cameras', 'Staff', 'Annotate', 'Settings']
                            : s.role === 'staff'
                            ? ['Gate Scanner']
                            : ['Revenue', 'Analytics', 'Events']
                          ).map(perm => (
                            <div key={perm} className="flex items-center gap-2">
                              <Icons.Check size={12} style={{ color: 'var(--zp-free)' }} />
                              <span style={{ color: 'var(--zp-ink-2)' }}>{perm}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Eyebrow>Actions</Eyebrow>
                        <div className="space-y-1.5 mt-3">
                          <ActionBtn>Edit profile →</ActionBtn>
                          <ActionBtn>Change role →</ActionBtn>
                          {s.role === 'staff' && <ActionBtn>View shift history →</ActionBtn>}
                          <ActionBtn>Reset password →</ActionBtn>
                          <ActionBtn danger>Suspend access →</ActionBtn>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}

function ActionBtn({ children, danger }) {
  const baseColor = danger ? 'var(--zp-full)' : 'var(--zp-ink-2)'
  const hoverBg = danger ? 'var(--zp-full-soft)' : 'var(--zp-primary-soft)'
  const hoverColor = danger ? 'var(--zp-full)' : 'var(--zp-primary)'
  return (
    <button
      className="w-full text-left px-3 py-2 text-[12px] rounded-md transition-colors"
      style={{ color: baseColor }}
      onMouseEnter={e => {
        e.currentTarget.style.background = hoverBg
        e.currentTarget.style.color = hoverColor
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = baseColor
      }}
    >
      {children}
    </button>
  )
}