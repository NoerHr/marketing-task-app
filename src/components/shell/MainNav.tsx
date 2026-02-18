import {
  LayoutDashboard,
  Calendar,
  KanbanSquare,
  Tags,
  Bell,
  Settings,
  MoreHorizontal,
  Circle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface NavItem {
  label: string
  href: string
  icon?: 'dashboard' | 'calendar' | 'taskboard' | 'activity-type' | 'notifications' | 'settings'
  isActive?: boolean
}

interface MainNavProps {
  items: NavItem[]
  collapsed?: boolean
  onNavigate?: (href: string) => void
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  calendar: Calendar,
  taskboard: KanbanSquare,
  'activity-type': Tags,
  notifications: Bell,
  settings: Settings,
}

export function MainNav({ items, collapsed = false, onNavigate }: MainNavProps) {
  const mainItems = items.filter((i) => i.icon !== 'settings')
  const utilityItems = items.filter((i) => i.icon === 'settings')

  return (
    <nav className="flex flex-col px-3 py-4 lg:px-3.5">
      {/* Main nav items */}
      <div className="flex flex-col gap-1">
        {mainItems.map((item) => {
          const Icon = (item.icon && iconMap[item.icon]) || Circle
          return (
            <button
              key={item.href}
              onClick={() => onNavigate?.(item.href)}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-200',
                item.isActive
                  ? 'bg-white/80 text-indigo-600 shadow-sm shadow-indigo-500/[0.06] ring-1 ring-slate-200/50 backdrop-blur-sm dark:bg-slate-800/70 dark:text-indigo-400 dark:shadow-black/10 dark:ring-slate-700/40'
                  : 'text-slate-500 hover:bg-white/50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/30 dark:hover:text-slate-200',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              {/* Active left accent */}
              {item.isActive && (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-indigo-400 to-indigo-600 shadow-sm shadow-indigo-500/30 dark:from-indigo-400 dark:to-indigo-500" />
              )}

              <span
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center transition-transform duration-200',
                  item.isActive && 'scale-105'
                )}
              >
                <Icon className="size-[18px]" />
              </span>
              {!collapsed && <span className="hidden truncate lg:inline">{item.label}</span>}
            </button>
          )
        })}
      </div>

      {/* Separator before utility items */}
      {utilityItems.length > 0 && (
        <>
          <div className="mx-2 my-3 h-px bg-gradient-to-r from-transparent via-slate-300/40 to-transparent dark:via-slate-600/25" />

          <div className="flex flex-col gap-1">
            {utilityItems.map((item) => {
              const Icon = (item.icon && iconMap[item.icon]) || Circle
              return (
                <button
                  key={item.href}
                  onClick={() => onNavigate?.(item.href)}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-200',
                    item.isActive
                      ? 'bg-white/80 text-indigo-600 shadow-sm shadow-indigo-500/[0.06] ring-1 ring-slate-200/50 backdrop-blur-sm dark:bg-slate-800/70 dark:text-indigo-400 dark:shadow-black/10 dark:ring-slate-700/40'
                      : 'text-slate-500 hover:bg-white/50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/30 dark:hover:text-slate-200',
                    collapsed && 'justify-center px-2'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  {item.isActive && (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-indigo-400 to-indigo-600 shadow-sm shadow-indigo-500/30" />
                  )}
                  <span
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center transition-transform duration-200',
                      item.isActive && 'scale-105'
                    )}
                  >
                    <Icon className="size-[18px]" />
                  </span>
                  {!collapsed && <span className="hidden truncate lg:inline">{item.label}</span>}
                </button>
              )
            })}
          </div>
        </>
      )}
    </nav>
  )
}

/* Bottom tab navigation for mobile */

interface BottomTabsProps {
  items: NavItem[]
  onNavigate?: (href: string) => void
}

export function BottomTabs({ items, onNavigate }: BottomTabsProps) {
  const mainItems = items.filter((i) => i.icon !== 'settings')
  const moreItems = items.filter((i) => i.icon === 'settings')
  const hasMore = moreItems.length > 0
  const isMoreActive = moreItems.some((i) => i.isActive)

  return (
    <nav className="flex items-center justify-around border-t border-slate-200/40 bg-white/70 px-2 py-1.5 backdrop-blur-2xl dark:border-slate-700/25 dark:bg-slate-900/70">
      {mainItems.map((item) => {
        const Icon = (item.icon && iconMap[item.icon]) || Circle
        return (
          <button
            key={item.href}
            onClick={() => onNavigate?.(item.href)}
            className={cn(
              'relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-bold transition-all duration-200',
              item.isActive
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-400 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-400'
            )}
          >
            <Icon className="size-5" />
            <span>{item.label}</span>
            {/* Active dot indicator */}
            {item.isActive && (
              <span className="absolute -top-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />
            )}
          </button>
        )
      })}
      {hasMore && (
        <button
          onClick={() => onNavigate?.(moreItems[0].href)}
          className={cn(
            'relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-bold transition-all duration-200',
            isMoreActive
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-slate-400 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-400'
          )}
        >
          <MoreHorizontal className="size-5" />
          <span>More</span>
          {isMoreActive && (
            <span className="absolute -top-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />
          )}
        </button>
      )}
    </nav>
  )
}
