import { useState, useRef, useMemo, useCallback } from 'react'
import {
  User, Users, MessageSquare, Search, Plus, X, Trash2,
  AlertTriangle, Bell, Shield, Camera, Eye, EyeOff, Wifi, WifiOff,
  Send, UserPlus, Check, ArrowUpDown, Sun, Moon, Monitor,
  type LucideIcon,
} from 'lucide-react'
import type {
  SettingsProps, SettingsTab, TeamMember, MessageTemplate,
  WhatsappGroup, NotificationPreferences,
} from '@/types/settings'
import { useTheme } from '@/hooks/useTheme'

/* ── Shared styles ── */

const INPUT = 'w-full rounded-xl border border-slate-200/50 bg-white/50 px-3 py-2.5 text-sm text-slate-700 backdrop-blur-sm transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300/30 dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-indigo-500/50'
const LABEL = 'mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400'

/* ── Notification config ── */

const NOTIF_ITEMS: { key: keyof NotificationPreferences; label: string; desc: string }[] = [
  { key: 'taskAssignment', label: 'Task Assignment', desc: 'When you are assigned to a task' },
  { key: 'approval', label: 'Approval', desc: 'When your task is approved' },
  { key: 'revision', label: 'Revision', desc: 'When your task needs revision' },
  { key: 'reassignment', label: 'Reassignment', desc: 'When task PICs are changed' },
  { key: 'deadlineAlert', label: 'Deadline Alert', desc: 'When a deadline is approaching' },
]

/* ── Helpers ── */

const relativeTime = (iso: string) => {
  const now = Date.now()
  const d = new Date(iso).getTime()
  const mins = Math.floor((now - d) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })

/* ================================================================
   SettingsView Component
   ================================================================ */

export function SettingsView({
  currentUser, activeTab, profileData, teamMembers,
  whatsappAccount, whatsappGroups, messageTemplates, availablePlaceholders,
  onTabChange, onProfileUpdate,
  onUserInvite, onUserUpdate, onUserDeactivate, onUserReactivate,
  onWhatsappAccountUpdate, onWhatsappTestConnection,
  onWhatsappGroupCreate, onWhatsappGroupUpdate, onWhatsappGroupDelete,
  onTemplateCreate, onTemplateUpdate, onTemplateDelete,
}: SettingsProps) {

  const isLeader = currentUser.role === 'Leader'
  const isSuperAdmin = currentUser.isSuperAdmin
  const { theme, setTheme } = useTheme()

  /* ── Tab ── */
  const [tab, setTab] = useState<SettingsTab>(activeTab)

  const visibleTabs = useMemo(() => {
    const t: { id: SettingsTab; label: string; icon: LucideIcon }[] = [
      { id: 'profile', label: 'My Profile', icon: User },
    ]
    if (isLeader) t.push({ id: 'users', label: 'User Management', icon: Users })
    if (isLeader || isSuperAdmin) t.push({ id: 'whatsapp', label: 'WhatsApp Config', icon: MessageSquare })
    return t
  }, [isLeader, isSuperAdmin])

  const switchTab = (t: SettingsTab) => { setTab(t); onTabChange?.(t) }

  /* ── Profile state ── */
  const [profileName, setProfileName] = useState(profileData.name)
  const [profileEmail, setProfileEmail] = useState(profileData.email)
  const [notifPrefs, setNotifPrefs] = useState({ ...profileData.notificationPreferences })

  const toggleNotif = (key: keyof NotificationPreferences) =>
    setNotifPrefs(p => ({ ...p, [key]: !p[key] }))

  const handleProfileSave = () => {
    onProfileUpdate?.({
      name: profileName,
      email: profileEmail,
      avatarUrl: profileData.avatarUrl,
      notificationPreferences: notifPrefs,
    })
  }

  /* ── User Management state ── */
  const [userSearch, setUserSearch] = useState('')
  const [userSort, setUserSort] = useState<{ col: string; dir: 'asc' | 'desc' }>({ col: 'name', dir: 'asc' })
  const [userModal, setUserModal] = useState<null | 'invite' | TeamMember>(null)
  const [deactivateConfirm, setDeactivateConfirm] = useState<TeamMember | null>(null)
  const [ufName, setUfName] = useState('')
  const [ufEmail, setUfEmail] = useState('')
  const [ufRole, setUfRole] = useState<'Leader' | 'PIC'>('PIC')
  const [ufSuperAdmin, setUfSuperAdmin] = useState(false)

  const sortedUsers = useMemo(() => {
    const q = userSearch.toLowerCase()
    const filtered = teamMembers.filter(u =>
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) || u.status.toLowerCase().includes(q)
    )
    return [...filtered].sort((a, b) => {
      const d = userSort.dir === 'asc' ? 1 : -1
      switch (userSort.col) {
        case 'name': return d * a.name.localeCompare(b.name)
        case 'email': return d * a.email.localeCompare(b.email)
        case 'role': return d * a.role.localeCompare(b.role)
        case 'status': return d * a.status.localeCompare(b.status)
        case 'lastActive': return d * (new Date(a.lastActiveAt).getTime() - new Date(b.lastActiveAt).getTime())
        default: return 0
      }
    })
  }, [teamMembers, userSearch, userSort])

  const toggleSort = (col: string) =>
    setUserSort(s => ({ col, dir: s.col === col && s.dir === 'asc' ? 'desc' : 'asc' }))

  const openInvite = () => {
    setUfName(''); setUfEmail(''); setUfRole('PIC'); setUfSuperAdmin(false)
    setUserModal('invite')
  }

  const openEditUser = (u: TeamMember) => {
    setUfName(u.name); setUfEmail(u.email); setUfRole(u.role); setUfSuperAdmin(u.isSuperAdmin)
    setUserModal(u)
  }

  const handleUserSave = () => {
    const data = { name: ufName.trim(), email: ufEmail.trim(), role: ufRole, isSuperAdmin: ufSuperAdmin }
    if (userModal === 'invite') onUserInvite?.(data)
    else if (userModal && typeof userModal === 'object') onUserUpdate?.(userModal.id, data)
    setUserModal(null)
  }

  const handleDeactivate = () => {
    if (!deactivateConfirm) return
    if (deactivateConfirm.status === 'Active') onUserDeactivate?.(deactivateConfirm.id)
    else onUserReactivate?.(deactivateConfirm.id)
    setDeactivateConfirm(null)
    setUserModal(null)
  }

  /* ── WhatsApp state ── */
  const [showApiKey, setShowApiKey] = useState(false)
  const [waApiKey, setWaApiKey] = useState('')
  const [waPhone, setWaPhone] = useState(whatsappAccount.phoneNumber)
  const [groupModal, setGroupModal] = useState<null | 'create' | WhatsappGroup>(null)
  const [gfName, setGfName] = useState('')
  const [gfId, setGfId] = useState('')
  const [gfType, setGfType] = useState<'Marketing' | 'Marketing-Finance'>('Marketing')

  const openCreateGroup = () => {
    setGfName(''); setGfId(''); setGfType('Marketing')
    setGroupModal('create')
  }

  const openEditGroup = (g: WhatsappGroup) => {
    setGfName(g.name); setGfId(''); setGfType(g.type)
    setGroupModal(g)
  }

  const handleGroupSave = () => {
    const data = { name: gfName.trim(), groupId: gfId.trim(), type: gfType }
    if (groupModal === 'create') onWhatsappGroupCreate?.(data)
    else if (groupModal && typeof groupModal === 'object') onWhatsappGroupUpdate?.(groupModal.id, data)
    setGroupModal(null)
  }

  const handleWaSave = () => {
    onWhatsappAccountUpdate?.({ apiKey: waApiKey, phoneNumber: waPhone })
  }

  /* ── Template state ── */
  const [templateModal, setTemplateModal] = useState<null | 'create' | MessageTemplate>(null)
  const [tfName, setTfName] = useState('')
  const [tfBody, setTfBody] = useState('')
  const [deleteTemplateConfirm, setDeleteTemplateConfirm] = useState<MessageTemplate | null>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const openCreateTemplate = () => {
    setTfName(''); setTfBody('')
    setTemplateModal('create')
  }

  const openEditTemplate = (t: MessageTemplate) => {
    setTfName(t.name); setTfBody(t.body)
    setTemplateModal(t)
  }

  const handleTemplateSave = () => {
    const data = { name: tfName.trim(), body: tfBody }
    if (templateModal === 'create') onTemplateCreate?.(data)
    else if (templateModal && typeof templateModal === 'object') onTemplateUpdate?.(templateModal.id, data)
    setTemplateModal(null)
  }

  const handleDeleteTemplate = () => {
    if (deleteTemplateConfirm) {
      onTemplateDelete?.(deleteTemplateConfirm.id)
      setDeleteTemplateConfirm(null)
      setTemplateModal(null)
    }
  }

  const insertPlaceholder = useCallback((key: string) => {
    const el = bodyRef.current
    const tag = `{{${key}}}`
    if (!el) { setTfBody(p => p + tag); return }
    const s = el.selectionStart
    const e = el.selectionEnd
    setTfBody(p => p.substring(0, s) + tag + p.substring(e))
    requestAnimationFrame(() => {
      el.focus()
      const pos = s + tag.length
      el.setSelectionRange(pos, pos)
    })
  }, [])

  const renderPreview = (body: string) => {
    let r = body
    availablePlaceholders.forEach(p => { r = r.split(`{{${p.key}}}`).join(p.example) })
    return r
  }

  /* ── Shared sub-renders ── */

  const SortHeader = ({ col, label }: { col: string; label: string }) => (
    <button onClick={() => toggleSort(col)} className="group flex items-center gap-1 text-left">
      <span>{label}</span>
      <ArrowUpDown className={`size-3 transition-colors ${userSort.col === col ? 'text-indigo-500' : 'text-slate-300 group-hover:text-slate-400 dark:text-slate-600'}`} />
    </button>
  )

  const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button type="button" onClick={onToggle}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${enabled ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}
    >
      <span className={`pointer-events-none mt-0.5 inline-block size-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${enabled ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
    </button>
  )

  return (
    <div className="flex h-full flex-col font-['Plus_Jakarta_Sans']">

      {/* ═══ Tab Bar ═══ */}
      <div className="shrink-0 border-b border-slate-200/40 px-4 pt-4 lg:px-6 lg:pt-5 dark:border-slate-700/30">
        <h1 className="mb-3 text-lg font-bold text-slate-800 dark:text-slate-100">Settings</h1>
        <div className="-mb-px flex gap-1 overflow-x-auto">
          {visibleTabs.map(t => {
            const active = tab === t.id
            const Icon = t.icon
            return (
              <button key={t.id} onClick={() => switchTab(t.id)}
                className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 pb-2.5 text-xs font-semibold transition-all ${
                  active
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="size-3.5" />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ═══ Tab Content ═══ */}
      <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

        {/* ─── MY PROFILE ─── */}
        {tab === 'profile' && (
          <div className="p-4 lg:p-6">
            {/* Avatar + Identity */}
            <div className="flex items-center gap-5 rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-700/40 dark:bg-slate-800/60">
              <div className="group relative flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-500/15 dark:to-violet-500/15">
                <User className="size-7 text-indigo-500" />
                <div className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-2xl bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="size-4 text-white" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">{profileData.name}</h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{profileData.email}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold ${profileData.role === 'Leader' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-400'}`}>
                    {profileData.role}
                  </span>
                  {profileData.isSuperAdmin && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                      <Shield className="size-2.5" />Super Admin
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Personal Info */}
            <div className="mt-5 rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-700/40 dark:bg-slate-800/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Personal Information</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={LABEL}>Full Name</label>
                  <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)} className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Email Address</label>
                  <input type="email" value={profileEmail} onChange={e => setProfileEmail(e.target.value)} className={INPUT} />
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="mt-5 rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-700/40 dark:bg-slate-800/60">
              <div className="flex items-center gap-2">
                <Bell className="size-4 text-indigo-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Notification Preferences</h3>
              </div>
              <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-700/30">
                {NOTIF_ITEMS.map(n => (
                  <div key={n.key} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{n.label}</p>
                      <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">{n.desc}</p>
                    </div>
                    <Toggle enabled={notifPrefs[n.key]} onToggle={() => toggleNotif(n.key)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Appearance */}
            <div className="mt-5 rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-700/40 dark:bg-slate-800/60">
              <div className="flex items-center gap-2">
                <Sun className="size-4 text-indigo-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Appearance</h3>
              </div>
              <div className="mt-4 flex gap-2">
                {([
                  { value: 'light' as const, label: 'Cerah', icon: Sun },
                  { value: 'dark' as const, label: 'Gelap', icon: Moon },
                  { value: 'system' as const, label: 'Sistem', icon: Monitor },
                ]).map(opt => {
                  const active = theme === opt.value
                  const Icon = opt.icon
                  return (
                    <button key={opt.value} type="button" onClick={() => setTheme(opt.value)}
                      className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-semibold transition-all ${
                        active
                          ? 'border-indigo-300 bg-indigo-50 text-indigo-600 dark:border-indigo-500/50 dark:bg-indigo-500/10 dark:text-indigo-400'
                          : 'border-slate-200/50 bg-white/50 text-slate-500 hover:bg-slate-50 dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="size-4" />
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Save */}
            <div className="mt-5 flex justify-end">
              <button onClick={handleProfileSave} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/30">
                <Check className="size-3.5" />Save Changes
              </button>
            </div>
          </div>
        )}

        {/* ─── USER MANAGEMENT ─── */}
        {tab === 'users' && isLeader && (
          <div className="p-4 lg:p-6">
            {/* Controls */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search users..." className={`${INPUT} pl-8`} />
              </div>
              <button onClick={openInvite} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/30">
                <UserPlus className="size-3.5" />Invite User
              </button>
            </div>

            {/* Table */}
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-sm backdrop-blur-xl dark:border-slate-700/40 dark:bg-slate-800/60">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/40 dark:border-slate-700/30">
                      {[
                        { col: 'name', label: 'Name' },
                        { col: 'email', label: 'Email' },
                        { col: 'role', label: 'Role' },
                        { col: 'status', label: 'Status' },
                        { col: 'lastActive', label: 'Last Active' },
                      ].map(h => (
                        <th key={h.col} className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">
                          <SortHeader col={h.col} label={h.label} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedUsers.map(u => (
                      <tr key={u.id} onClick={() => openEditUser(u)}
                        className="cursor-pointer border-b border-slate-100/50 transition-colors last:border-0 hover:bg-slate-50/60 dark:border-slate-700/20 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 text-[10px] font-bold text-indigo-600 dark:from-indigo-500/15 dark:to-violet-500/15 dark:text-indigo-400">
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-700 dark:text-slate-200">{u.name}</span>
                              {u.isSuperAdmin && <Shield className="ml-1 inline size-2.5 text-amber-500" />}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${u.role === 'Leader' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-400'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1.5">
                            <span className={`size-1.5 rounded-full ${u.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                            <span className={u.status === 'Active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}>{u.status}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{relativeTime(u.lastActiveAt)}</td>
                      </tr>
                    ))}
                    {sortedUsers.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400 dark:text-slate-500">No users found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── WHATSAPP CONFIG ─── */}
        {tab === 'whatsapp' && (isLeader || isSuperAdmin) && (
          <div className="p-4 lg:p-6">

            {/* API Settings — SuperAdmin only */}
            {isSuperAdmin && (
            <div className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-700/40 dark:bg-slate-800/60">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/15">
                  <Wifi className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">API Settings</h3>
                <span className={`ml-auto flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold ${whatsappAccount.connectionStatus === 'Connected' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400'}`}>
                  {whatsappAccount.connectionStatus === 'Connected' ? <Wifi className="size-2.5" /> : <WifiOff className="size-2.5" />}
                  {whatsappAccount.connectionStatus}
                </span>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={LABEL}>API Key</label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={waApiKey || ''}
                      onChange={e => setWaApiKey(e.target.value)}
                      placeholder={showApiKey ? whatsappAccount.apiKey : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
                      className={`${INPUT} pr-9 font-mono text-xs`}
                    />
                    <button type="button" onClick={() => setShowApiKey(!showApiKey)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300">
                      {showApiKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">Current: {whatsappAccount.apiKey}</p>
                </div>
                <div>
                  <label className={LABEL}>Phone Number</label>
                  <input type="text" value={waPhone} onChange={e => setWaPhone(e.target.value)} className={INPUT} />
                </div>
              </div>
              {whatsappAccount.lastTestedAt && (
                <p className="mt-3 text-[10px] text-slate-400 dark:text-slate-500">Last tested: {formatDate(whatsappAccount.lastTestedAt)}</p>
              )}
              <div className="mt-4 flex items-center gap-2">
                <button onClick={() => onWhatsappTestConnection?.()} className="flex items-center gap-1.5 rounded-xl border border-slate-200/50 bg-white/50 px-4 py-2 text-xs font-semibold text-slate-600 backdrop-blur-sm transition-all hover:bg-white/80 dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-300">
                  <Send className="size-3" />Test Connection
                </button>
                <button onClick={handleWaSave} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl">
                  <Check className="size-3" />Save
                </button>
              </div>
            </div>
            )}

            {/* Groups — SuperAdmin only */}
            {isSuperAdmin && (
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">WhatsApp Groups</h3>
                <button onClick={openCreateGroup} className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-3 py-1.5 text-[10px] font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl">
                  <Plus className="size-3" />Add Group
                </button>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {whatsappGroups.map(g => (
                  <button key={g.id} onClick={() => openEditGroup(g)}
                    className="flex flex-col rounded-2xl border border-white/60 bg-white/80 p-4 text-left shadow-sm transition-all hover:bg-white/95 hover:shadow-md dark:border-slate-700/40 dark:bg-slate-800/60 dark:hover:bg-slate-800/80"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">{g.name}</h4>
                      <span className={`size-2 rounded-full ${g.connectionStatus === 'Connected' ? 'bg-emerald-500' : 'bg-rose-400'}`} />
                    </div>
                    <span className={`mt-1.5 inline-flex w-fit items-center rounded-lg px-2 py-0.5 text-[10px] font-bold ${g.type === 'Marketing' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400'}`}>
                      {g.type}
                    </span>
                    <div className="mt-3 flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400">
                      <span>{g.memberCount} members</span>
                      {g.lastMessageSentAt && <span>Last msg: {relativeTime(g.lastMessageSentAt)}</span>}
                    </div>
                  </button>
                ))}
                {whatsappGroups.length === 0 && (
                  <div className="col-span-full py-10 text-center text-xs text-slate-400 dark:text-slate-500">No groups configured</div>
                )}
              </div>
            </div>
            )}

            {/* Message Templates — Leader + SuperAdmin */}
            <div className={isSuperAdmin ? 'mt-6' : ''}>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Message Templates</h3>
                <button onClick={openCreateTemplate} className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-3 py-1.5 text-[10px] font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl">
                  <Plus className="size-3" />Add Template
                </button>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {messageTemplates.map(t => (
                  <button key={t.id} onClick={() => openEditTemplate(t)}
                    className="flex flex-col rounded-2xl border border-white/60 bg-white/80 p-4 text-left shadow-sm transition-all hover:bg-white/95 hover:shadow-md dark:border-slate-700/40 dark:bg-slate-800/60 dark:hover:bg-slate-800/80"
                  >
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">{t.name}</h4>
                    <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{t.body}</p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {t.placeholders.map(p => (
                        <span key={p} className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">{`{{${p}}}`}</span>
                      ))}
                    </div>
                    <span className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">{t.usedByCount} reminder{t.usedByCount !== 1 ? 's' : ''}</span>
                  </button>
                ))}
                {messageTemplates.length === 0 && (
                  <div className="col-span-full py-10 text-center text-xs text-slate-400 dark:text-slate-500">No templates yet</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ MODALS ═══ */}

      {/* ─── Invite / Edit User Modal ─── */}
      {userModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setUserModal(null)} />
          <div className="relative w-full max-w-md rounded-t-2xl border border-white/60 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl sm:rounded-2xl dark:border-slate-700/40 dark:bg-slate-900/95">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {userModal === 'invite' ? 'Invite New User' : `Edit ${typeof userModal === 'object' ? userModal.name : ''}`}
              </h3>
              <button onClick={() => setUserModal(null)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="size-4" /></button>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className={LABEL}>Full Name *</label>
                <input type="text" value={ufName} onChange={e => setUfName(e.target.value)} placeholder="Jane Doe" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Email *</label>
                <input type="email" value={ufEmail} onChange={e => setUfEmail(e.target.value)} placeholder="jane@company.com" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Role</label>
                <div className="flex gap-2">
                  {(['Leader', 'PIC'] as const).map(r => (
                    <button key={r} type="button" onClick={() => setUfRole(r)}
                      className={`flex-1 rounded-xl border py-2.5 text-xs font-semibold transition-all ${ufRole === r ? 'border-indigo-300 bg-indigo-50 text-indigo-600 dark:border-indigo-500/50 dark:bg-indigo-500/10 dark:text-indigo-400' : 'border-slate-200/50 bg-white/50 text-slate-500 hover:bg-slate-50 dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-400'}`}
                    >{r}</button>
                  ))}
                </div>
              </div>
              {isSuperAdmin && (
                <div className="flex items-center justify-between rounded-xl border border-slate-200/50 bg-white/50 px-4 py-3 dark:border-slate-700/40 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2">
                    <Shield className="size-3.5 text-amber-500" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Super Admin</span>
                  </div>
                  <Toggle enabled={ufSuperAdmin} onToggle={() => setUfSuperAdmin(!ufSuperAdmin)} />
                </div>
              )}
              {/* Deactivate / Reactivate */}
              {userModal !== 'invite' && typeof userModal === 'object' && userModal.id !== currentUser.id && (
                <button
                  onClick={() => setDeactivateConfirm(userModal)}
                  className={`w-full rounded-xl border py-2.5 text-xs font-semibold transition-all ${
                    userModal.status === 'Active'
                      ? 'border-rose-200/50 text-rose-500 hover:bg-rose-50 dark:border-rose-500/20 dark:text-rose-400 dark:hover:bg-rose-500/10'
                      : 'border-emerald-200/50 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/10'
                  }`}
                >
                  {userModal.status === 'Active' ? 'Deactivate User' : 'Reactivate User'}
                </button>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setUserModal(null)} className="rounded-xl border border-slate-200/50 bg-white/50 px-4 py-2 text-xs font-semibold text-slate-600 backdrop-blur-sm transition-all hover:bg-white/80 dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-300">Cancel</button>
              <button onClick={handleUserSave} disabled={!ufName.trim() || !ufEmail.trim()} className="rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl disabled:opacity-40">
                {userModal === 'invite' ? 'Send Invite' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Deactivate / Reactivate Confirmation ─── */}
      {deactivateConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeactivateConfirm(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-white/60 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl dark:border-slate-700/40 dark:bg-slate-900/95">
            <div className={`flex size-12 items-center justify-center rounded-2xl ${deactivateConfirm.status === 'Active' ? 'bg-rose-100 dark:bg-rose-500/15' : 'bg-emerald-100 dark:bg-emerald-500/15'}`}>
              <AlertTriangle className={`size-6 ${deactivateConfirm.status === 'Active' ? 'text-rose-500' : 'text-emerald-500'}`} />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-800 dark:text-slate-100">
              {deactivateConfirm.status === 'Active' ? 'Deactivate' : 'Reactivate'} {deactivateConfirm.name}?
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {deactivateConfirm.status === 'Active'
                ? 'This user will no longer be able to log in. Their data will be preserved and you can reactivate them later.'
                : 'This user will be able to log in again and access the platform.'}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setDeactivateConfirm(null)} className="rounded-xl border border-slate-200/50 bg-white/50 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-white/80 dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-300">Cancel</button>
              <button onClick={handleDeactivate} className={`rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all ${deactivateConfirm.status === 'Active' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
                {deactivateConfirm.status === 'Active' ? 'Deactivate' : 'Reactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── WhatsApp Group Modal ─── */}
      {groupModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setGroupModal(null)} />
          <div className="relative w-full max-w-md rounded-t-2xl border border-white/60 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl sm:rounded-2xl dark:border-slate-700/40 dark:bg-slate-900/95">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {groupModal === 'create' ? 'Add WhatsApp Group' : `Edit ${typeof groupModal === 'object' ? groupModal.name : ''}`}
              </h3>
              <button onClick={() => setGroupModal(null)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="size-4" /></button>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className={LABEL}>Group Name *</label>
                <input type="text" value={gfName} onChange={e => setGfName(e.target.value)} placeholder="Marketing Team Updates" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Group ID *</label>
                <input type="text" value={gfId} onChange={e => setGfId(e.target.value)} placeholder="120363xxxxx@g.us" className={`${INPUT} font-mono text-xs`} />
                {groupModal !== 'create' && typeof groupModal === 'object' && (
                  <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">Current: {groupModal.groupId}</p>
                )}
              </div>
              <div>
                <label className={LABEL}>Type</label>
                <div className="flex gap-2">
                  {(['Marketing', 'Marketing-Finance'] as const).map(t => (
                    <button key={t} type="button" onClick={() => setGfType(t)}
                      className={`flex-1 rounded-xl border py-2.5 text-xs font-semibold transition-all ${gfType === t ? 'border-indigo-300 bg-indigo-50 text-indigo-600 dark:border-indigo-500/50 dark:bg-indigo-500/10 dark:text-indigo-400' : 'border-slate-200/50 bg-white/50 text-slate-500 hover:bg-slate-50 dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-400'}`}
                    >{t}</button>
                  ))}
                </div>
              </div>
              {/* Delete group */}
              {groupModal !== 'create' && typeof groupModal === 'object' && (
                <button onClick={() => { onWhatsappGroupDelete?.(groupModal.id); setGroupModal(null) }}
                  className="flex w-full items-center justify-center gap-1 rounded-xl border border-rose-200/50 py-2.5 text-xs font-semibold text-rose-500 transition-all hover:bg-rose-50 dark:border-rose-500/20 dark:text-rose-400 dark:hover:bg-rose-500/10">
                  <Trash2 className="size-3" />Remove Group
                </button>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setGroupModal(null)} className="rounded-xl border border-slate-200/50 bg-white/50 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-white/80 dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-300">Cancel</button>
              <button onClick={handleGroupSave} disabled={!gfName.trim() || !gfId.trim()} className="rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl disabled:opacity-40">
                {groupModal === 'create' ? 'Add Group' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Template Modal ─── */}
      {templateModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setTemplateModal(null)} />
          <div className="relative w-full max-w-3xl rounded-t-2xl border border-white/60 bg-white/95 shadow-2xl backdrop-blur-2xl sm:rounded-2xl dark:border-slate-700/40 dark:bg-slate-900/95">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200/40 px-6 py-4 dark:border-slate-700/30">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {templateModal === 'create' ? 'New Message Template' : `Edit ${typeof templateModal === 'object' ? templateModal.name : ''}`}
              </h3>
              <button onClick={() => setTemplateModal(null)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="size-4" /></button>
            </div>

            {/* Split layout */}
            <div className="grid gap-0 sm:grid-cols-2">
              {/* Form */}
              <div className="border-b border-slate-200/40 p-6 sm:border-b-0 sm:border-r dark:border-slate-700/30">
                <div className="space-y-4">
                  <div>
                    <label className={LABEL}>Template Name *</label>
                    <input type="text" value={tfName} onChange={e => setTfName(e.target.value)} placeholder="Task Deadline Reminder" className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>Body *</label>
                    <textarea
                      ref={bodyRef}
                      value={tfBody}
                      onChange={e => setTfBody(e.target.value)}
                      placeholder="Write your message template..."
                      rows={6}
                      className={`${INPUT} resize-none`}
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Insert Placeholder</label>
                    <div className="flex flex-wrap gap-1.5">
                      {availablePlaceholders.map(p => (
                        <button key={p.key} type="button" onClick={() => insertPlaceholder(p.key)}
                          className="rounded-lg bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-600 transition-all hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20"
                        >{`{{${p.key}}}`}</button>
                      ))}
                    </div>
                  </div>
                  {/* Delete template */}
                  {templateModal !== 'create' && typeof templateModal === 'object' && (
                    <button onClick={() => {
                      if (templateModal.usedByCount > 0) setDeleteTemplateConfirm(templateModal)
                      else { onTemplateDelete?.(templateModal.id); setTemplateModal(null) }
                    }}
                      className="flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold text-rose-500 transition-all hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10">
                      <Trash2 className="size-3" />Delete Template
                    </button>
                  )}
                </div>
              </div>

              {/* Preview */}
              <div className="p-6">
                <label className={LABEL}>Live Preview</label>
                <div className="rounded-xl border border-slate-200/40 bg-slate-50/80 p-4 dark:border-slate-700/30 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500">
                      <MessageSquare className="size-3.5 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200">WhatsApp Message</p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500">Preview with sample data</p>
                    </div>
                  </div>
                  <div className="mt-3 rounded-lg bg-white/80 p-3 shadow-sm dark:bg-slate-700/40">
                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700 dark:text-slate-200">
                      {tfBody ? renderPreview(tfBody) : <span className="italic text-slate-400 dark:text-slate-500">Start typing to see preview...</span>}
                    </p>
                  </div>
                  {tfBody && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {availablePlaceholders.filter(p => tfBody.includes(`{{${p.key}}}`)).map(p => (
                        <span key={p.key} className="rounded-md bg-indigo-50/80 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
                          {p.label}: {p.example}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 border-t border-slate-200/40 px-6 py-4 dark:border-slate-700/30">
              <button onClick={() => setTemplateModal(null)} className="rounded-xl border border-slate-200/50 bg-white/50 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-white/80 dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-300">Cancel</button>
              <button onClick={handleTemplateSave} disabled={!tfName.trim() || !tfBody.trim()} className="rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl disabled:opacity-40">
                {templateModal === 'create' ? 'Create Template' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Template Warning ─── */}
      {deleteTemplateConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeleteTemplateConfirm(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-white/60 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl dark:border-slate-700/40 dark:bg-slate-900/95">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-500/15">
              <AlertTriangle className="size-6 text-rose-500" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-800 dark:text-slate-100">Delete &ldquo;{deleteTemplateConfirm.name}&rdquo;?</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              This template is used by <span className="font-semibold text-slate-700 dark:text-slate-200">{deleteTemplateConfirm.usedByCount} reminder{deleteTemplateConfirm.usedByCount !== 1 ? 's' : ''}</span>. Deleting it will remove the template from those reminders. Are you sure?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setDeleteTemplateConfirm(null)} className="rounded-xl border border-slate-200/50 bg-white/50 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-white/80 dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-300">Cancel</button>
              <button onClick={handleDeleteTemplate} className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
