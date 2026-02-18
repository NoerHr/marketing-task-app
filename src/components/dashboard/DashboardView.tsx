import { useState } from 'react'
import {
  SlidersHorizontal,
  X,
  Zap,
  CheckCircle2,
  Archive,
  Flame,
  Users,
  Wallet,
  ClipboardList,
  ListTodo,
  Clock,
  TrendingUp,
  Inbox,
} from 'lucide-react'
import type {
  DashboardProps,
  RecentTasksFilter,
} from '@/types/dashboard'
import { DashboardCard } from './DashboardCard'
import { StatusBadge } from './StatusBadge'

/* ─── Scrollbar-hidden utility ─────────────────────────── */
const HIDE_SCROLL =
  '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden'

/* ─── Helpers ──────────────────────────────────────────── */

const borderColorMap: Record<string, string> = {
  rose: 'border-l-rose-400',
  violet: 'border-l-violet-400',
  pink: 'border-l-pink-400',
  amber: 'border-l-amber-400',
  teal: 'border-l-teal-400',
  sky: 'border-l-sky-400',
  indigo: 'border-l-indigo-400',
  emerald: 'border-l-emerald-400',
  red: 'border-l-red-400',
  blue: 'border-l-blue-400',
  green: 'border-l-green-400',
  purple: 'border-l-purple-400',
  cyan: 'border-l-cyan-400',
  orange: 'border-l-orange-400',
  lime: 'border-l-lime-400',
  fuchsia: 'border-l-fuchsia-400',
  yellow: 'border-l-yellow-400',
}

const dotColorMap: Record<string, string> = {
  rose: 'bg-rose-400',
  violet: 'bg-violet-400',
  pink: 'bg-pink-400',
  amber: 'bg-amber-400',
  teal: 'bg-teal-400',
  sky: 'bg-sky-400',
  indigo: 'bg-indigo-400',
  emerald: 'bg-emerald-400',
  red: 'bg-red-400',
  blue: 'bg-blue-400',
  green: 'bg-green-400',
  purple: 'bg-purple-400',
  cyan: 'bg-cyan-400',
  orange: 'bg-orange-400',
  lime: 'bg-lime-400',
  fuchsia: 'bg-fuchsia-400',
  yellow: 'bg-yellow-400',
}

function getBorderColor(color: string): string {
  return borderColorMap[color] ?? 'border-l-slate-400'
}

function getDotColor(color: string): string {
  return dotColorMap[color] ?? 'bg-slate-400'
}

function formatBudget(amount: number): string {
  if (amount >= 1_000_000_000)
    return `${(amount / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`
  if (amount >= 1_000_000)
    return `${(amount / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`
  return amount.toString()
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/* ─── Mini Progress Ring ───────────────────────────────── */

function MiniRing({
  percent,
  size = 40,
  stroke = 3,
}: {
  percent: number
  size?: number
  stroke?: number
}) {
  const r = (size - stroke * 2) / 2
  const c = 2 * Math.PI * r
  return (
    <svg className="shrink-0 -rotate-90" width={size} height={size}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        className="stroke-slate-200/60 dark:stroke-slate-700/40"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        className="stroke-indigo-500 dark:stroke-indigo-400"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (percent / 100) * c}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  )
}

/* ─── Icon Wrapper ─────────────────────────────────────── */

function CardIcon({
  children,
  color = 'indigo',
}: {
  children: React.ReactNode
  color?: string
}) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-500/10 text-indigo-500 dark:bg-indigo-400/10 dark:text-indigo-400',
    rose: 'bg-rose-500/10 text-rose-500 dark:bg-rose-400/10 dark:text-rose-400',
    violet: 'bg-violet-500/10 text-violet-500 dark:bg-violet-400/10 dark:text-violet-400',
    amber: 'bg-amber-500/10 text-amber-500 dark:bg-amber-400/10 dark:text-amber-400',
    sky: 'bg-sky-500/10 text-sky-500 dark:bg-sky-400/10 dark:text-sky-400',
    emerald: 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-400/10 dark:text-emerald-400',
  }
  return (
    <div
      className={`flex size-8 items-center justify-center rounded-xl ${colorMap[color] ?? colorMap.indigo}`}
    >
      {children}
    </div>
  )
}

/* ─── Empty State ──────────────────────────────────────── */

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-slate-500/5 dark:bg-slate-400/5">
        {icon}
      </div>
      <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">
        {title}
      </p>
      {description && (
        <p className="mt-1 text-xs text-slate-400/70 dark:text-slate-500/70">
          {description}
        </p>
      )}
    </div>
  )
}

/* ─── Main Component ───────────────────────────────────── */

export function DashboardView({
  currentUser,
  greeting,
  activitySummary,
  overdueTasks,
  recentTasks,
  picProgress,
  budgetOverview,
  myTasks,
  nearestDeadlines,
  myProgress,
  activities,
  users,
  onViewAll,
  onTaskClick,
  onActivityClick,
  onPicClick,
  onRecentTasksFilterChange,
}: DashboardProps) {
  const isLeader = currentUser.role === 'Leader'
  const [showFilter, setShowFilter] = useState(false)
  const [filter, setFilter] = useState<RecentTasksFilter>({})

  const handleFilterChange = (updates: Partial<RecentTasksFilter>) => {
    const next = { ...filter, ...updates }
    setFilter(next)
    onRecentTasksFilterChange?.(next)
  }

  const resetFilter = () => {
    setFilter({})
    onRecentTasksFilterChange?.({})
  }

  /* Activity summary proportions */
  const summaryTotal =
    activitySummary.active +
    activitySummary.completed +
    activitySummary.needReview +
    activitySummary.archived
  const summaryPercent = (v: number) =>
    summaryTotal > 0 ? (v / summaryTotal) * 100 : 0

  /* My Progress ring */
  const progressRadius = 52
  const progressCircumference = 2 * Math.PI * progressRadius

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-slate-100/80 to-indigo-50/40 font-['Plus_Jakarta_Sans'] dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* ═══════════════════════════════════════════════
            GREETING
        ═══════════════════════════════════════════════ */}
        <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-7 shadow-xl shadow-slate-900/[0.06] backdrop-blur-xl dark:border-slate-700/40 dark:bg-slate-800/70 dark:shadow-black/30">
          {/* Decorative glow */}
          <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-indigo-400/[0.07] blur-3xl dark:bg-indigo-500/[0.08]" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 size-40 rounded-full bg-amber-400/[0.06] blur-3xl dark:bg-amber-500/[0.06]" />

          <div className="relative flex items-center gap-5">
            {/* Avatar with gradient ring */}
            <div className="relative flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/25">
              <span className="text-lg font-extrabold text-white">
                {getInitials(currentUser.name)}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-800 sm:text-2xl dark:text-slate-100">
                {getGreeting()}, {currentUser.name}!
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Your team overview for today
              </p>
            </div>
          </div>

          {/* Metric badges — floating glass pills */}
          <div className="relative mt-6 flex flex-wrap gap-3">
            <div className="flex items-center gap-2.5 rounded-2xl border border-rose-200/40 bg-rose-50/60 px-4 py-2.5 backdrop-blur-sm dark:border-rose-800/30 dark:bg-rose-950/30">
              <Flame className="size-4 text-rose-500 dark:text-rose-400" />
              <span className="text-lg font-extrabold text-rose-500 dark:text-rose-400">
                {greeting.overdueTasksCount}
              </span>
              <span className="text-xs font-medium text-rose-600/70 dark:text-rose-400/70">
                overdue {greeting.overdueTasksCount === 1 ? 'task' : 'tasks'}
              </span>
            </div>
            <div className="flex items-center gap-2.5 rounded-2xl border border-indigo-200/40 bg-indigo-50/60 px-4 py-2.5 backdrop-blur-sm dark:border-indigo-800/30 dark:bg-indigo-950/30">
              <Zap className="size-4 text-indigo-500 dark:text-indigo-400" />
              <span className="text-lg font-extrabold text-indigo-500 dark:text-indigo-400">
                {greeting.activitiesThisWeek}
              </span>
              <span className="text-xs font-medium text-indigo-600/70 dark:text-indigo-400/70">
                {greeting.activitiesThisWeek === 1 ? 'activity' : 'activities'}{' '}
                this week
              </span>
            </div>
          </div>
        </div>

        {isLeader ? (
          <>
            {/* ═══════════════════════════════════════════
                ACTIVITY SUMMARY — Full Width
            ═══════════════════════════════════════════ */}
            <DashboardCard
              title="Activity Summary"
              onViewAll={() => onViewAll?.('activity-summary')}
              icon={
                <CardIcon color="indigo">
                  <Zap className="size-4" />
                </CardIcon>
              }
            >
              {/* 4 stat blocks */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-indigo-200/30 bg-gradient-to-br from-indigo-50/80 to-indigo-50/30 p-4 dark:border-indigo-800/20 dark:from-indigo-950/40 dark:to-indigo-950/10">
                  <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-indigo-500/15 dark:bg-indigo-400/15">
                    <Zap className="size-4 text-indigo-500 dark:text-indigo-400" />
                  </div>
                  <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                    {activitySummary.active}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-indigo-500/70 dark:text-indigo-400/60">
                    Active
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-200/30 bg-gradient-to-br from-emerald-50/80 to-emerald-50/30 p-4 dark:border-emerald-800/20 dark:from-emerald-950/40 dark:to-emerald-950/10">
                  <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-emerald-500/15 dark:bg-emerald-400/15">
                    <CheckCircle2 className="size-4 text-emerald-500 dark:text-emerald-400" />
                  </div>
                  <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {activitySummary.completed}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-emerald-500/70 dark:text-emerald-400/60">
                    Completed
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-200/30 bg-gradient-to-br from-amber-50/80 to-amber-50/30 p-4 dark:border-amber-800/20 dark:from-amber-950/40 dark:to-amber-950/10">
                  <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-amber-500/15 dark:bg-amber-400/15">
                    <Clock className="size-4 text-amber-500 dark:text-amber-400" />
                  </div>
                  <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                    {activitySummary.needReview}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-amber-500/70 dark:text-amber-400/60">
                    Need Review
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200/30 bg-gradient-to-br from-slate-100/80 to-slate-50/30 p-4 dark:border-slate-700/20 dark:from-slate-800/40 dark:to-slate-800/10">
                  <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-slate-500/15 dark:bg-slate-400/15">
                    <Archive className="size-4 text-slate-500 dark:text-slate-400" />
                  </div>
                  <p className="text-2xl font-extrabold text-slate-600 dark:text-slate-400">
                    {activitySummary.archived}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-slate-500/70 dark:text-slate-400/60">
                    Archived
                  </p>
                </div>
              </div>

              {/* Proportion bar */}
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  <span>{summaryTotal} total activities</span>
                  <span>
                    {summaryPercent(activitySummary.active).toFixed(0)}% active
                  </span>
                </div>
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="rounded-l-full bg-indigo-500 transition-all duration-700 dark:bg-indigo-400"
                    style={{
                      width: `${summaryPercent(activitySummary.active)}%`,
                    }}
                  />
                  <div
                    className="bg-emerald-500 transition-all duration-700 dark:bg-emerald-400"
                    style={{
                      width: `${summaryPercent(activitySummary.completed)}%`,
                    }}
                  />
                  <div
                    className="bg-amber-500 transition-all duration-700 dark:bg-amber-400"
                    style={{
                      width: `${summaryPercent(activitySummary.needReview)}%`,
                    }}
                  />
                  <div
                    className="rounded-r-full bg-slate-300 transition-all duration-700 dark:bg-slate-600"
                    style={{
                      width: `${summaryPercent(activitySummary.archived)}%`,
                    }}
                  />
                </div>
              </div>
            </DashboardCard>

            {/* ═══════════════════════════════════════════
                3-COLUMN ROW: Overdue | PIC Progress | Budget
            ═══════════════════════════════════════════ */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* ── Overdue Tasks ────────────────────── */}
              <DashboardCard
                title="Overdue Tasks"
                count={overdueTasks.length}
                onViewAll={() => onViewAll?.('overdue-tasks')}
                icon={
                  <CardIcon color="rose">
                    <Flame className="size-4" />
                  </CardIcon>
                }
              >
                {overdueTasks.length === 0 ? (
                  <EmptyState
                    icon={<CheckCircle2 className="size-5 text-emerald-400 dark:text-emerald-500" />}
                    title="No overdue tasks"
                    description="All tasks are on track"
                  />
                ) : (
                  <div
                    className={`-mx-1 max-h-[340px] space-y-2.5 overflow-y-auto px-1 ${HIDE_SCROLL}`}
                  >
                    {overdueTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => onTaskClick?.(task.id)}
                        className={`w-full rounded-2xl border-l-[3px] ${getBorderColor(task.activityTypeColor)} border border-l-[3px] border-slate-200/40 bg-white/60 p-3.5 text-left transition-all hover:bg-white/90 hover:shadow-md hover:shadow-slate-900/[0.04] dark:border-slate-700/30 dark:bg-slate-800/40 dark:hover:bg-slate-800/70`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                              {task.name}
                            </p>
                            <p className="mt-1 truncate text-xs text-slate-400 dark:text-slate-500">
                              {task.activityName} &middot; {task.picName}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-lg bg-rose-500/10 px-2 py-0.5 text-[11px] font-bold text-rose-600 dark:bg-rose-400/10 dark:text-rose-400">
                            {task.daysOverdue}d
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </DashboardCard>

              {/* ── PIC Progress ─────────────────────── */}
              <DashboardCard
                title="PIC Progress"
                count={picProgress.length}
                onViewAll={() => onViewAll?.('pic-progress')}
                icon={
                  <CardIcon color="violet">
                    <Users className="size-4" />
                  </CardIcon>
                }
              >
                {picProgress.length === 0 ? (
                  <EmptyState
                    icon={<Users className="size-5 text-slate-300 dark:text-slate-600" />}
                    title="No team members"
                    description="Add PICs to see their progress"
                  />
                ) : (
                  <div
                    className={`-mx-1 max-h-[340px] space-y-3 overflow-y-auto px-1 ${HIDE_SCROLL}`}
                  >
                    {picProgress.map((pic) => (
                      <button
                        key={pic.userId}
                        onClick={() => onPicClick?.(pic.userId)}
                        className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-all hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        {/* Mini progress ring with initials */}
                        <div className="relative flex shrink-0 items-center justify-center">
                          <MiniRing percent={pic.completionPercent} />
                          <span className="absolute text-[10px] font-bold text-slate-600 dark:text-slate-300">
                            {getInitials(pic.name)}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                              {pic.name}
                            </p>
                            <span className="ml-2 text-xs font-extrabold text-indigo-500 dark:text-indigo-400">
                              {pic.completionPercent}%
                            </span>
                          </div>
                          <div className="mt-1 flex gap-3 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                            <span>{pic.approved} done</span>
                            <span>{pic.inProgress} active</span>
                            {pic.overdue > 0 && (
                              <span className="text-rose-500 dark:text-rose-400">
                                {pic.overdue} late
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </DashboardCard>

              {/* ── Budget Overview ──────────────────── */}
              <DashboardCard
                title="Budget Overview"
                count={budgetOverview.length}
                onViewAll={() => onViewAll?.('budget-overview')}
                className="md:col-span-2 lg:col-span-1"
                icon={
                  <CardIcon color="amber">
                    <Wallet className="size-4" />
                  </CardIcon>
                }
              >
                {budgetOverview.length === 0 ? (
                  <EmptyState
                    icon={<Wallet className="size-5 text-slate-300 dark:text-slate-600" />}
                    title="No budget data"
                    description="Budget info will appear when activities have budgets"
                  />
                ) : (
                  <div
                    className={`-mx-1 max-h-[340px] space-y-3 overflow-y-auto px-1 ${HIDE_SCROLL}`}
                  >
                    {budgetOverview.map((item) => {
                      const percent =
                        item.estimatedBudget > 0
                          ? Math.round(
                              (item.spentBudget / item.estimatedBudget) * 100
                            )
                          : 0
                      const isOver = item.spentBudget >= item.estimatedBudget

                      return (
                        <button
                          key={item.activityId}
                          onClick={() => onActivityClick?.(item.activityId)}
                          className="w-full rounded-2xl p-3 text-left transition-all hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={`size-2 rounded-full ${getDotColor(item.activityTypeColor)}`}
                              />
                              <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                                {item.activityName}
                              </p>
                            </div>
                            <span
                              className={`ml-2 text-xs font-extrabold ${
                                isOver
                                  ? 'text-rose-500 dark:text-rose-400'
                                  : 'text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {percent}%
                            </span>
                          </div>
                          {/* Budget bar */}
                          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isOver
                                  ? 'bg-gradient-to-r from-rose-400 to-rose-500 dark:from-rose-500 dark:to-rose-400'
                                  : 'bg-gradient-to-r from-indigo-400 to-indigo-500 dark:from-indigo-500 dark:to-indigo-400'
                              }`}
                              style={{ width: `${Math.min(percent, 100)}%` }}
                            />
                          </div>
                          <div className="mt-1.5 flex justify-between text-[11px] font-medium text-slate-400 dark:text-slate-500">
                            <span>Rp {formatBudget(item.spentBudget)}</span>
                            <span>
                              Rp {formatBudget(item.estimatedBudget)}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </DashboardCard>
            </div>

            {/* ═══════════════════════════════════════════
                RECENT TASKS — Full Width
            ═══════════════════════════════════════════ */}
            <DashboardCard
              title="Recent Tasks"
              count={recentTasks.length}
              onViewAll={() => onViewAll?.('recent-tasks')}
              icon={
                <CardIcon color="sky">
                  <ClipboardList className="size-4" />
                </CardIcon>
              }
              headerAction={
                <button
                  onClick={() => setShowFilter(!showFilter)}
                  className={`rounded-xl border p-2 transition-all ${
                    showFilter
                      ? 'border-indigo-200/50 bg-indigo-50/60 text-indigo-500 dark:border-indigo-800/30 dark:bg-indigo-950/30 dark:text-indigo-400'
                      : 'border-slate-200/40 bg-white/50 text-slate-400 hover:text-slate-600 dark:border-slate-700/30 dark:bg-slate-800/30 dark:text-slate-500 dark:hover:text-slate-300'
                  }`}
                >
                  <SlidersHorizontal className="size-3.5" />
                </button>
              }
            >
              {/* Filter Panel */}
              {showFilter && (
                <div className="mb-5 rounded-2xl border border-slate-200/40 bg-slate-50/60 p-5 dark:border-slate-700/30 dark:bg-slate-900/40">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={filter.startDate ?? ''}
                        onChange={(e) =>
                          handleFilterChange({
                            startDate: e.target.value || undefined,
                          })
                        }
                        className="w-full rounded-xl border border-slate-200/50 bg-white/70 px-3 py-2 text-sm text-slate-800 outline-none backdrop-blur-sm focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300/30 dark:border-slate-700/40 dark:bg-slate-800/50 dark:text-slate-100 dark:focus:border-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={filter.endDate ?? ''}
                        onChange={(e) =>
                          handleFilterChange({
                            endDate: e.target.value || undefined,
                          })
                        }
                        className="w-full rounded-xl border border-slate-200/50 bg-white/70 px-3 py-2 text-sm text-slate-800 outline-none backdrop-blur-sm focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300/30 dark:border-slate-700/40 dark:bg-slate-800/50 dark:text-slate-100 dark:focus:border-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                        Activity
                      </label>
                      <select
                        value={filter.activityId ?? ''}
                        onChange={(e) =>
                          handleFilterChange({
                            activityId: e.target.value || undefined,
                          })
                        }
                        className="w-full rounded-xl border border-slate-200/50 bg-white/70 px-3 py-2 text-sm text-slate-800 outline-none backdrop-blur-sm focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300/30 dark:border-slate-700/40 dark:bg-slate-800/50 dark:text-slate-100 dark:focus:border-indigo-600"
                      >
                        <option value="">All Activities</option>
                        {activities.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                        PIC
                      </label>
                      <select
                        value={filter.picId ?? ''}
                        onChange={(e) =>
                          handleFilterChange({
                            picId: e.target.value || undefined,
                          })
                        }
                        className="w-full rounded-xl border border-slate-200/50 bg-white/70 px-3 py-2 text-sm text-slate-800 outline-none backdrop-blur-sm focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300/30 dark:border-slate-700/40 dark:bg-slate-800/50 dark:text-slate-100 dark:focus:border-indigo-600"
                      >
                        <option value="">All PICs</option>
                        {users
                          .filter((u) => u.role === 'PIC')
                          .map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={resetFilter}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200/40 bg-white/50 px-4 py-2 text-xs font-semibold text-slate-500 transition-all hover:bg-white/80 dark:border-slate-700/30 dark:bg-slate-800/30 dark:text-slate-400 dark:hover:bg-slate-800/60"
                    >
                      <X className="size-3" />
                      Reset
                    </button>
                  </div>
                </div>
              )}

              {recentTasks.length === 0 ? (
                <EmptyState
                  icon={<Inbox className="size-5 text-slate-300 dark:text-slate-600" />}
                  title="No recent tasks"
                  description="Tasks will appear here as they are created"
                />
              ) : (
                <>
                  {/* Task Table — desktop: table, mobile: cards */}
                  {/* Desktop table */}
                  <div className="hidden lg:block">
                    <div className="mb-3 grid grid-cols-[1fr_160px_110px_150px_110px] gap-4 px-4 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                      <span>Task</span>
                      <span>Activity</span>
                      <span>PIC</span>
                      <span>Date</span>
                      <span className="text-right">Status</span>
                    </div>
                    <div
                      className={`max-h-[340px] space-y-1.5 overflow-y-auto ${HIDE_SCROLL}`}
                    >
                      {recentTasks.map((task) => {
                        const fmt = (d: string) =>
                          new Date(d).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                          })
                        return (
                          <button
                            key={task.id}
                            onClick={() => onTaskClick?.(task.id)}
                            className="grid w-full grid-cols-[1fr_160px_110px_150px_110px] items-center gap-4 rounded-2xl border border-transparent px-4 py-3 text-left transition-all hover:border-slate-200/40 hover:bg-white/60 dark:hover:border-slate-700/30 dark:hover:bg-slate-800/40"
                          >
                            <div className="flex min-w-0 items-center gap-2.5">
                              <span
                                className={`size-2 shrink-0 rounded-full ${getDotColor(task.activityTypeColor)}`}
                              />
                              <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                                {task.name}
                              </p>
                            </div>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                              {task.activityName}
                            </p>
                            <p className="truncate text-xs font-medium text-slate-600 dark:text-slate-300">
                              {task.picName}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                              {fmt(task.startDate)} – {fmt(task.endDate)}
                            </p>
                            <div className="flex justify-end">
                              <StatusBadge status={task.status} />
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Mobile / Tablet cards */}
                  <div
                    className={`max-h-[400px] space-y-2.5 overflow-y-auto lg:hidden ${HIDE_SCROLL}`}
                  >
                    {recentTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => onTaskClick?.(task.id)}
                        className={`w-full rounded-2xl border-l-[3px] ${getBorderColor(task.activityTypeColor)} border border-l-[3px] border-slate-200/40 bg-white/50 p-3.5 text-left transition-all hover:bg-white/80 dark:border-slate-700/30 dark:bg-slate-800/30 dark:hover:bg-slate-800/60`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                              {task.name}
                            </p>
                            <p className="mt-1 truncate text-xs text-slate-400 dark:text-slate-500">
                              {task.activityName} &middot; {task.picName}
                            </p>
                          </div>
                          <StatusBadge status={task.status} />
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </DashboardCard>
          </>
        ) : (
          <>
            {/* ═══════════════════════════════════════════
                PIC VIEW
            ═══════════════════════════════════════════ */}

            {/* My Tasks + My Progress row */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* ── My Tasks (spans 2) ──────────────── */}
              <DashboardCard
                title="My Tasks"
                count={myTasks.length}
                onViewAll={() => onViewAll?.('my-tasks')}
                className="lg:col-span-2"
                icon={
                  <CardIcon color="indigo">
                    <ListTodo className="size-4" />
                  </CardIcon>
                }
              >
                {myTasks.length === 0 ? (
                  <EmptyState
                    icon={<Inbox className="size-5 text-slate-300 dark:text-slate-600" />}
                    title="No tasks assigned"
                    description="You're all caught up! New tasks will appear here when assigned to you."
                  />
                ) : (
                  <div
                    className={`-mx-1 max-h-[360px] space-y-2.5 overflow-y-auto px-1 ${HIDE_SCROLL}`}
                  >
                    {myTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => onTaskClick?.(task.id)}
                        className={`w-full rounded-2xl border-l-[3px] ${getBorderColor(task.activityTypeColor)} border border-l-[3px] border-slate-200/40 bg-white/50 p-3.5 text-left transition-all hover:bg-white/80 hover:shadow-md hover:shadow-slate-900/[0.03] dark:border-slate-700/30 dark:bg-slate-800/30 dark:hover:bg-slate-800/60`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                              {task.name}
                            </p>
                            <p className="mt-1 truncate text-xs text-slate-400 dark:text-slate-500">
                              {task.activityName}
                            </p>
                          </div>
                          <StatusBadge status={task.status} />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </DashboardCard>

              {/* ── My Progress ──────────────────────── */}
              <DashboardCard
                title="My Progress"
                onViewAll={() => onViewAll?.('my-progress')}
                icon={
                  <CardIcon color="emerald">
                    <TrendingUp className="size-4" />
                  </CardIcon>
                }
              >
                <div className="flex flex-col items-center">
                  {/* Circular progress — spatial layered ring */}
                  <div className="relative mb-6 flex size-36 items-center justify-center">
                    {/* Background glow */}
                    <div className="absolute inset-0 rounded-full bg-indigo-400/[0.06] blur-xl dark:bg-indigo-500/[0.08]" />
                    {/* Ring */}
                    <svg
                      className="absolute inset-0 -rotate-90"
                      viewBox="0 0 144 144"
                    >
                      <circle
                        cx="72"
                        cy="72"
                        r={progressRadius}
                        fill="none"
                        strokeWidth="8"
                        className="stroke-slate-200/50 dark:stroke-slate-700/40"
                      />
                      <circle
                        cx="72"
                        cy="72"
                        r={progressRadius}
                        fill="none"
                        strokeWidth="8"
                        className="stroke-indigo-500 dark:stroke-indigo-400"
                        strokeLinecap="round"
                        strokeDasharray={progressCircumference}
                        strokeDashoffset={
                          progressCircumference -
                          (myProgress.completionPercent / 100) *
                            progressCircumference
                        }
                        style={{
                          transition: 'stroke-dashoffset 0.8s ease',
                          filter: 'drop-shadow(0 0 6px rgba(99,102,241,0.3))',
                        }}
                      />
                    </svg>
                    {/* Center text */}
                    <div className="relative flex flex-col items-center">
                      <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
                        {myProgress.completionPercent}%
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                        complete
                      </span>
                    </div>
                  </div>

                  {/* Status breakdown */}
                  <div className="grid w-full grid-cols-3 gap-2">
                    <div className="rounded-xl border border-emerald-200/30 bg-emerald-50/40 p-2.5 text-center dark:border-emerald-800/20 dark:bg-emerald-950/20">
                      <p className="text-lg font-extrabold text-emerald-500 dark:text-emerald-400">
                        {myProgress.approved}
                      </p>
                      <p className="text-[9px] font-semibold text-emerald-500/60 dark:text-emerald-400/50">
                        Approved
                      </p>
                    </div>
                    <div className="rounded-xl border border-indigo-200/30 bg-indigo-50/40 p-2.5 text-center dark:border-indigo-800/20 dark:bg-indigo-950/20">
                      <p className="text-lg font-extrabold text-indigo-500 dark:text-indigo-400">
                        {myProgress.inProgress}
                      </p>
                      <p className="text-[9px] font-semibold text-indigo-500/60 dark:text-indigo-400/50">
                        Active
                      </p>
                    </div>
                    <div className="rounded-xl border border-amber-200/30 bg-amber-50/40 p-2.5 text-center dark:border-amber-800/20 dark:bg-amber-950/20">
                      <p className="text-lg font-extrabold text-amber-500 dark:text-amber-400">
                        {myProgress.needReview}
                      </p>
                      <p className="text-[9px] font-semibold text-amber-500/60 dark:text-amber-400/50">
                        Review
                      </p>
                    </div>
                    <div className="rounded-xl border border-rose-200/30 bg-rose-50/40 p-2.5 text-center dark:border-rose-800/20 dark:bg-rose-950/20">
                      <p className="text-lg font-extrabold text-rose-500 dark:text-rose-400">
                        {myProgress.revision}
                      </p>
                      <p className="text-[9px] font-semibold text-rose-500/60 dark:text-rose-400/50">
                        Revision
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200/30 bg-slate-50/40 p-2.5 text-center dark:border-slate-700/20 dark:bg-slate-800/20">
                      <p className="text-lg font-extrabold text-slate-500 dark:text-slate-400">
                        {myProgress.toDo}
                      </p>
                      <p className="text-[9px] font-semibold text-slate-400/60 dark:text-slate-500/50">
                        To Do
                      </p>
                    </div>
                    {myProgress.overdue > 0 && (
                      <div className="rounded-xl border border-rose-300/40 bg-rose-50/60 p-2.5 text-center dark:border-rose-700/30 dark:bg-rose-950/30">
                        <p className="text-lg font-extrabold text-rose-500 dark:text-rose-400">
                          {myProgress.overdue}
                        </p>
                        <p className="text-[9px] font-semibold text-rose-500/60 dark:text-rose-400/50">
                          Overdue
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </DashboardCard>
            </div>

            {/* ── Nearest Deadlines — Full Width ───── */}
            <DashboardCard
              title="Nearest Deadlines"
              count={nearestDeadlines.length}
              onViewAll={() => onViewAll?.('nearest-deadlines')}
              icon={
                <CardIcon color="amber">
                  <Clock className="size-4" />
                </CardIcon>
              }
            >
              {nearestDeadlines.length === 0 ? (
                <EmptyState
                  icon={<Clock className="size-5 text-slate-300 dark:text-slate-600" />}
                  title="No upcoming deadlines"
                  description="You have no tasks with approaching deadlines"
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {nearestDeadlines.map((task) => {
                    const isUrgent = task.daysUntil <= 2
                    return (
                      <button
                        key={task.id}
                        onClick={() => onTaskClick?.(task.id)}
                        className={`rounded-2xl border p-4 text-left transition-all hover:shadow-md hover:shadow-slate-900/[0.04] ${
                          isUrgent
                            ? 'border-amber-200/50 bg-amber-50/40 dark:border-amber-800/30 dark:bg-amber-950/20'
                            : 'border-slate-200/40 bg-white/50 dark:border-slate-700/30 dark:bg-slate-800/30'
                        }`}
                      >
                        {/* Days countdown */}
                        <div className="mb-3 flex items-center justify-between">
                          <div
                            className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold ${
                              isUrgent
                                ? 'bg-amber-500/15 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400'
                                : 'bg-slate-500/10 text-slate-500 dark:bg-slate-400/10 dark:text-slate-400'
                            }`}
                          >
                            <Clock className="size-3" />
                            {task.daysUntil}d left
                          </div>
                          <StatusBadge status={task.status} />
                        </div>
                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {task.name}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-400 dark:text-slate-500">
                          {task.activityName}
                        </p>
                      </button>
                    )
                  })}
                </div>
              )}
            </DashboardCard>
          </>
        )}
      </div>
    </div>
  )
}
