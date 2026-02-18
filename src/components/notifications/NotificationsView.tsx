import {
  UserPlus, CheckCircle2, RotateCcw, Users, AlertTriangle, Bell,
} from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import type { Notification, NotificationType, NotificationsPageProps } from '@/types/notification'

const ICON_MAP: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  taskAssignment: UserPlus,
  approval: CheckCircle2,
  revision: RotateCcw,
  reassignment: Users,
  deadlineAlert: AlertTriangle,
  reminder: Bell,
}

const ICON_COLOR: Record<NotificationType, string> = {
  taskAssignment: 'text-indigo-500',
  approval: 'text-emerald-500',
  revision: 'text-rose-500',
  reassignment: 'text-violet-500',
  deadlineAlert: 'text-amber-500',
  reminder: 'text-sky-500',
}

const TYPE_LABELS: { value: NotificationType | undefined; label: string }[] = [
  { value: undefined, label: 'All' },
  { value: 'taskAssignment', label: 'Assignment' },
  { value: 'approval', label: 'Approval' },
  { value: 'revision', label: 'Revision' },
  { value: 'reassignment', label: 'Reassignment' },
  { value: 'deadlineAlert', label: 'Deadline' },
  { value: 'reminder', label: 'Reminder' },
]

const READ_FILTERS: { value: 'all' | 'read' | 'unread'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
]

const GLASS = 'rounded-2xl border border-white/60 bg-white/70 shadow-sm shadow-slate-900/[0.03] backdrop-blur-xl dark:border-slate-700/40 dark:bg-slate-800/60 dark:shadow-black/10'

function NotificationItem({ notification, onMarkRead, onNotificationClick }: {
  notification: Notification
  onMarkRead: (id: string) => void
  onNotificationClick: (n: Notification) => void
}) {
  const Icon = ICON_MAP[notification.type]
  const color = ICON_COLOR[notification.type]

  return (
    <div
      className={`flex items-start gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40 ${!notification.isRead ? 'bg-indigo-50/30 dark:bg-indigo-500/5' : ''}`}
    >
      <div className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${!notification.isRead ? 'bg-white shadow-sm dark:bg-slate-800/60' : 'bg-slate-100/60 dark:bg-slate-800/30'}`}>
        <Icon className={`size-4 ${color}`} />
      </div>
      <button
        onClick={() => onNotificationClick(notification)}
        className="min-w-0 flex-1 text-left"
      >
        <div className="flex items-center gap-2">
          <p className={`text-sm ${!notification.isRead ? 'font-bold text-slate-800 dark:text-slate-100' : 'font-semibold text-slate-600 dark:text-slate-300'}`}>{notification.title}</p>
          {!notification.isRead && <span className="size-1.5 shrink-0 rounded-full bg-indigo-500" />}
        </div>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{notification.message}</p>
        <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">{timeAgo(notification.createdAt)}</p>
      </button>
      {!notification.isRead && (
        <button
          onClick={() => onMarkRead(notification.id)}
          className="mt-1 shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold text-indigo-500 transition-colors hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
        >
          Mark read
        </button>
      )}
    </div>
  )
}

export function NotificationsView({
  notifications, filter, onFilterChange, onMarkRead, onMarkAllRead, onNotificationClick,
}: NotificationsPageProps) {
  const unreadCount = notifications.filter(n => !n.isRead).length

  const filtered = notifications.filter(n => {
    if (filter.type && n.type !== filter.type) return false
    if (filter.readStatus === 'read' && !n.isRead) return false
    if (filter.readStatus === 'unread' && n.isRead) return false
    return true
  })

  return (
    <div className="flex h-full flex-col font-['Plus_Jakarta_Sans'] p-4 lg:p-6">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">Notifications</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={onMarkAllRead} className="flex items-center gap-1 rounded-xl bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-600 transition-all hover:bg-indigo-500/20 dark:bg-indigo-500/15 dark:text-indigo-400">
            Mark all as read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className={`${GLASS} mb-4 flex flex-wrap gap-3 p-3`}>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] font-semibold text-slate-400">Type</span>
          {TYPE_LABELS.map(t => {
            const active = filter.type === t.value
            return (
              <button
                key={t.label}
                onClick={() => onFilterChange({ ...filter, type: t.value })}
                className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition-all ${active ? 'bg-indigo-500/10 text-indigo-600 ring-1 ring-indigo-500/20 dark:bg-indigo-500/15 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-100/60 dark:text-slate-400 dark:hover:bg-slate-700/30'}`}
              >
                {t.label}
              </button>
            )
          })}
        </div>
        <div className="h-6 w-px bg-slate-200/50 dark:bg-slate-700/30" />
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] font-semibold text-slate-400">Status</span>
          {READ_FILTERS.map(r => {
            const active = (filter.readStatus ?? 'all') === r.value
            return (
              <button
                key={r.value}
                onClick={() => onFilterChange({ ...filter, readStatus: r.value })}
                className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition-all ${active ? 'bg-indigo-500/10 text-indigo-600 ring-1 ring-indigo-500/20 dark:bg-indigo-500/15 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-100/60 dark:text-slate-400 dark:hover:bg-slate-700/30'}`}
              >
                {r.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* List */}
      <div className={`${GLASS} flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden p-2`}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <Bell className="size-10 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">No notifications</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200/30 dark:divide-slate-700/20">
            {filtered.map(n => (
              <NotificationItem key={n.id} notification={n} onMarkRead={onMarkRead} onNotificationClick={onNotificationClick} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
