import { useEffect, useRef } from 'react'
import {
  UserPlus, CheckCircle2, RotateCcw, Users, AlertTriangle, Bell, X,
} from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import type { Notification, NotificationType } from '@/types/notification'

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

interface NotificationDropdownProps {
  notifications: Notification[]
  onClose: () => void
  onMarkAllRead: () => void
  onNotificationClick: (notification: Notification) => void
  onViewAll: () => void
}

export function NotificationDropdown({
  notifications, onClose, onMarkAllRead, onNotificationClick, onViewAll,
}: NotificationDropdownProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const latest = notifications.slice(0, 10)
  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-50 mt-2 w-[360px] rounded-2xl border border-white/60 bg-white/95 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl dark:border-slate-700/40 dark:bg-slate-900/95 dark:shadow-black/20"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/40 px-4 py-3 dark:border-slate-700/30">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Notifications</h3>
          {unreadCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white">{unreadCount}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button onClick={onMarkAllRead} className="rounded-lg px-2 py-1 text-[10px] font-semibold text-indigo-500 transition-colors hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10">
              Mark all read
            </button>
          )}
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300">
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-[380px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {latest.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10">
            <Bell className="size-8 text-slate-300 dark:text-slate-600" />
            <p className="text-xs text-slate-400 dark:text-slate-500">No notifications</p>
          </div>
        ) : (
          latest.map(n => {
            const Icon = ICON_MAP[n.type]
            const color = ICON_COLOR[n.type]
            return (
              <button
                key={n.id}
                onClick={() => onNotificationClick(n)}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40 ${!n.isRead ? 'bg-indigo-50/30 dark:bg-indigo-500/5' : ''}`}
              >
                <div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl ${!n.isRead ? 'bg-white shadow-sm dark:bg-slate-800/60' : 'bg-slate-100/60 dark:bg-slate-800/30'}`}>
                  <Icon className={`size-4 ${color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`truncate text-xs ${!n.isRead ? 'font-bold text-slate-800 dark:text-slate-100' : 'font-semibold text-slate-600 dark:text-slate-300'}`}>{n.title}</p>
                    {!n.isRead && <span className="size-1.5 shrink-0 rounded-full bg-indigo-500" />}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500 dark:text-slate-400">{n.message}</p>
                  <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">{timeAgo(n.createdAt)}</p>
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Footer */}
      {latest.length > 0 && (
        <div className="border-t border-slate-200/40 px-4 py-2.5 dark:border-slate-700/30">
          <button onClick={onViewAll} className="w-full rounded-xl py-1.5 text-center text-xs font-semibold text-indigo-500 transition-colors hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10">
            View all notifications
          </button>
        </div>
      )}
    </div>
  )
}
