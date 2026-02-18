import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Plus, X, Filter, Search, ArrowUpDown, ArrowUp, ArrowDown,
  AlertTriangle, CheckCircle2, RotateCcw, Archive,
  Columns3, Table2, LayoutGrid, UserCircle, Play, Send, Eye, UserPlus,
  Bell, ToggleLeft, ToggleRight, Trash2, Pencil, Save,
} from 'lucide-react'
import type {
  TaskboardProps, BoardTask, BoardGrouping, TaskStatus, TaskDetail, TaskPriority,
  PicRef, UserRef, WaChannel,
} from '@/types/taskboard'
import type { ReminderConfig, ReminderTrigger } from '@/types/calendar'
import { FilterDropdown } from '@/components/shared/FilterDropdown'
import {
  isActivityPicFor as _isActivityPicFor,
  isCreatorOf as _isCreatorOf,
  isAssignedTo as _isAssignedTo,
  canEditStatus as _canEditStatus,
  canManagePics as _canManagePics,
  canAddPicOnly as _canAddPicOnly,
  canEditTask as _canEditTask,
  canDeleteTask as _canDeleteTask,
} from '@/lib/taskboard-auth'

/* ================================================================
   Config
   ================================================================ */

const COLOR: Record<string, { dot: string; softBg: string; softText: string }> = {
  rose:   { dot: 'bg-rose-500',   softBg: 'bg-rose-50 dark:bg-rose-500/10',     softText: 'text-rose-600 dark:text-rose-400' },
  violet: { dot: 'bg-violet-500', softBg: 'bg-violet-50 dark:bg-violet-500/10', softText: 'text-violet-600 dark:text-violet-400' },
  pink:   { dot: 'bg-pink-500',   softBg: 'bg-pink-50 dark:bg-pink-500/10',     softText: 'text-pink-600 dark:text-pink-400' },
  amber:  { dot: 'bg-amber-500',  softBg: 'bg-amber-50 dark:bg-amber-500/10',   softText: 'text-amber-600 dark:text-amber-400' },
  teal:   { dot: 'bg-teal-500',   softBg: 'bg-teal-50 dark:bg-teal-500/10',     softText: 'text-teal-600 dark:text-teal-400' },
  sky:    { dot: 'bg-sky-500',    softBg: 'bg-sky-50 dark:bg-sky-500/10',       softText: 'text-sky-600 dark:text-sky-400' },
  indigo: { dot: 'bg-indigo-500', softBg: 'bg-indigo-50 dark:bg-indigo-500/10', softText: 'text-indigo-600 dark:text-indigo-400' },
}

const STATUS_CFG: Record<TaskStatus, { dot: string; bg: string; text: string }> = {
  'To Do':       { dot: 'bg-slate-400',   bg: 'bg-slate-100 dark:bg-slate-700/40',     text: 'text-slate-600 dark:text-slate-300' },
  'In Progress': { dot: 'bg-indigo-500',  bg: 'bg-indigo-100 dark:bg-indigo-500/15',   text: 'text-indigo-700 dark:text-indigo-300' },
  'Need Review': { dot: 'bg-amber-500',   bg: 'bg-amber-100 dark:bg-amber-500/15',     text: 'text-amber-700 dark:text-amber-300' },
  'Revision':    { dot: 'bg-rose-500',    bg: 'bg-rose-100 dark:bg-rose-500/15',       text: 'text-rose-700 dark:text-rose-300' },
  'Approved':    { dot: 'bg-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-300' },
  'Archived':    { dot: 'bg-slate-300',   bg: 'bg-slate-100/50 dark:bg-slate-700/20',  text: 'text-slate-400 dark:text-slate-500' },
}

const PRIORITY_CFG: Record<TaskPriority, { bg: string; text: string; label: string }> = {
  Low:    { bg: 'bg-slate-100 dark:bg-slate-700/30',     text: 'text-slate-500 dark:text-slate-400', label: 'Low' },
  Medium: { bg: 'bg-amber-100 dark:bg-amber-500/15',     text: 'text-amber-700 dark:text-amber-300', label: 'Med' },
  High:   { bg: 'bg-rose-100 dark:bg-rose-500/15',       text: 'text-rose-700 dark:text-rose-300',   label: 'High' },
}

const MONTH = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const GLASS = 'rounded-2xl border border-white/60 bg-white/70 shadow-sm shadow-slate-900/[0.03] backdrop-blur-xl dark:border-slate-700/40 dark:bg-slate-800/60 dark:shadow-black/10'
const INPUT = 'w-full rounded-xl border border-slate-200/50 bg-white/50 px-3 py-2.5 text-sm text-slate-700 backdrop-blur-sm transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300/30 dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-indigo-500/50'
const LABEL = 'mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400'

const TRIGGERS: { value: ReminderTrigger; label: string }[] = [
  { value: 'H-7', label: 'H-7 (7 days before)' },
  { value: 'H-3', label: 'H-3 (3 days before)' },
  { value: 'H-1', label: 'H-1 (1 day before)' },
  { value: 'Day-H', label: 'Day-H (On the day)' },
  { value: 'Custom', label: 'Custom' },
]

const GROUPING_OPTS: { value: BoardGrouping; label: string; icon: typeof Columns3 }[] = [
  { value: 'status', label: 'By Status', icon: Columns3 },
  { value: 'activity', label: 'By Activity', icon: LayoutGrid },
  { value: 'pic', label: 'By PIC', icon: UserCircle },
  { value: 'table', label: 'Table', icon: Table2 },
]

/* ── Utilities ── */

function parseDate(s: string) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
function fmtShort(s: string) { const d = parseDate(s); return `${d.getDate()} ${MONTH[d.getMonth()]}` }
function fmtTime(s: string) { const d = new Date(s); return `${d.getDate()} ${MONTH[d.getMonth()]} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}` }
function getInitials(n: string) { return n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2) }

/* ── Searchable Tag Input ── */

function TagSelect<T extends { id: string }>({ items, selectedIds, onToggle, getLabel, placeholder, renderTag, renderOption }: {
  items: T[]; selectedIds: string[]; onToggle: (id: string) => void; getLabel: (i: T) => string; placeholder: string
  renderTag?: (i: T, rm: () => void) => React.ReactNode; renderOption?: (i: T) => React.ReactNode
}) {
  const [q, setQ] = useState(''); const [open, setOpen] = useState(false); const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h) }, [])
  const sel = items.filter(i => selectedIds.includes(i.id))
  const filt = items.filter(i => !selectedIds.includes(i.id) && getLabel(i).toLowerCase().includes(q.toLowerCase()))
  return (
    <div ref={ref} className="relative">
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200/50 bg-white/50 px-2.5 py-2 backdrop-blur-sm transition-all focus-within:border-indigo-300 focus-within:ring-1 focus-within:ring-indigo-300/30 dark:border-slate-700/40 dark:bg-slate-800/40 dark:focus-within:border-indigo-500/50">
        {sel.map(item => renderTag ? <span key={item.id}>{renderTag(item, () => onToggle(item.id))}</span> : (
          <span key={item.id} className="flex items-center gap-1 rounded-lg bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
            {getLabel(item)}<button type="button" onClick={() => onToggle(item.id)} className="ml-0.5 text-indigo-400 hover:text-indigo-600"><X className="size-3" /></button>
          </span>
        ))}
        <div className="flex min-w-[80px] flex-1 items-center gap-1">
          <Search className="size-3 shrink-0 text-slate-400" />
          <input value={q} onChange={e => { setQ(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)} placeholder={sel.length ? 'Search...' : placeholder} className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200 dark:placeholder:text-slate-500" />
        </div>
      </div>
      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-xl border border-white/60 bg-white/95 shadow-xl backdrop-blur-2xl dark:border-slate-700/40 dark:bg-slate-900/95">
          {filt.length === 0 ? <p className="px-3 py-3 text-center text-xs text-slate-400">{q ? 'No results' : 'All selected'}</p> : filt.map(item => (
            <button key={item.id} type="button" onClick={() => { onToggle(item.id); setQ('') }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
              {renderOption ? renderOption(item) : <span className="font-medium text-slate-700 dark:text-slate-200">{getLabel(item)}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Avatar Stack ── */

function AvatarStack({ pics, variant = 'dark' }: { pics: PicRef[]; variant?: 'light' | 'dark' }) {
  const max = 3; const vis = pics.slice(0, max); const ov = pics.length - max
  const base = variant === 'light'
    ? 'bg-white/25 ring-1 ring-white/40 text-white'
    : 'bg-slate-200/60 ring-1 ring-white/80 text-slate-600 dark:bg-slate-700/40 dark:ring-slate-600/40 dark:text-slate-300'
  return (
    <div className="flex -space-x-1.5">
      {vis.map(p => (<div key={p.id} className={`flex size-5 items-center justify-center rounded-full text-[7px] font-bold ${base}`}>{getInitials(p.name)}</div>))}
      {ov > 0 && <div className={`flex size-5 items-center justify-center rounded-full text-[7px] font-bold ${base} opacity-80`}>+{ov}</div>}
    </div>
  )
}

/* ================================================================
   TaskboardView Component
   ================================================================ */

export function TaskboardView({
  currentUser, currentGrouping, tasks, activities, activityTypes, users, statuses, filter,
  reminderTemplates, waChannels = [],
  onGroupingChange, onTaskClick, onTaskStatusChange, onTaskCreate, onTaskUpdate, onTaskDelete,
  onPicAdd, onPicRemove, onTaskApprove, onTaskRevision, onTaskArchive, onTaskReopen, onFilterChange,
  taskDetail, onTaskDetailClose,
}: TaskboardProps & { taskDetail?: TaskDetail | null; onTaskDetailClose?: () => void; waChannels?: WaChannel[] }) {

  const [grouping, setGrouping] = useState<BoardGrouping>(currentGrouping)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [panelMode, setPanelMode] = useState<'detail' | 'create' | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [addingPic, setAddingPic] = useState(false)
  const [sortKey, setSortKey] = useState<string>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [searchQuery, setSearchQuery] = useState('')

  // Edit/Delete state
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editPriority, setEditPriority] = useState<TaskPriority>('Medium')
  const [editStartDate, setEditStartDate] = useState('')
  const [editEndDate, setEditEndDate] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  // Create form state
  const [formName, setFormName] = useState('')
  const [formActivityId, setFormActivityId] = useState('')
  const [formPicIds, setFormPicIds] = useState<string[]>([])
  const [formPriority, setFormPriority] = useState<TaskPriority>('Medium')
  const [formStartDate, setFormStartDate] = useState('')
  const [formEndDate, setFormEndDate] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formReminders, setFormReminders] = useState<ReminderConfig[]>([])

  const isLeader = currentUser.role === 'Leader'
  const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) ?? null : null
  const selectedActivity = formActivityId ? activities.find(a => a.id === formActivityId) ?? null : null

  /* ── Authority helpers (delegated to pure functions in taskboard-auth.ts) ── */
  const isActivityPicFor = (actId: string) => _isActivityPicFor(activities, currentUser.id, actId)
  const isCreatorOf = (task: BoardTask) => _isCreatorOf(currentUser.id, task)
  const isAssignedTo = (task: BoardTask) => _isAssignedTo(currentUser.id, task)
  const canEditStatus = (task: BoardTask) => _canEditStatus(currentUser, activities, task)
  const canManagePics = (task: BoardTask) => _canManagePics(currentUser, activities, task)
  const canAddPicOnly = (task: BoardTask) => _canAddPicOnly(currentUser, activities, task)
  const canEditTask = (task: BoardTask) => _canEditTask(currentUser, task)
  const canDeleteTask = (task: BoardTask) => _canDeleteTask(currentUser, task)

  /* ── Activities filtered by membership for create form ── */
  const availableActivities = useMemo(() => {
    if (isLeader) return activities
    return activities.filter(a => a.picIds.includes(currentUser.id))
  }, [activities, isLeader, currentUser.id])

  /* ── Search + Filtering ── */
  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (!filter.showArchived && t.status === 'Archived') return false
      if (filter.activityIds.length > 0 && !filter.activityIds.includes(t.activityId)) return false
      if (filter.picIds.length > 0 && !t.pics.some(p => filter.picIds.includes(p.id)) && !filter.picIds.includes(t.creatorId)) return false
      if (filter.statuses.length > 0 && !filter.statuses.includes(t.status)) return false
      if (filter.activityTypeIds.length > 0) {
        const at = activityTypes.find(a => a.name === t.activityTypeName)
        if (at && !filter.activityTypeIds.includes(at.id)) return false
      }
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!t.name.toLowerCase().includes(q) && !t.activityName.toLowerCase().includes(q) && !t.activityTypeName.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [tasks, filter, activityTypes, searchQuery])

  /* ── Grouping ── */
  const grouped = useMemo(() => {
    if (grouping === 'status') {
      const cols = filter.showArchived ? statuses : statuses.filter(s => s !== 'Archived')
      return cols.map(s => ({ key: s, title: s, tasks: filtered.filter(t => t.status === s), color: STATUS_CFG[s].dot }))
    }
    if (grouping === 'activity') {
      // When activity filter active: only show filtered activities
      // When no filter: show all activities (even empty ones)
      const visibleActivities = filter.activityIds.length > 0
        ? activities.filter(a => filter.activityIds.includes(a.id))
        : activities
      return visibleActivities.map(a => ({ key: a.id, title: a.name, tasks: filtered.filter(t => t.activityId === a.id), color: (COLOR[a.activityTypeColor] ?? COLOR.indigo).dot }))
    }
    if (grouping === 'pic') {
      // Exclude Leaders, only show PICs that have matching tasks
      return users
        .filter(u => u.role !== 'Leader')
        .map(u => ({ key: u.id, title: u.name, tasks: filtered.filter(t => t.pics.some(p => p.id === u.id)), color: 'bg-indigo-500' }))
        .filter(col => col.tasks.length > 0)
    }
    return []
  }, [grouping, filtered, statuses, activities, users, filter.showArchived])

  /* ── Table sorting ── */
  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      let va = '', vb = ''
      if (sortKey === 'name') { va = a.name; vb = b.name }
      else if (sortKey === 'activity') { va = a.activityName; vb = b.activityName }
      else if (sortKey === 'status') { va = a.status; vb = b.status }
      else if (sortKey === 'priority') { const o: Record<string, string> = { High: '0', Medium: '1', Low: '2' }; va = o[a.priority] ?? '1'; vb = o[b.priority] ?? '1' }
      else if (sortKey === 'endDate') { va = a.endDate; vb = b.endDate }
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })
    return arr
  }, [filtered, sortKey, sortDir])

  /* ── Handlers ── */
  const switchGrouping = (g: BoardGrouping) => { setGrouping(g); onGroupingChange?.(g) }
  const openDetail = (id: string) => { setSelectedTaskId(id); setPanelMode('detail'); setFeedback(''); setAddingPic(false); setEditing(false); setDeleteConfirm(false); onTaskClick?.(id) }
  const openCreate = () => { setPanelMode('create'); setSelectedTaskId(null); setFormName(''); setFormActivityId(''); setFormPicIds([]); setFormPriority('Medium'); setFormStartDate(''); setFormEndDate(''); setFormDesc(''); setFormReminders([{ id: `rem-${Date.now()}`, trigger: 'H-3', channel: waChannels[0]?.type ?? 'Marketing', templateId: reminderTemplates[0]?.id ?? '', enabled: true }]) }
  const closePanel = () => { setPanelMode(null); setSelectedTaskId(null); setAddingPic(false); setEditing(false); setDeleteConfirm(false); onTaskDetailClose?.() }

  const startEditing = () => {
    if (!selectedTask || !taskDetail || taskDetail.id !== selectedTask.id) return
    setEditName(taskDetail.name)
    setEditDesc(taskDetail.description || '')
    setEditPriority(selectedTask.priority)
    setEditStartDate(selectedTask.startDate)
    setEditEndDate(selectedTask.endDate)
    setEditing(true)
  }
  const cancelEditing = () => { setEditing(false); setDeleteConfirm(false) }
  const saveEditing = () => {
    if (!selectedTask || !editName) return
    onTaskUpdate?.(selectedTask.id, { name: editName, description: editDesc, priority: editPriority, startDate: editStartDate, endDate: editEndDate })
    setEditing(false)
  }
  const handleDelete = () => {
    if (!selectedTask) return
    onTaskDelete?.(selectedTask.id)
    closePanel()
  }

  /* ── Conflict warnings for create form ── */
  const picConflicts = useMemo(() => {
    if (!formStartDate || !formEndDate || formPicIds.length === 0) return []
    const warnings: string[] = []
    for (const picId of formPicIds) {
      const picUser = users.find(u => u.id === picId)
      if (!picUser) continue
      const overlapping = tasks.filter(t =>
        t.pics.some(p => p.id === picId) &&
        t.startDate <= formEndDate && t.endDate >= formStartDate
      )
      if (overlapping.length > 0) {
        warnings.push(`${picUser.name} sudah punya ${overlapping.length} task di rentang tanggal ini`)
      }
    }
    return warnings
  }, [formPicIds, formStartDate, formEndDate, tasks, users])

  const handleCreate = () => {
    if (!formName || !formActivityId || formPicIds.length === 0) return
    onTaskCreate?.({ name: formName, activityId: formActivityId, picIds: formPicIds, priority: formPriority, startDate: formStartDate, endDate: formEndDate, description: formDesc, reminders: formReminders })
    closePanel()
  }

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }
  const SortIcon = ({ k }: { k: string }) => sortKey === k ? (sortDir === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ArrowUpDown className="size-3 opacity-40" />

  const filterCount = filter.activityIds.length + filter.picIds.length + filter.statuses.length + filter.activityTypeIds.length + (filter.showArchived ? 1 : 0)

  return (
    <div className="relative flex h-full flex-col font-['Plus_Jakarta_Sans']">

      {/* ─── Top Bar ─── */}
      <div className="relative z-20 shrink-0 space-y-3 p-4 pb-0 lg:px-6 lg:pt-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: Grouping Switcher */}
          <div className="flex rounded-xl border border-white/60 bg-white/50 p-0.5 shadow-sm backdrop-blur-xl dark:border-slate-700/40 dark:bg-slate-800/40">
            {GROUPING_OPTS.map(opt => {
              const Icon = opt.icon
              return (
                <button key={opt.value} onClick={() => switchGrouping(opt.value)} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${grouping === opt.value ? 'bg-white/90 text-indigo-600 shadow-sm dark:bg-slate-700/70 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>
                  <Icon className="size-3.5" />{opt.label}
                </button>
              )
            })}
          </div>
          {/* Right: Search + Filter + Create */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="flex items-center gap-1.5 rounded-xl border border-white/60 bg-white/70 px-3 py-1.5 shadow-sm backdrop-blur-xl transition-all focus-within:border-indigo-300 focus-within:ring-1 focus-within:ring-indigo-300/30 dark:border-slate-700/40 dark:bg-slate-800/60 dark:focus-within:border-indigo-500/50">
              <Search className="size-3.5 text-slate-400" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search tasks or activities..."
                className="w-32 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400 lg:w-44 dark:text-slate-200 dark:placeholder:text-slate-500"
              />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600"><X className="size-3" /></button>}
            </div>
            <button onClick={() => setFilterOpen(!filterOpen)} className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${filterOpen ? 'bg-indigo-500/10 text-indigo-600 ring-1 ring-indigo-500/20 dark:bg-indigo-500/15 dark:text-indigo-400' : 'border border-white/60 bg-white/70 text-slate-500 shadow-sm backdrop-blur-xl hover:bg-white/90 dark:border-slate-700/40 dark:bg-slate-800/60 dark:text-slate-400'}`}>
              <Filter className="size-3.5" />Filters
              {filterCount > 0 && <span className="flex size-4 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white">{filterCount}</span>}
            </button>
            <button onClick={openCreate} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/30">
              <Plus className="size-3.5" />New Task
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {filterOpen && (
          <div className={`${GLASS} flex flex-wrap items-center gap-3 p-3`}>
            <FilterDropdown
              label="Activity"
              items={activities}
              selectedIds={filter.activityIds}
              onToggle={(id) => { const ids = filter.activityIds.includes(id) ? filter.activityIds.filter(i => i !== id) : [...filter.activityIds, id]; onFilterChange?.({ ...filter, activityIds: ids }) }}
              getLabel={a => a.name}
              renderDot={(a) => { const c = COLOR[a.activityTypeColor] ?? COLOR.indigo; return <span className={`size-1.5 shrink-0 rounded-full ${c.dot}`} /> }}
            />
            <div className="h-6 w-px bg-slate-200/50 dark:bg-slate-700/30" />
            <FilterDropdown
              label="PIC"
              items={users.filter(u => u.role !== 'Leader')}
              selectedIds={filter.picIds}
              onToggle={(id) => { const ids = filter.picIds.includes(id) ? filter.picIds.filter(i => i !== id) : [...filter.picIds, id]; onFilterChange?.({ ...filter, picIds: ids }) }}
              getLabel={u => u.name}
            />
            <div className="h-6 w-px bg-slate-200/50 dark:bg-slate-700/30" />
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[11px] font-semibold text-slate-400">Status</span>
              {statuses.filter(s => s !== 'Archived').map(s => { const active = filter.statuses.includes(s); const sc = STATUS_CFG[s]; return (
                <button key={s} onClick={() => { const ss = active ? filter.statuses.filter(x => x !== s) : [...filter.statuses, s]; onFilterChange?.({ ...filter, statuses: ss }) }} className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all ${active ? `${sc.bg} ${sc.text}` : 'text-slate-500 hover:bg-slate-100/60 dark:text-slate-400 dark:hover:bg-slate-700/30'}`}><span className={`size-1.5 rounded-full ${sc.dot}`} />{s}</button>
              ) })}
            </div>
            <div className="h-6 w-px bg-slate-200/50 dark:bg-slate-700/30" />
            <button onClick={() => onFilterChange?.({ ...filter, showArchived: !filter.showArchived })} className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all ${filter.showArchived ? 'bg-slate-200/60 text-slate-700 ring-1 ring-slate-300/40 dark:bg-slate-700/40 dark:text-slate-200' : 'text-slate-500 hover:bg-slate-100/60 dark:text-slate-400 dark:hover:bg-slate-700/30'}`}>
              <Archive className="size-3" />Archived
            </button>
          </div>
        )}
      </div>

      {/* ─── Board Area ─── */}
      <div className="min-h-0 flex-1 overflow-hidden p-4 pt-3 lg:px-6 lg:pb-5">

        {/* ── KANBAN VIEW ── */}
        {grouping !== 'table' && (
          <div className="flex h-full gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-2">
            {grouped.map(col => (
              <div key={col.key} className="flex h-full w-[280px] shrink-0 flex-col rounded-2xl border border-white/40 bg-white/40 backdrop-blur-sm dark:border-slate-700/30 dark:bg-slate-800/30">
                {/* Column header */}
                <div className="flex items-center justify-between px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${col.color}`} />
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200">{col.title}</h3>
                  </div>
                  <span className="rounded-lg bg-slate-200/50 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-700/40 dark:text-slate-400">{col.tasks.length}</span>
                </div>
                {/* Cards */}
                <div className="flex-1 space-y-2 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-2 pb-2">
                  {col.tasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200/40 py-8 dark:border-slate-700/20">
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">No tasks</p>
                    </div>
                  )}
                  {col.tasks.map(task => {
                    const c = COLOR[task.activityTypeColor] ?? COLOR.indigo
                    const sc = STATUS_CFG[task.status]
                    const pc = PRIORITY_CFG[task.priority]
                    return (
                      <button key={task.id} onClick={() => openDetail(task.id)} className="group flex w-full flex-col rounded-xl border border-white/60 bg-white/80 p-3 text-left shadow-sm transition-all hover:bg-white/95 hover:shadow-md dark:border-slate-700/40 dark:bg-slate-800/60 dark:hover:bg-slate-800/80">
                        <div className="flex items-center gap-2">
                          <span className={`size-2 shrink-0 rounded-full ${c.dot}`} />
                          <p className="truncate text-xs font-bold text-slate-700 dark:text-slate-200">{task.name}</p>
                        </div>
                        <p className="mt-1 pl-4 text-[10px] text-slate-500 dark:text-slate-400">{task.activityName}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <AvatarStack pics={task.pics} />
                          <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500">{fmtShort(task.startDate)} – {fmtShort(task.endDate)}</span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${pc.bg} ${pc.text}`}>{pc.label}</span>
                          {grouping !== 'status' && <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${sc.bg} ${sc.text}`}><span className={`size-1.5 rounded-full ${sc.dot}`} />{task.status}</span>}
                          {task.isOverdue && (
                            <span className="flex items-center gap-0.5 rounded-md bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                              <AlertTriangle className="size-2.5" />Overdue
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TABLE VIEW ── */}
        {grouping === 'table' && (
          <div className={`${GLASS} flex h-full flex-col overflow-hidden p-0`}>
            <div className="grid grid-cols-[1fr_130px_90px_70px_70px_70px_40px] gap-2 border-b border-slate-200/40 px-4 py-2.5 text-[11px] font-semibold text-slate-400 dark:border-slate-700/30 dark:text-slate-500">
              <button onClick={() => toggleSort('name')} className="flex items-center gap-1 text-left hover:text-slate-600 dark:hover:text-slate-300">Name <SortIcon k="name" /></button>
              <button onClick={() => toggleSort('activity')} className="flex items-center gap-1 text-left hover:text-slate-600 dark:hover:text-slate-300">Activity <SortIcon k="activity" /></button>
              <span>PICs</span>
              <button onClick={() => toggleSort('priority')} className="flex items-center gap-1 text-left hover:text-slate-600 dark:hover:text-slate-300">Priority <SortIcon k="priority" /></button>
              <button onClick={() => toggleSort('status')} className="flex items-center gap-1 text-left hover:text-slate-600 dark:hover:text-slate-300">Status <SortIcon k="status" /></button>
              <button onClick={() => toggleSort('endDate')} className="flex items-center gap-1 text-left hover:text-slate-600 dark:hover:text-slate-300">Due <SortIcon k="endDate" /></button>
              <span />
            </div>
            <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {sorted.map(task => {
                const c = COLOR[task.activityTypeColor] ?? COLOR.indigo
                const sc = STATUS_CFG[task.status]
                const pc = PRIORITY_CFG[task.priority]
                return (
                  <button key={task.id} onClick={() => openDetail(task.id)} className="grid w-full grid-cols-[1fr_130px_90px_70px_70px_70px_40px] gap-2 border-b border-slate-200/20 px-4 py-2.5 text-left transition-colors hover:bg-slate-50/40 dark:border-slate-700/15 dark:hover:bg-slate-800/30">
                    <div className="flex items-center gap-2">
                      <span className={`size-2 shrink-0 rounded-full ${c.dot}`} />
                      <span className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{task.name}</span>
                    </div>
                    <span className="truncate text-[11px] text-slate-500 dark:text-slate-400">{task.activityName}</span>
                    <AvatarStack pics={task.pics} />
                    <span className={`inline-flex w-fit items-center rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${pc.bg} ${pc.text}`}>{pc.label}</span>
                    <span className={`inline-flex w-fit items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${sc.bg} ${sc.text}`}><span className={`size-1.5 rounded-full ${sc.dot}`} />{task.status}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{fmtShort(task.endDate)}</span>
                    <div>{task.isOverdue && <AlertTriangle className="size-3.5 text-rose-500" />}</div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── Task Detail Side Panel ─── */}
      {panelMode === 'detail' && selectedTask && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md lg:absolute lg:inset-y-0 lg:right-0 lg:w-[400px]">
          <div className="flex-1 bg-slate-900/20 backdrop-blur-sm lg:hidden" onClick={closePanel} />
          <div className="flex w-[360px] flex-col border-l border-white/60 bg-white/95 backdrop-blur-2xl lg:w-full dark:border-slate-700/40 dark:bg-slate-900/95" style={{ boxShadow: '-4px 0 24px rgba(0,0,0,0.06)' }}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200/40 px-5 py-3 dark:border-slate-700/30">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Task Details</h3>
              <div className="flex items-center gap-1">
                {!editing && canEditTask(selectedTask) && (
                  <button onClick={startEditing} className="rounded-lg p-1 text-slate-400 transition-colors hover:text-indigo-500" title="Edit task"><Pencil className="size-4" /></button>
                )}
                {canDeleteTask(selectedTask) && (
                  <button onClick={() => setDeleteConfirm(true)} className="rounded-lg p-1 text-slate-400 transition-colors hover:text-rose-500" title="Delete task"><Trash2 className="size-4" /></button>
                )}
                <button onClick={closePanel} className="rounded-lg p-1 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"><X className="size-4" /></button>
              </div>
            </div>
            {/* Delete Confirmation */}
            {deleteConfirm && (
              <div className="border-b border-rose-200/40 bg-rose-50/50 px-5 py-3 dark:border-rose-500/20 dark:bg-rose-500/5">
                <p className="mb-2 text-xs font-semibold text-rose-700 dark:text-rose-300">Delete this task?</p>
                <p className="mb-3 text-[11px] text-rose-600/70 dark:text-rose-400/60">This action cannot be undone.</p>
                <div className="flex gap-2">
                  <button onClick={handleDelete} className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-rose-600">Delete</button>
                  <button onClick={() => setDeleteConfirm(false)} className="rounded-lg border border-slate-200/50 bg-white/50 px-3 py-1.5 text-xs font-semibold text-slate-500 transition-all hover:bg-slate-100/60 dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-400">Cancel</button>
                </div>
              </div>
            )}
            <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden p-5">
              {/* Activity badge */}
              {(() => { const c = COLOR[selectedTask.activityTypeColor] ?? COLOR.indigo; return (
                <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-semibold ${c.softBg} ${c.softText}`}><span className={`size-1.5 rounded-full ${c.dot}`} />{selectedTask.activityTypeName} · {selectedTask.activityName}</span>
              ) })()}

              {/* ── Edit Mode ── */}
              {editing ? (
                <div className="mt-3 space-y-3">
                  <div>
                    <label className={LABEL}>Task Name</label>
                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>Description</label>
                    <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3} className={`${INPUT} resize-none`} />
                  </div>
                  <div>
                    <label className={LABEL}>Priority</label>
                    <div className="flex gap-2">
                      {(['Low', 'Medium', 'High'] as TaskPriority[]).map(p => {
                        const pc = PRIORITY_CFG[p]
                        return (
                          <button key={p} type="button" onClick={() => setEditPriority(p)} className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-all ${editPriority === p ? `${pc.bg} ${pc.text} ring-1 ring-current/20` : 'border border-slate-200/50 bg-white/50 text-slate-400 hover:bg-slate-50/60 dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-500'}`}>
                            {p}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={LABEL}>Start Date</label><input type="date" value={editStartDate} onChange={e => setEditStartDate(e.target.value)} className={INPUT} /></div>
                    <div><label className={LABEL}>End Date</label><input type="date" value={editEndDate} min={editStartDate} onChange={e => setEditEndDate(e.target.value)} className={INPUT} /></div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveEditing} disabled={!editName} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl disabled:opacity-40"><Save className="size-3.5" />Save</button>
                    <button onClick={cancelEditing} className="rounded-xl border border-slate-200/50 bg-white/50 px-4 py-2 text-xs font-semibold text-slate-600 transition-all hover:bg-white/80 dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-300">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <h4 className="mt-3 text-base font-bold text-slate-800 dark:text-slate-100">{selectedTask.name}</h4>
                  {/* Status + Priority + Overdue */}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {(() => { const sc = STATUS_CFG[selectedTask.status]; return <span className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold ${sc.bg} ${sc.text}`}>{selectedTask.status}</span> })()}
                    {(() => { const pc = PRIORITY_CFG[selectedTask.priority]; return <span className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold ${pc.bg} ${pc.text}`}>{selectedTask.priority}</span> })()}
                    {selectedTask.isOverdue && <span className="flex items-center gap-1 rounded-lg bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:bg-rose-500/15 dark:text-rose-400"><AlertTriangle className="size-3" />Overdue</span>}
                  </div>
                  {/* Description */}
                  {taskDetail && taskDetail.id === selectedTask.id && taskDetail.description && (
                    <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{taskDetail.description}</p>
                  )}
                </>
              )}

              {/* Details */}
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400">Timeline</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{fmtShort(selectedTask.startDate)} – {fmtShort(selectedTask.endDate)}</span>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-slate-200/50 to-transparent dark:via-slate-700/30" />
                {/* PICs */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-400">Assigned PICs</span>
                    {(canManagePics(selectedTask) || canAddPicOnly(selectedTask)) && (
                      <button onClick={() => setAddingPic(!addingPic)} className="flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[10px] font-semibold text-indigo-500 transition-all hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10">
                        <UserPlus className="size-3" />{addingPic ? 'Done' : 'Add'}
                      </button>
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {selectedTask.pics.map(p => (
                      <span key={p.id} className="flex items-center gap-1.5 rounded-lg bg-indigo-100 px-2 py-1 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                        <span className="flex size-4 items-center justify-center rounded bg-indigo-500 text-[7px] font-bold text-white">{getInitials(p.name)}</span>
                        {p.name}
                        {canManagePics(selectedTask) && selectedTask.pics.length > 1 && <button onClick={() => onPicRemove?.(selectedTask.id, p.id)} className="ml-0.5 text-indigo-400 hover:text-indigo-600"><X className="size-3" /></button>}
                      </span>
                    ))}
                  </div>
                  {addingPic && (
                    <div className="mt-2">
                      <TagSelect<UserRef>
                        items={users.filter(u => u.role !== 'Leader' && !selectedTask.pics.some(p => p.id === u.id))}
                        selectedIds={[]}
                        onToggle={(id) => { onPicAdd?.(selectedTask.id, id); setAddingPic(false) }}
                        getLabel={u => u.name}
                        placeholder="Search to add..."
                        renderOption={(u) => (
                          <span className="flex items-center gap-2">
                            <span className="flex size-5 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-500 text-[7px] font-bold text-white">{getInitials(u.name)}</span>
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{u.name}</span>
                            <span className="text-[10px] text-slate-400">{u.role}</span>
                          </span>
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* ── Status Actions (for those who can edit status) ── */}
              {canEditStatus(selectedTask) && !isLeader && (
                <>
                  <div className="mt-5 h-px bg-gradient-to-r from-transparent via-slate-200/50 to-transparent dark:via-slate-700/30" />
                  <div className="mt-4">
                    <p className="mb-2 text-[11px] font-semibold text-slate-400">My Actions</p>

                    {selectedTask.status === 'To Do' && (
                      <button onClick={() => onTaskStatusChange?.(selectedTask.id, 'In Progress')} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl">
                        <Play className="size-3.5" />Start Working
                      </button>
                    )}

                    {selectedTask.status === 'In Progress' && (
                      <button onClick={() => onTaskStatusChange?.(selectedTask.id, 'Need Review')} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl">
                        <Send className="size-3.5" />Submit for Review
                      </button>
                    )}

                    {selectedTask.status === 'Revision' && (
                      <div className="space-y-2">
                        <div className="rounded-xl border border-rose-200/60 bg-rose-50/50 p-3 dark:border-rose-500/20 dark:bg-rose-500/5">
                          <p className="mb-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400">Revision requested</p>
                          {taskDetail && taskDetail.id === selectedTask.id && taskDetail.approvalLog.length > 0 && (
                            <p className="text-[10px] leading-relaxed text-rose-500/80 dark:text-rose-400/60">{taskDetail.approvalLog[taskDetail.approvalLog.length - 1].feedback}</p>
                          )}
                        </div>
                        <button onClick={() => onTaskStatusChange?.(selectedTask.id, 'In Progress')} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl">
                          <RotateCcw className="size-3.5" />Continue Working
                        </button>
                      </div>
                    )}

                    {selectedTask.status === 'Need Review' && (
                      <div className="flex items-center gap-2 rounded-xl border border-amber-200/60 bg-amber-50/50 px-4 py-3 dark:border-amber-500/20 dark:bg-amber-500/5">
                        <Eye className="size-4 text-amber-500" />
                        <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Waiting for leader review</p>
                      </div>
                    )}

                    {selectedTask.status === 'Approved' && (
                      <div className="flex items-center gap-2 rounded-xl border border-emerald-200/60 bg-emerald-50/50 px-4 py-3 dark:border-emerald-500/20 dark:bg-emerald-500/5">
                        <CheckCircle2 className="size-4 text-emerald-500" />
                        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Task approved</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── Leader Actions (Approve / Revision / Archive) ── */}
              {isLeader && selectedTask.status !== 'Archived' && (
                <>
                  <div className="mt-5 h-px bg-gradient-to-r from-transparent via-slate-200/50 to-transparent dark:via-slate-700/30" />
                  <div className="mt-4">
                    <p className="mb-2 text-[11px] font-semibold text-slate-400">Leader Actions</p>
                    {selectedTask.status === 'Need Review' && (
                      <>
                        <textarea value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Feedback (required for approval/revision)..." rows={3} className={`${INPUT} mb-2 resize-none text-xs`} />
                        <div className="flex gap-2">
                          <button onClick={() => { onTaskApprove?.(selectedTask.id, feedback); setFeedback('') }} disabled={!feedback} className="flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-600 disabled:opacity-40">
                            <CheckCircle2 className="size-3.5" />Approve
                          </button>
                          <button onClick={() => { onTaskRevision?.(selectedTask.id, feedback); setFeedback('') }} disabled={!feedback} className="flex items-center gap-1 rounded-xl bg-rose-500 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-rose-600 disabled:opacity-40">
                            <RotateCcw className="size-3.5" />Revision
                          </button>
                          <button onClick={() => onTaskArchive?.(selectedTask.id)} className="flex items-center gap-1 rounded-xl border border-slate-200/50 bg-white/50 px-3 py-2 text-xs font-semibold text-slate-500 transition-all hover:bg-slate-100/60 dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-400">
                            <Archive className="size-3.5" />Archive
                          </button>
                        </div>
                      </>
                    )}
                    {selectedTask.status !== 'Need Review' && (
                      <button onClick={() => onTaskArchive?.(selectedTask.id)} className="flex items-center gap-1 rounded-xl border border-slate-200/50 bg-white/50 px-3 py-2 text-xs font-semibold text-slate-500 transition-all hover:bg-slate-100/60 dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-400">
                        <Archive className="size-3.5" />Archive
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* ── Reopen Archived Task (Leader only) ── */}
              {isLeader && selectedTask.status === 'Archived' && (
                <>
                  <div className="mt-5 h-px bg-gradient-to-r from-transparent via-slate-200/50 to-transparent dark:via-slate-700/30" />
                  <div className="mt-4">
                    <p className="mb-2 text-[11px] font-semibold text-slate-400">Leader Actions</p>
                    <button onClick={() => onTaskReopen?.(selectedTask.id)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl">
                      <RotateCcw className="size-3.5" />Reopen Task
                    </button>
                  </div>
                </>
              )}

              {/* Reminders */}
              {taskDetail && taskDetail.id === selectedTask.id && taskDetail.reminders && taskDetail.reminders.length > 0 && (
                <>
                  <div className="mt-5 h-px bg-gradient-to-r from-transparent via-slate-200/50 to-transparent dark:via-slate-700/30" />
                  <div className="mt-4">
                    <div className="mb-2 flex items-center gap-1.5">
                      <Bell className="size-3.5 text-indigo-500" />
                      <p className="text-[11px] font-semibold text-slate-400">Reminders</p>
                    </div>
                    <div className="space-y-1.5">
                      {taskDetail.reminders.map(rem => (
                        <div key={rem.id} className={`flex items-center justify-between rounded-lg border px-3 py-2 ${rem.enabled ? 'border-slate-200/40 bg-slate-50/40 dark:border-slate-700/20 dark:bg-slate-800/20' : 'border-slate-200/20 bg-slate-50/20 opacity-50 dark:border-slate-700/10 dark:bg-slate-800/10'}`}>
                          <div className="flex items-center gap-2">
                            <span className="rounded-md bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">{rem.trigger}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">{rem.channel}</span>
                          </div>
                          {!rem.enabled && <span className="text-[9px] text-slate-400">Disabled</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Approval Log */}
              {taskDetail && taskDetail.id === selectedTask.id && taskDetail.approvalLog.length > 0 && (
                <>
                  <div className="mt-5 h-px bg-gradient-to-r from-transparent via-slate-200/50 to-transparent dark:via-slate-700/30" />
                  <div className="mt-4">
                    <p className="mb-2 text-[11px] font-semibold text-slate-400">Approval History</p>
                    <div className="space-y-2">
                      {taskDetail.approvalLog.map(log => (
                        <div key={log.id} className="rounded-xl border border-slate-200/40 bg-slate-50/40 p-3 dark:border-slate-700/20 dark:bg-slate-800/20">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">{log.reviewerName}</span>
                            <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${log.action === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'}`}>{log.action === 'approved' ? 'Approved' : 'Revision'}</span>
                          </div>
                          <p className="mt-1 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">{log.feedback}</p>
                          <p className="mt-1 text-[9px] text-slate-400 dark:text-slate-500">{fmtTime(log.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Assignment Log */}
              {taskDetail && taskDetail.id === selectedTask.id && taskDetail.assignmentLog.length > 0 && (
                <>
                  <div className="mt-5 h-px bg-gradient-to-r from-transparent via-slate-200/50 to-transparent dark:via-slate-700/30" />
                  <div className="mt-4">
                    <p className="mb-2 text-[11px] font-semibold text-slate-400">Assignment Log</p>
                    <div className="space-y-1.5">
                      {taskDetail.assignmentLog.map(log => (
                        <div key={log.id} className="flex items-start gap-2 rounded-lg px-2 py-1.5">
                          <div className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded bg-slate-200/50 text-[7px] font-bold text-slate-500 dark:bg-slate-700/40 dark:text-slate-400">{getInitials(log.changedByName)}</div>
                          <div>
                            <p className="text-[10px] text-slate-600 dark:text-slate-300">
                              <span className="font-semibold">{log.changedByName}</span>
                              {log.actionType === 'add' ? ' added ' : log.actionType === 'remove' ? ' removed ' : ' replaced with '}
                              <span className="font-semibold">{log.affectedUserName}</span>
                            </p>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500">{fmtTime(log.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Create Task Modal (centered) ─── */}
      {panelMode === 'create' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={closePanel} />
          <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border border-white/60 bg-white/95 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl dark:border-slate-700/40 dark:bg-slate-900/95 dark:shadow-black/20">
            <div className="flex items-center justify-between border-b border-slate-200/40 px-6 py-4 dark:border-slate-700/30">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-sm shadow-indigo-500/20"><Plus className="size-4 text-white" /></div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">New Task</h3>
              </div>
              <button onClick={closePanel} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100/60 hover:text-slate-600 dark:hover:bg-slate-800/40 dark:hover:text-slate-300"><X className="size-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-6 py-5">
              <div className="space-y-4">
                <div>
                  <label className={LABEL}>Task Name *</label>
                  <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Design campaign poster" className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Activity *</label>
                  <select value={formActivityId} onChange={e => { setFormActivityId(e.target.value); setFormStartDate(''); setFormEndDate('') }} className={INPUT}>
                    <option value="">Select activity...</option>
                    {availableActivities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  {selectedActivity && (
                    <p className="mt-1 text-[11px] text-slate-400">
                      Activity period: {fmtShort(selectedActivity.startDate)} – {fmtShort(selectedActivity.endDate)}
                    </p>
                  )}
                </div>
                <div>
                  <label className={LABEL}>PICs * (min 1)</label>
                  <TagSelect<UserRef>
                    items={users.filter(u => u.role !== 'Leader')}
                    selectedIds={formPicIds}
                    onToggle={(id) => setFormPicIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                    getLabel={u => u.name}
                    placeholder="Search team members..."
                    renderTag={(u, rm) => (
                      <span className="flex items-center gap-1.5 rounded-lg bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                        <span className="flex size-4 items-center justify-center rounded bg-indigo-500 text-[7px] font-bold text-white">{getInitials(u.name)}</span>
                        {u.name}
                        <button type="button" onClick={rm} className="ml-0.5 text-indigo-400 hover:text-indigo-600"><X className="size-3" /></button>
                      </span>
                    )}
                    renderOption={(u) => (
                      <span className="flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-500 text-[8px] font-bold text-white">{getInitials(u.name)}</span>
                        <span className="flex flex-col"><span className="text-sm font-medium text-slate-700 dark:text-slate-200">{u.name}</span><span className="text-[10px] text-slate-400">{u.role}</span></span>
                      </span>
                    )}
                  />
                </div>
                <div>
                  <label className={LABEL}>Priority</label>
                  <div className="flex gap-2">
                    {(['Low', 'Medium', 'High'] as TaskPriority[]).map(p => {
                      const pc = PRIORITY_CFG[p]
                      return (
                        <button key={p} type="button" onClick={() => setFormPriority(p)} className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-all ${formPriority === p ? `${pc.bg} ${pc.text} ring-1 ring-current/20` : 'border border-slate-200/50 bg-white/50 text-slate-400 hover:bg-slate-50/60 dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-500'}`}>
                          {p}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={LABEL}>Start Date</label><input type="date" value={formStartDate} min={selectedActivity?.startDate} max={selectedActivity?.endDate} onChange={e => setFormStartDate(e.target.value)} className={INPUT} /></div>
                  <div><label className={LABEL}>End Date</label><input type="date" value={formEndDate} min={formStartDate || selectedActivity?.startDate} max={selectedActivity?.endDate} onChange={e => setFormEndDate(e.target.value)} className={INPUT} /></div>
                </div>
                {picConflicts.length > 0 && (
                  <div className="space-y-1">
                    {picConflicts.map((msg, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-xl border border-amber-200/50 bg-amber-50/50 px-3 py-2 dark:border-amber-500/20 dark:bg-amber-500/5">
                        <AlertTriangle className="size-3.5 shrink-0 text-amber-500" />
                        <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300">{msg}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div>
                  <label className={LABEL}>Description</label>
                  <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Optional task description..." rows={3} className={`${INPUT} resize-none`} />
                </div>

                {/* ── Reminders ── */}
                <div className="h-px bg-gradient-to-r from-transparent via-slate-300/50 to-transparent dark:via-slate-600/30" />
                <div>
                  <div className="mb-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="size-4 text-indigo-500" />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Reminders</span>
                    </div>
                    <button type="button" onClick={() => setFormReminders(prev => [...prev, { id: `rem-${Date.now()}`, trigger: 'H-3', channel: waChannels[0]?.type ?? 'Marketing', templateId: reminderTemplates[0]?.id ?? '', enabled: true }])} className="flex items-center gap-1 rounded-lg bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 transition-all hover:bg-indigo-500/20 dark:bg-indigo-500/15 dark:text-indigo-400 dark:hover:bg-indigo-500/25">
                      <Plus className="size-3" />Add Reminder
                    </button>
                  </div>
                  {formReminders.length === 0 && (
                    <p className="rounded-xl border border-dashed border-slate-200/50 bg-slate-50/40 py-4 text-center text-xs text-slate-400 dark:border-slate-700/30 dark:bg-slate-800/20 dark:text-slate-500">
                      No reminders configured. Click &quot;Add Reminder&quot; to set one up.
                    </p>
                  )}
                  <div className="space-y-2.5">
                    {formReminders.map(rem => (
                      <div key={rem.id} className={`rounded-xl border px-3 py-2.5 transition-all ${rem.enabled ? 'border-slate-200/50 bg-white/50 dark:border-slate-700/40 dark:bg-slate-800/40' : 'border-slate-200/30 bg-slate-50/30 opacity-60 dark:border-slate-700/20 dark:bg-slate-800/20'}`}>
                        <div className="flex flex-wrap items-center gap-2">
                          <select value={rem.trigger} onChange={e => setFormReminders(prev => prev.map(r => r.id === rem.id ? { ...r, trigger: e.target.value as ReminderTrigger } : r))} className="rounded-lg border border-slate-200/50 bg-white/60 px-2 py-1.5 text-[11px] font-semibold text-slate-600 dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-300">
                            {TRIGGERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                          {rem.trigger === 'Custom' && (
                            <div className="flex items-center gap-1">
                              <input type="number" min={1} value={rem.customDays ?? ''} onChange={e => setFormReminders(prev => prev.map(r => r.id === rem.id ? { ...r, customDays: Number(e.target.value) } : r))} className="w-14 rounded-lg border border-slate-200/50 bg-white/60 px-2 py-1.5 text-center text-[11px] font-semibold dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-300" placeholder="5" />
                              <span className="text-[10px] text-slate-400">days before</span>
                            </div>
                          )}
                          <select value={rem.channel} onChange={e => setFormReminders(prev => prev.map(r => r.id === rem.id ? { ...r, channel: e.target.value } : r))} className="rounded-lg border border-slate-200/50 bg-white/60 px-2 py-1.5 text-[11px] font-semibold text-slate-600 dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-300">
                            {waChannels.map(ch => <option key={ch.type} value={ch.type}>{ch.name}</option>)}
                            {waChannels.length === 0 && <option value="">No channels</option>}
                          </select>
                          <select value={rem.templateId} onChange={e => setFormReminders(prev => prev.map(r => r.id === rem.id ? { ...r, templateId: e.target.value, customMessage: undefined } : r))} className="rounded-lg border border-slate-200/50 bg-white/60 px-2 py-1.5 text-[11px] font-semibold text-slate-600 dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-300">
                            {reminderTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                          <div className="ml-auto flex items-center gap-1">
                            <button type="button" onClick={() => setFormReminders(prev => prev.map(r => r.id === rem.id ? { ...r, enabled: !r.enabled } : r))}>
                              {rem.enabled ? <ToggleRight className="size-4 text-indigo-500" /> : <ToggleLeft className="size-4 text-slate-400" />}
                            </button>
                            <button type="button" onClick={() => setFormReminders(prev => prev.filter(r => r.id !== rem.id))} className="rounded-md p-1 text-slate-400 transition-colors hover:bg-rose-50/60 hover:text-rose-500 dark:hover:bg-rose-950/30">
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                        {(() => { const tpl = reminderTemplates.find(t => t.id === rem.templateId); return tpl?.name.toLowerCase().includes('custom') })() && (
                          <div className="mt-2">
                            <textarea value={rem.customMessage ?? ''} onChange={e => setFormReminders(prev => prev.map(r => r.id === rem.id ? { ...r, customMessage: e.target.value } : r))} placeholder="Write your custom reminder message..." rows={3} className="w-full resize-none rounded-lg border border-slate-200/50 bg-white/60 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300/30 dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-indigo-500/50 dark:focus:ring-indigo-500/20" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-slate-200/40 px-6 py-4 dark:border-slate-700/30">
              <button onClick={closePanel} className="rounded-xl border border-slate-200/50 bg-white/50 px-4 py-2.5 text-xs font-semibold text-slate-600 backdrop-blur-sm transition-all hover:bg-white/80 dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-300">Cancel</button>
              <button onClick={handleCreate} disabled={!formName || !formActivityId || formPicIds.length === 0} className="rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl disabled:opacity-40">Create Task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
