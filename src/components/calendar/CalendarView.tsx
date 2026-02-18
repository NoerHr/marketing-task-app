import { useState, useMemo } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  X,
  Filter,
  Zap,
  User,
  Plus,
  Clock,
  ArrowLeft,
  Pencil,
} from 'lucide-react'
import type {
  ActivityEditData,
  CalendarProps,
  CalendarTask,
  CalendarActivity,
  CalendarView as ViewMode,
  TaskStatus,
  DayWorkload,
  TaskDetail,
} from '@/types/calendar'
import { CreateActivityModal } from './CreateActivityModal'
import { FilterDropdown } from '@/components/shared/FilterDropdown'

/* ================================================================
   Color & Status Configuration — FULL COLOR pills
   ================================================================ */

const HIDE_SCROLL = '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden'

const COLOR: Record<string, {
  pill: string; hover: string; ring: string
  dot: string; softBg: string; softText: string
}> = {
  rose:   { pill: 'bg-rose-500',   hover: 'hover:bg-rose-600',   ring: 'ring-rose-400/30',   dot: 'bg-rose-500', softBg: 'bg-rose-50 dark:bg-rose-500/10',     softText: 'text-rose-600 dark:text-rose-400' },
  violet: { pill: 'bg-violet-500', hover: 'hover:bg-violet-600', ring: 'ring-violet-400/30', dot: 'bg-violet-500', softBg: 'bg-violet-50 dark:bg-violet-500/10', softText: 'text-violet-600 dark:text-violet-400' },
  pink:   { pill: 'bg-pink-500',   hover: 'hover:bg-pink-600',   ring: 'ring-pink-400/30',   dot: 'bg-pink-500', softBg: 'bg-pink-50 dark:bg-pink-500/10',     softText: 'text-pink-600 dark:text-pink-400' },
  amber:  { pill: 'bg-amber-500',  hover: 'hover:bg-amber-600',  ring: 'ring-amber-400/30',  dot: 'bg-amber-500', softBg: 'bg-amber-50 dark:bg-amber-500/10',   softText: 'text-amber-600 dark:text-amber-400' },
  teal:   { pill: 'bg-teal-500',   hover: 'hover:bg-teal-600',   ring: 'ring-teal-400/30',   dot: 'bg-teal-500', softBg: 'bg-teal-50 dark:bg-teal-500/10',     softText: 'text-teal-600 dark:text-teal-400' },
  sky:    { pill: 'bg-sky-500',    hover: 'hover:bg-sky-600',    ring: 'ring-sky-400/30',    dot: 'bg-sky-500', softBg: 'bg-sky-50 dark:bg-sky-500/10',       softText: 'text-sky-600 dark:text-sky-400' },
  indigo: { pill: 'bg-indigo-500', hover: 'hover:bg-indigo-600', ring: 'ring-indigo-400/30', dot: 'bg-indigo-500', softBg: 'bg-indigo-50 dark:bg-indigo-500/10', softText: 'text-indigo-600 dark:text-indigo-400' },
}

const STATUS_LABEL: Record<TaskStatus, { bg: string; text: string }> = {
  'To Do':       { bg: 'bg-slate-100 dark:bg-slate-700/40',   text: 'text-slate-600 dark:text-slate-300' },
  'In Progress': { bg: 'bg-indigo-100 dark:bg-indigo-500/15', text: 'text-indigo-700 dark:text-indigo-300' },
  'Need Review': { bg: 'bg-amber-100 dark:bg-amber-500/15',   text: 'text-amber-700 dark:text-amber-300' },
  'Revision':    { bg: 'bg-orange-100 dark:bg-orange-500/15', text: 'text-orange-700 dark:text-orange-300' },
  'Approved':    { bg: 'bg-emerald-100 dark:bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-300' },
  'Archived':    { bg: 'bg-slate-100 dark:bg-slate-700/30',   text: 'text-slate-400 dark:text-slate-500' },
}

const STATUS_DOT: Record<TaskStatus, string> = {
  'To Do': 'bg-slate-400', 'In Progress': 'bg-indigo-500', 'Need Review': 'bg-amber-500',
  'Revision': 'bg-orange-500', 'Approved': 'bg-emerald-500', 'Archived': 'bg-slate-300',
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const GLASS = 'rounded-2xl border border-white/60 bg-white/70 shadow-sm shadow-slate-900/[0.03] backdrop-blur-xl dark:border-slate-700/40 dark:bg-slate-800/60 dark:shadow-black/10'
const MAX_VISIBLE = 3

/* ================================================================
   Date Utilities
   ================================================================ */

function parseDate(s: string) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
function fmtDate(y: number, m: number, d: number) { return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` }
function fmtShort(s: string) { const d = parseDate(s); return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]?.slice(0, 3)}` }
function fmtLong(s: string) { const d = parseDate(s); return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` }
function taskOnDate(t: CalendarTask, date: string) { return date >= t.startDate && date <= t.endDate }
function getInitials(n: string) { return n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2) }

interface GridCell { date: string; day: number; isCurrent: boolean }
function buildGrid(year: number, month: number): GridCell[] {
  const firstDay = new Date(year, month, 1).getDay()
  const dim = new Date(year, month + 1, 0).getDate()
  const dip = new Date(year, month, 0).getDate()
  const cells: GridCell[] = []
  const pm = month === 0 ? 11 : month - 1, py = month === 0 ? year - 1 : year
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ date: fmtDate(py, pm, dip - i), day: dip - i, isCurrent: false })
  for (let d = 1; d <= dim; d++) cells.push({ date: fmtDate(year, month, d), day: d, isCurrent: true })
  const rem = 7 - (cells.length % 7)
  if (rem < 7) { const nm = month === 11 ? 0 : month + 1, ny = month === 11 ? year + 1 : year; for (let d = 1; d <= rem; d++) cells.push({ date: fmtDate(ny, nm, d), day: d, isCurrent: false }) }
  return cells
}

/* ================================================================
   CalendarView Component
   ================================================================ */

export function CalendarView({
  currentView, currentDate, tasks, activities: activitiesProp, planSummary, dayWorkloads, conflictWarnings,
  activityTypes, users, statuses, filter, reminderTemplates,
  onViewChange, onDateChange, onTaskClick, onTaskDrag: _onTaskDrag, onTaskResize: _onTaskResize,
  onFilterChange, onDayExpand, onDayClick, onCreateActivity,
  onActivityEdit, onEditActivity, isLeader,
  taskDetail, onTaskDetailClose,
  editActivityData, editModalOpen, onEditModalClose,
  waChannels,
}: CalendarProps & {
  taskDetail?: TaskDetail | null
  onTaskDetailClose?: () => void
  editActivityData?: ActivityEditData | null
  editModalOpen?: boolean
  onEditModalClose?: () => void
  waChannels?: { type: string; name: string }[]
}) {

  const activities: CalendarActivity[] = activitiesProp ?? []

  const [view, setView] = useState<ViewMode>(currentView)
  const [date, setDate] = useState(currentDate)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [dayDetailDate, setDayDetailDate] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const cur = parseDate(date)
  const year = cur.getFullYear(), month = cur.getMonth()
  const todayStr = currentDate
  const monthCells = useMemo(() => buildGrid(year, month), [year, month])
  const wlMap = useMemo(() => { const m: Record<string, DayWorkload> = {}; dayWorkloads.forEach(w => { m[w.date] = w }); return m }, [dayWorkloads])

  /* ── Client-side filter: hide non-matching tasks & activities ── */
  const hasActiveFilter = filter.activityTypeIds.length > 0 || filter.picIds.length > 0 || filter.statuses.length > 0 || filter.myTasksOnly

  // Tasks already filtered by API, but activities are not — build matching activity IDs from tasks
  const matchingActivityIds = useMemo(() => new Set(tasks.map(t => t.activityId)), [tasks])

  // When filter active, only show activities that contain at least 1 matching task
  const visibleActivities = useMemo(() => {
    if (!hasActiveFilter) return activities
    return activities.filter(a => matchingActivityIds.has(a.id))
  }, [activities, hasActiveFilter, matchingActivityIds])

  const forDate = (d: string) => tasks.filter(t => taskOnDate(t, d))
  const activitiesOnDate = (d: string) => visibleActivities.filter(a => d >= a.startDate && d <= a.endDate)
  const tasksForActivity = (d: string, actId: string) => forDate(d).filter(t => t.activityId === actId)
  const orphanTasks = (d: string) => { const actIds = new Set(visibleActivities.map(a => a.id)); return forDate(d).filter(t => !actIds.has(t.activityId)) }
  const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) ?? null : null
  const dayDetailTasks = dayDetailDate ? forDate(dayDetailDate) : []

  const weekDates = useMemo(() => {
    const d = parseDate(date); const start = new Date(d); start.setDate(start.getDate() - d.getDay())
    return Array.from({ length: 7 }, (_, i) => { const day = new Date(start); day.setDate(day.getDate() + i); return fmtDate(day.getFullYear(), day.getMonth(), day.getDate()) })
  }, [date])

  const timeSlots = useMemo(() => Array.from({ length: 13 }, (_, i) => { const h = i + 7; return { hour: h, label: h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM` } }), [])

  /* ── Handlers ── */
  const switchView = (v: ViewMode) => { setView(v); onViewChange?.(v) }
  const nav = (dir: -1 | 0 | 1) => {
    let n: string
    if (dir === 0) n = currentDate
    else if (view === 'month') { const d = new Date(year, month + dir, 1); n = fmtDate(d.getFullYear(), d.getMonth(), 1) }
    else if (view === 'week') { const d = parseDate(date); d.setDate(d.getDate() + dir * 7); n = fmtDate(d.getFullYear(), d.getMonth(), d.getDate()) }
    else { const d = parseDate(date); d.setDate(d.getDate() + dir); n = fmtDate(d.getFullYear(), d.getMonth(), d.getDate()) }
    setDate(n); onDateChange?.(n)
  }

  const openDayDetail = (dateStr: string) => {
    setDayDetailDate(dateStr)
    setSelectedTaskId(null)
    onDayClick?.(dateStr)
  }

  const openTaskDetail = (id: string) => {
    setSelectedTaskId(id)
    onTaskClick?.(id)
  }

  const openTaskFromDay = (id: string) => {
    setSelectedTaskId(id)
    onTaskClick?.(id)
  }

  const closeDayDetail = () => { setDayDetailDate(null) }
  const closeTaskDetail = () => {
    setSelectedTaskId(null)
    onTaskDetailClose?.()
  }
  const backToDayDetail = () => { setSelectedTaskId(null) }

  const heading = view === 'month' ? `${MONTH_NAMES[month]} ${year}` : view === 'week' ? `${fmtShort(weekDates[0])} – ${fmtShort(weekDates[6])}` : `${fmtShort(date)}, ${year}`

  /* ── Determine if side panel is open ── */
  const panelOpen = !!selectedTaskId || !!dayDetailDate

  return (
    <div className="relative flex h-full flex-col font-['Plus_Jakarta_Sans']">

      {/* ─── Top Bar ─── */}
      <div className="relative z-20 shrink-0 space-y-3 p-4 pb-0 lg:px-6 lg:pt-5">
        {/* Row 1: Summary + Create Activity */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/10 dark:bg-indigo-500/15"><Zap className="size-3.5 text-indigo-500" /></div>
              <div><p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Active</p><p className="text-sm font-bold text-slate-800 dark:text-slate-100">{planSummary.activeTasks}</p></div>
            </div>
            <div className="h-6 w-px bg-slate-200/50 dark:bg-slate-700/30" />
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-rose-500/10 dark:bg-rose-500/15"><AlertTriangle className="size-3.5 text-rose-500" /></div>
              <div><p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Overdue</p><p className="text-sm font-bold text-rose-600 dark:text-rose-400">{planSummary.overdueTasks}</p></div>
            </div>
            <div className="h-6 w-px bg-slate-200/50 dark:bg-slate-700/30" />
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15"><CalendarDays className="size-3.5 text-emerald-500" /></div>
              <div><p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Next 7 Days</p><p className="text-sm font-bold text-slate-800 dark:text-slate-100">{planSummary.next7DaysTasks}</p></div>
            </div>
          </div>
          {isLeader && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/30"
            >
              <Plus className="size-3.5" />
              Create Activity
            </button>
          )}
        </div>

        {/* Row 2: Filters + Navigation + View Switcher */}
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 ${filterOpen ? 'bg-indigo-500/10 text-indigo-600 ring-1 ring-indigo-500/20 dark:bg-indigo-500/15 dark:text-indigo-400' : 'border border-white/60 bg-white/70 text-slate-500 shadow-sm backdrop-blur-xl hover:bg-white/90 dark:border-slate-700/40 dark:bg-slate-800/60 dark:text-slate-400'}`}
            >
              <Filter className="size-3.5" />Filters
              {(filter.activityTypeIds.length + filter.picIds.length + filter.statuses.length + (filter.myTasksOnly ? 1 : 0)) > 0 && (
                <span className="flex size-4 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white">{filter.activityTypeIds.length + filter.picIds.length + filter.statuses.length + (filter.myTasksOnly ? 1 : 0)}</span>
              )}
            </button>
            <button
              onClick={() => onFilterChange?.({ ...filter, myTasksOnly: !filter.myTasksOnly })}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 ${filter.myTasksOnly ? 'bg-indigo-500/10 text-indigo-600 ring-1 ring-indigo-500/20 dark:bg-indigo-500/15 dark:text-indigo-400' : 'border border-white/60 bg-white/70 text-slate-500 shadow-sm backdrop-blur-xl hover:bg-white/90 dark:border-slate-700/40 dark:bg-slate-800/60 dark:text-slate-400'}`}
            ><User className="size-3.5" />My Tasks</button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button onClick={() => nav(-1)} className="rounded-lg border border-white/60 bg-white/70 p-1.5 text-slate-500 shadow-sm backdrop-blur-xl transition-all hover:bg-white/90 dark:border-slate-700/40 dark:bg-slate-800/60 dark:text-slate-400"><ChevronLeft className="size-4" /></button>
              <button onClick={() => nav(0)} className="rounded-lg border border-white/60 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur-xl transition-all hover:bg-white/90 dark:border-slate-700/40 dark:bg-slate-800/60 dark:text-slate-300">Today</button>
              <button onClick={() => nav(1)} className="rounded-lg border border-white/60 bg-white/70 p-1.5 text-slate-500 shadow-sm backdrop-blur-xl transition-all hover:bg-white/90 dark:border-slate-700/40 dark:bg-slate-800/60 dark:text-slate-400"><ChevronRight className="size-4" /></button>
            </div>
            <h2 className="min-w-[130px] text-center text-sm font-bold text-slate-800 lg:text-base dark:text-slate-100">{heading}</h2>
            <div className="flex rounded-xl border border-white/60 bg-white/50 p-0.5 shadow-sm backdrop-blur-xl dark:border-slate-700/40 dark:bg-slate-800/40">
              {(['month', 'week', 'day'] as ViewMode[]).map(v => (
                <button key={v} onClick={() => switchView(v)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all duration-200 ${view === v ? 'bg-white/90 text-indigo-600 shadow-sm dark:bg-slate-700/70 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>{v}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {filterOpen && (
          <div className={`${GLASS} flex flex-wrap items-center gap-3 p-3`}>
            <FilterDropdown
              label="Type"
              items={activityTypes}
              selectedIds={filter.activityTypeIds}
              onToggle={(id) => { const ids = filter.activityTypeIds.includes(id) ? filter.activityTypeIds.filter(i => i !== id) : [...filter.activityTypeIds, id]; onFilterChange?.({ ...filter, activityTypeIds: ids }) }}
              getLabel={at => at.name}
              renderDot={(at) => { const c = COLOR[at.color] ?? COLOR.indigo; return <span className={`size-1.5 shrink-0 rounded-full ${c.dot}`} /> }}
            />
            <div className="h-6 w-px bg-slate-200/50 dark:bg-slate-700/30" />
            <FilterDropdown
              label="PIC"
              items={users}
              selectedIds={filter.picIds}
              onToggle={(id) => { const ids = filter.picIds.includes(id) ? filter.picIds.filter(i => i !== id) : [...filter.picIds, id]; onFilterChange?.({ ...filter, picIds: ids }) }}
              getLabel={u => u.name}
            />
            <div className="h-6 w-px bg-slate-200/50 dark:bg-slate-700/30" />
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[11px] font-semibold text-slate-400">Status</span>
              {statuses.filter(s => s !== 'Archived').map(s => { const active = filter.statuses.includes(s); return (
                <button key={s} onClick={() => { const ss = active ? filter.statuses.filter(x => x !== s) : [...filter.statuses, s]; onFilterChange?.({ ...filter, statuses: ss }) }} className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all ${active ? 'bg-slate-200/60 text-slate-700 ring-1 ring-slate-300/40 dark:bg-slate-700/40 dark:text-slate-200' : 'text-slate-500 hover:bg-slate-100/60 dark:text-slate-400 dark:hover:bg-slate-700/30'}`}><span className={`size-1.5 rounded-full ${STATUS_DOT[s]}`} />{s}</button>
              ) })}
            </div>
          </div>
        )}
      </div>

      {/* ─── Calendar Grid (scrollable) ─── */}
      <div className={`min-h-0 flex-1 overflow-y-auto ${HIDE_SCROLL} p-4 pt-3 lg:px-6 lg:pb-5`}>

        {/* ── MONTH VIEW ── */}
        {view === 'month' && (
          <div className={`${GLASS} flex flex-col overflow-hidden p-0`}>
            {/* Day name headers */}
            <div className="grid grid-cols-7 border-b border-slate-200/40 dark:border-slate-700/30">
              {DAY_NAMES.map(d => (<div key={d} className="py-2.5 text-center text-[11px] font-semibold text-slate-400 dark:text-slate-500">{d}</div>))}
            </div>
            {/* Calendar cells — scrollable rows with min-height */}
            <div className="grid grid-cols-7" style={{ gridAutoRows: 'minmax(110px, auto)' }}>
              {monthCells.map((cell, i) => {
                const isToday = cell.date === todayStr
                const dayTasks = forDate(cell.date)
                const dayActivities = activitiesOnDate(cell.date)
                const orphans = orphanTasks(cell.date)
                const wl = wlMap[cell.date]
                const isSelected = dayDetailDate === cell.date
                // Count total visible items: each activity bar + its tasks + orphan tasks
                let totalItems = 0
                const activityItems: { activity: CalendarActivity; tasks: CalendarTask[] }[] = []
                for (const act of dayActivities) {
                  const actTasks = tasksForActivity(cell.date, act.id)
                  activityItems.push({ activity: act, tasks: actTasks })
                  totalItems += 1 + actTasks.length // 1 for bar + tasks
                }
                totalItems += orphans.length
                const overflow = totalItems - MAX_VISIBLE
                return (
                  <div
                    key={i}
                    onClick={() => openDayDetail(cell.date)}
                    className={`relative flex cursor-pointer flex-col border-b border-r border-slate-200/30 p-1.5 transition-all duration-150 dark:border-slate-700/20 ${!cell.isCurrent ? 'bg-slate-50/30 dark:bg-slate-900/20' : ''} ${isToday ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''} ${isSelected ? 'bg-indigo-50/60 ring-1 ring-inset ring-indigo-400/30 dark:bg-indigo-950/30' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'}`}
                  >
                    <div className="flex items-center justify-between px-0.5 pb-1">
                      <span className={`flex size-6 items-center justify-center rounded-full text-[11px] font-semibold ${isToday ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/30' : cell.isCurrent ? 'text-slate-700 dark:text-slate-200' : 'text-slate-300 dark:text-slate-600'}`}>{cell.day}</span>
                      {wl && wl.taskCount > 0 && (<span className={`hidden rounded-md px-1 py-0.5 text-[8px] font-bold lg:inline-block ${wl.isOverloaded ? 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400' : 'bg-slate-200/50 text-slate-400 dark:bg-slate-700/30 dark:text-slate-500'}`}>{wl.taskCount}</span>)}
                    </div>
                    {/* Desktop: activity bars with nested tasks */}
                    <div className="hidden flex-1 flex-col gap-0.5 md:flex">
                      {(() => {
                        let rendered = 0
                        const elements: React.ReactNode[] = []
                        for (const { activity, tasks: actTasks } of activityItems) {
                          if (rendered >= MAX_VISIBLE) break
                          const c = COLOR[activity.activityTypeColor] ?? COLOR.indigo
                          // Activity bar
                          elements.push(
                            <div key={`act-${activity.id}`} className={`flex items-center gap-1 truncate rounded-md ${c.softBg} px-1.5 py-[2px]`}>
                              <span className={`size-1.5 shrink-0 rounded-sm ${c.dot}`} />
                              <span className={`truncate text-[10px] font-semibold ${c.softText}`}>{activity.name}</span>
                            </div>
                          )
                          rendered++
                          // Nested tasks under this activity
                          for (const task of actTasks) {
                            if (rendered >= MAX_VISIBLE) break
                            const tc = COLOR[task.activityTypeColor] ?? COLOR.indigo
                            elements.push(
                              <button
                                key={task.id}
                                onClick={e => { e.stopPropagation(); openTaskDetail(task.id) }}
                                className={`group ml-2 flex items-center gap-1 truncate rounded-md ${tc.pill} px-1.5 py-[2px] text-left shadow-sm transition-all ${tc.hover}`}
                              >
                                <span className="truncate text-[9px] font-semibold text-white">{task.name}</span>
                                {task.isOverdue && <AlertTriangle className="ml-auto size-2.5 shrink-0 text-white/70" />}
                              </button>
                            )
                            rendered++
                          }
                        }
                        // Orphan tasks (not belonging to any activity)
                        for (const task of orphans) {
                          if (rendered >= MAX_VISIBLE) break
                          const c = COLOR[task.activityTypeColor] ?? COLOR.indigo
                          elements.push(
                            <button
                              key={task.id}
                              onClick={e => { e.stopPropagation(); openTaskDetail(task.id) }}
                              className={`group flex items-center gap-1 truncate rounded-md ${c.pill} px-1.5 py-[3px] text-left shadow-sm transition-all ${c.hover}`}
                            >
                              <span className="truncate text-[10px] font-semibold text-white">{task.name}</span>
                              {task.isOverdue && <AlertTriangle className="ml-auto size-2.5 shrink-0 text-white/70" />}
                            </button>
                          )
                          rendered++
                        }
                        return elements
                      })()}
                      {overflow > 0 && (
                        <button
                          onClick={e => { e.stopPropagation(); openDayDetail(cell.date); onDayExpand?.(cell.date) }}
                          className="px-1 text-left text-[10px] font-semibold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400"
                        >
                          +{overflow} more
                        </button>
                      )}
                    </div>
                    {/* Mobile: color dots */}
                    <div className="flex flex-wrap gap-0.5 px-0.5 md:hidden">
                      {dayActivities.slice(0, 3).map(a => (<span key={a.id} className={`size-1.5 rounded-full ${(COLOR[a.activityTypeColor] ?? COLOR.indigo).dot}`} />))}
                      {dayTasks.slice(0, Math.max(0, 5 - dayActivities.length)).map(t => (<span key={t.id} className={`size-1.5 rounded-full ${(COLOR[t.activityTypeColor] ?? COLOR.indigo).dot}`} />))}
                      {(dayActivities.length + dayTasks.length) > 5 && <span className="text-[8px] font-bold text-slate-400">+{dayActivities.length + dayTasks.length - 5}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── WEEK VIEW ── */}
        {view === 'week' && (
          <div className={`${GLASS} flex flex-col overflow-hidden p-0`}>
            <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-slate-200/40 dark:border-slate-700/30">
              <div />
              {weekDates.map(d => { const pd = parseDate(d); const isT = d === todayStr; return (
                <div key={d} className={`flex flex-col items-center py-2 ${isT ? 'bg-indigo-50/30 dark:bg-indigo-950/10' : ''}`}>
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">{DAY_NAMES[pd.getDay()]}</span>
                  <span className={`mt-0.5 flex size-7 items-center justify-center rounded-full text-sm font-bold ${isT ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/30' : 'text-slate-700 dark:text-slate-200'}`}>{pd.getDate()}</span>
                </div>
              ) })}
            </div>
            {/* All-day */}
            <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-slate-200/40 dark:border-slate-700/30">
              <div className="flex items-center justify-center border-r border-slate-200/30 py-1 text-[10px] font-medium text-slate-400 dark:border-slate-700/20">All day</div>
              {weekDates.map(d => {
                const dayActs = activitiesOnDate(d)
                const orphans2 = orphanTasks(d).filter(t => !t.startTime)
                return (
                  <div key={d} className="flex flex-col gap-0.5 border-r border-slate-200/30 p-1 last:border-r-0 dark:border-slate-700/20">
                    {dayActs.slice(0, 2).map(act => {
                      const c = COLOR[act.activityTypeColor] ?? COLOR.indigo
                      const actTasks = tasksForActivity(d, act.id).filter(t => !t.startTime)
                      return (
                        <div key={act.id}>
                          <div className={`flex items-center gap-1 truncate rounded-md ${c.softBg} px-1.5 py-[2px]`}>
                            <span className={`size-1.5 shrink-0 rounded-sm ${c.dot}`} />
                            <span className={`truncate text-[9px] font-semibold ${c.softText}`}>{act.name}</span>
                          </div>
                          {actTasks.slice(0, 2).map(t => {
                            const tc = COLOR[t.activityTypeColor] ?? COLOR.indigo
                            return <button key={t.id} onClick={() => openTaskDetail(t.id)} className={`ml-1.5 w-[calc(100%-6px)] truncate rounded-md ${tc.pill} px-1.5 py-0.5 text-left text-[9px] font-semibold text-white shadow-sm transition-all ${tc.hover}`}>{t.name}</button>
                          })}
                        </div>
                      )
                    })}
                    {orphans2.slice(0, 2).map(t => { const c = COLOR[t.activityTypeColor] ?? COLOR.indigo; return (
                      <button key={t.id} onClick={() => openTaskDetail(t.id)} className={`truncate rounded-md ${c.pill} px-1.5 py-0.5 text-left text-[10px] font-semibold text-white shadow-sm transition-all ${c.hover}`}>{t.name}</button>
                    ) })}
                    {(dayActs.length > 2 || orphans2.length > 2) && <span className="px-1 text-[9px] font-semibold text-indigo-500">+more</span>}
                  </div>
                )
              })}
            </div>
            {/* Time grid */}
            <div className={`flex-1 overflow-y-auto ${HIDE_SCROLL}`}>
              {timeSlots.map(slot => (
                <div key={slot.hour} className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-slate-200/20 dark:border-slate-700/15">
                  <div className="flex items-start justify-center border-r border-slate-200/30 px-1 py-1 text-[10px] font-medium text-slate-400 dark:border-slate-700/20">{slot.label}</div>
                  {weekDates.map(d => { const st = forDate(d).filter(t => t.startTime && parseInt(t.startTime.split(':')[0], 10) === slot.hour); return (
                    <div key={d} className="min-h-[36px] border-r border-slate-200/20 p-0.5 last:border-r-0 dark:border-slate-700/15">
                      {st.map(t => { const c = COLOR[t.activityTypeColor] ?? COLOR.indigo; const sh = parseInt(t.startTime!.split(':')[0], 10); const eh = t.endTime ? parseInt(t.endTime.split(':')[0], 10) : sh + 1; return (
                        <button key={t.id} onClick={() => openTaskDetail(t.id)} className={`w-full truncate rounded-lg ${c.pill} px-2 py-1.5 text-left shadow-sm transition-all ${c.hover}`} style={{ minHeight: `${Math.max(1, eh - sh) * 36 - 4}px` }}>
                          <span className="block truncate text-[10px] font-semibold text-white">{t.name}</span>
                          <span className="block text-[9px] font-medium text-white/70">{t.startTime} – {t.endTime}</span>
                        </button>
                      ) })}
                    </div>
                  ) })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DAY VIEW ── */}
        {view === 'day' && (() => {
          const dayActs = activitiesOnDate(date)
          const allDayOrphans = orphanTasks(date).filter(t => !t.startTime)
          const timed = forDate(date).filter(t => !!t.startTime)
          const hasAllDay = dayActs.length > 0 || allDayOrphans.length > 0
          return (
            <div className={`${GLASS} flex flex-col overflow-hidden p-0`}>
              {hasAllDay && (
                <div className="border-b border-slate-200/40 p-3 dark:border-slate-700/30">
                  <p className="mb-2 text-[11px] font-semibold text-slate-400">All Day</p>
                  <div className="flex flex-col gap-1.5">
                    {dayActs.map(act => {
                      const c = COLOR[act.activityTypeColor] ?? COLOR.indigo
                      const actTasks = tasksForActivity(date, act.id).filter(t => !t.startTime)
                      return (
                        <div key={act.id} className="space-y-1">
                          <div className={`flex items-center gap-2 rounded-xl ${c.softBg} px-3 py-2`}>
                            <span className={`size-2 shrink-0 rounded-sm ${c.dot}`} />
                            <span className={`text-xs font-semibold ${c.softText}`}>{act.name}</span>
                            <span className={`ml-auto text-[10px] ${c.softText} opacity-70`}>{fmtShort(act.startDate)} – {fmtShort(act.endDate)}</span>
                          </div>
                          {actTasks.map(t => { const tc = COLOR[t.activityTypeColor] ?? COLOR.indigo; return (
                            <button key={t.id} onClick={() => openTaskDetail(t.id)} className={`ml-4 flex w-[calc(100%-16px)] items-center gap-3 rounded-xl ${tc.pill} px-3 py-2.5 text-left shadow-sm transition-all ${tc.hover}`}>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold text-white">{t.name}</p>
                                <p className="truncate text-[10px] text-white/70">{t.activityName}</p>
                              </div>
                              <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-white/20 text-[9px] font-bold text-white">{getInitials(t.picName)}</div>
                              {t.isOverdue && <AlertTriangle className="size-3.5 shrink-0 text-white/70" />}
                            </button>
                          ) })}
                        </div>
                      )
                    })}
                    {allDayOrphans.map(t => { const c = COLOR[t.activityTypeColor] ?? COLOR.indigo; return (
                      <button key={t.id} onClick={() => openTaskDetail(t.id)} className={`flex items-center gap-3 rounded-xl ${c.pill} px-3 py-2.5 text-left shadow-sm transition-all ${c.hover}`}>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-white">{t.name}</p>
                          <p className="truncate text-[10px] text-white/70">{t.activityName}</p>
                        </div>
                        <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-white/20 text-[9px] font-bold text-white">{getInitials(t.picName)}</div>
                        {t.isOverdue && <AlertTriangle className="size-3.5 shrink-0 text-white/70" />}
                      </button>
                    ) })}
                  </div>
                </div>
              )}
              <div className={`flex-1 overflow-y-auto ${HIDE_SCROLL}`}>
                {timeSlots.map(slot => { const st = timed.filter(t => parseInt(t.startTime!.split(':')[0], 10) === slot.hour); return (
                  <div key={slot.hour} className="flex border-b border-slate-200/20 dark:border-slate-700/15">
                    <div className="flex w-16 shrink-0 items-start justify-center border-r border-slate-200/30 px-2 py-2 text-[11px] font-medium text-slate-400 dark:border-slate-700/20">{slot.label}</div>
                    <div className="min-h-[48px] flex-1 p-1">
                      {st.map(t => { const c = COLOR[t.activityTypeColor] ?? COLOR.indigo; return (
                        <button key={t.id} onClick={() => openTaskDetail(t.id)} className={`flex w-full items-center gap-3 rounded-xl ${c.pill} px-3 py-2.5 text-left shadow-sm transition-all ${c.hover}`}>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-white">{t.name}</p>
                            <p className="truncate text-[10px] text-white/70">{t.activityName} · {t.startTime} – {t.endTime}</p>
                          </div>
                          <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-white/20 text-[9px] font-bold text-white">{getInitials(t.picName)}</div>
                        </button>
                      ) })}
                    </div>
                  </div>
                ) })}
              </div>
            </div>
          )
        })()}
      </div>

      {/* ─── Day Detail Panel (click on a date) ─── */}
      {dayDetailDate && !selectedTaskId && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm lg:absolute lg:inset-y-0 lg:right-0 lg:w-[360px]">
          <div className="flex-1 bg-slate-900/20 backdrop-blur-sm lg:hidden" onClick={closeDayDetail} />
          <div className="flex w-80 flex-col border-l border-white/60 bg-white/95 backdrop-blur-2xl lg:w-full dark:border-slate-700/40 dark:bg-slate-900/95" style={{ boxShadow: '-4px 0 24px rgba(0,0,0,0.06)' }}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200/40 px-4 py-3 dark:border-slate-700/30">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{fmtLong(dayDetailDate)}</h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">{dayDetailTasks.length} task{dayDetailTasks.length !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={closeDayDetail} className="rounded-lg p-1 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"><X className="size-4" /></button>
            </div>
            {/* Task list grouped by activity */}
            <div className={`flex-1 overflow-y-auto ${HIDE_SCROLL} p-3`}>
              {(() => {
                const panelActs = dayDetailDate ? activitiesOnDate(dayDetailDate) : []
                const panelOrphans = dayDetailDate ? orphanTasks(dayDetailDate) : []
                const hasContent = panelActs.length > 0 || panelOrphans.length > 0

                if (!hasContent && dayDetailTasks.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <CalendarDays className="mb-2 size-8 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm font-medium text-slate-400 dark:text-slate-500">No tasks on this day</p>
                    </div>
                  )
                }

                return (
                  <div className="space-y-3">
                    {panelActs.map(act => {
                      const c = COLOR[act.activityTypeColor] ?? COLOR.indigo
                      const actTasks = dayDetailDate ? tasksForActivity(dayDetailDate, act.id) : []
                      return (
                        <div key={act.id}>
                          <div className={`flex items-center gap-2 rounded-xl ${c.softBg} px-3 py-2 mb-1.5`}>
                            <span className={`size-2 shrink-0 rounded-sm ${c.dot}`} />
                            <div className="min-w-0 flex-1">
                              <span className={`text-xs font-semibold ${c.softText}`}>{act.name}</span>
                              <p className={`text-[10px] ${c.softText} opacity-70`}>{fmtShort(act.startDate)} – {fmtShort(act.endDate)}</p>
                            </div>
                            {isLeader && (
                              <button
                                onClick={(e) => { e.stopPropagation(); onActivityEdit?.(act.id) }}
                                className="rounded-md p-1 text-slate-400 transition-colors hover:bg-white/60 hover:text-indigo-500 dark:hover:bg-slate-700/40 dark:hover:text-indigo-400"
                              >
                                <Pencil className="size-3" />
                              </button>
                            )}
                          </div>
                          {actTasks.length === 0 ? (
                            <p className="ml-4 text-[10px] italic text-slate-400 dark:text-slate-500">No tasks</p>
                          ) : (
                            <div className="space-y-1.5">
                              {actTasks.map(task => {
                                const tc = COLOR[task.activityTypeColor] ?? COLOR.indigo
                                return (
                                  <button
                                    key={task.id}
                                    onClick={() => openTaskFromDay(task.id)}
                                    className={`group ml-3 flex w-[calc(100%-12px)] flex-col rounded-xl ${tc.pill} p-3 text-left shadow-sm transition-all ${tc.hover}`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <p className="text-xs font-bold text-white">{task.name}</p>
                                      {task.isOverdue && <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-white/70" />}
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                      <div className="flex items-center gap-1">
                                        <div className="flex size-4 items-center justify-center rounded bg-white/20 text-[7px] font-bold text-white">{getInitials(task.picName)}</div>
                                        <span className="text-[10px] font-medium text-white/80">{task.picName}</span>
                                      </div>
                                      <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[9px] font-semibold text-white/90">{task.status}</span>
                                      {task.startTime && (
                                        <span className="flex items-center gap-0.5 text-[9px] text-white/70">
                                          <Clock className="size-2.5" />{task.startTime} – {task.endTime}
                                        </span>
                                      )}
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {/* Orphan tasks */}
                    {panelOrphans.map(task => {
                      const c = COLOR[task.activityTypeColor] ?? COLOR.indigo
                      return (
                        <button
                          key={task.id}
                          onClick={() => openTaskFromDay(task.id)}
                          className={`group flex w-full flex-col rounded-xl ${c.pill} p-3 text-left shadow-sm transition-all ${c.hover}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-bold text-white">{task.name}</p>
                            {task.isOverdue && <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-white/70" />}
                          </div>
                          <p className="mt-0.5 text-[10px] text-white/70">{task.activityName}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <div className="flex size-4 items-center justify-center rounded bg-white/20 text-[7px] font-bold text-white">{getInitials(task.picName)}</div>
                              <span className="text-[10px] font-medium text-white/80">{task.picName}</span>
                            </div>
                            <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[9px] font-semibold text-white/90">{task.status}</span>
                            {task.startTime && (
                              <span className="flex items-center gap-0.5 text-[9px] text-white/70">
                                <Clock className="size-2.5" />{task.startTime} – {task.endTime}
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ─── Task Detail Side Panel ─── */}
      {selectedTask && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm lg:absolute lg:inset-y-0 lg:right-0 lg:w-[360px]">
          <div className="flex-1 bg-slate-900/20 backdrop-blur-sm lg:hidden" onClick={closeTaskDetail} />
          <div className="flex w-80 flex-col border-l border-white/60 bg-white/95 backdrop-blur-2xl lg:w-full dark:border-slate-700/40 dark:bg-slate-900/95" style={{ boxShadow: '-4px 0 24px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center justify-between border-b border-slate-200/40 px-4 py-3 dark:border-slate-700/30">
              <div className="flex items-center gap-2">
                {dayDetailDate && (
                  <button onClick={backToDayDetail} className="rounded-lg p-1 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"><ArrowLeft className="size-4" /></button>
                )}
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Task Details</h3>
              </div>
              <button onClick={() => { closeTaskDetail(); closeDayDetail() }} className="rounded-lg p-1 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"><X className="size-4" /></button>
            </div>
            <div className={`flex-1 overflow-y-auto ${HIDE_SCROLL} p-4`}>
              {(() => { const c = COLOR[selectedTask.activityTypeColor] ?? COLOR.indigo; return (
                <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-semibold ${c.softBg} ${c.softText}`}><span className={`size-1.5 rounded-full ${c.dot}`} />{selectedTask.activityTypeName} · {selectedTask.activityName}</span>
              ) })()}
              <h4 className="mt-3 text-base font-bold text-slate-800 dark:text-slate-100">{selectedTask.name}</h4>
              <div className="mt-2.5 flex items-center gap-2">
                {(() => { const st = STATUS_LABEL[selectedTask.status]; return (
                  <span className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold ${st.bg} ${st.text}`}>{selectedTask.status}</span>
                ) })()}
                {selectedTask.isOverdue && (<span className="flex items-center gap-1 rounded-lg bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:bg-rose-500/15 dark:text-rose-400"><AlertTriangle className="size-3" />Overdue</span>)}
              </div>
              {taskDetail && taskDetail.id === selectedTask.id && taskDetail.description && (
                <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{taskDetail.description}</p>
              )}
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400">PIC</span>
                  <div className="flex items-center gap-1.5">
                    <div className="flex size-5 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-500 text-[8px] font-bold text-white">{getInitials(selectedTask.picName)}</div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{selectedTask.picName}</span>
                  </div>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-slate-200/50 to-transparent dark:via-slate-700/30" />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400">Timeline</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{fmtShort(selectedTask.startDate)} – {fmtShort(selectedTask.endDate)}</span>
                </div>
                {selectedTask.startTime && (<>
                  <div className="h-px bg-gradient-to-r from-transparent via-slate-200/50 to-transparent dark:via-slate-700/30" />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-400">Time</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{selectedTask.startTime} – {selectedTask.endTime}</span>
                  </div>
                </>)}
                <div className="h-px bg-gradient-to-r from-transparent via-slate-200/50 to-transparent dark:via-slate-700/30" />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400">Type</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{selectedTask.activityTypeName}</span>
                </div>
              </div>
              {taskDetail && taskDetail.id === selectedTask.id && taskDetail.approvers.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-[11px] font-semibold text-slate-400">Approvers</p>
                  <div className="flex flex-wrap gap-1.5">
                    {taskDetail.approvers.map(a => (
                      <span key={a.id} className="flex items-center gap-1 rounded-lg bg-slate-100/60 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:bg-slate-700/30 dark:text-slate-300"><CheckCircle2 className="size-3 text-emerald-500" />{a.name}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Conflict Warnings ─── */}
      {conflictWarnings.length > 0 && (
        <div className={`fixed bottom-20 z-40 flex flex-col gap-2 md:bottom-4 ${panelOpen ? 'right-[380px]' : 'right-4'} lg:absolute lg:bottom-4 transition-all`}>
          {conflictWarnings.map((cw, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl border border-amber-200/50 bg-amber-50/90 px-3 py-2 shadow-lg backdrop-blur-xl dark:border-amber-700/30 dark:bg-amber-950/80">
              <AlertTriangle className="size-4 shrink-0 text-amber-500" />
              <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300">{cw.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* ─── Create Activity Modal ─── */}
      <CreateActivityModal
        open={createModalOpen}
        activityTypes={activityTypes}
        users={users}
        reminderTemplates={reminderTemplates}
        waChannels={waChannels ?? []}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={onCreateActivity}
        existingTasks={tasks.map(t => ({ pics: [{ id: t.picId, name: t.picName }], startDate: t.startDate, endDate: t.endDate }))}
      />

      {/* ─── Edit Activity Modal ─── */}
      <CreateActivityModal
        open={!!editModalOpen}
        activityTypes={activityTypes}
        users={users}
        reminderTemplates={reminderTemplates}
        waChannels={waChannels ?? []}
        onClose={() => onEditModalClose?.()}
        editData={editActivityData}
        onEdit={onEditActivity}
        existingTasks={tasks.map(t => ({ pics: [{ id: t.picId, name: t.picName }], startDate: t.startDate, endDate: t.endDate }))}
      />
    </div>
  )
}
