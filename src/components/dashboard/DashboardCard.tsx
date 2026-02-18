import { ChevronRight } from 'lucide-react'

interface DashboardCardProps {
  title: string
  count?: number
  onViewAll?: () => void
  children: React.ReactNode
  className?: string
  headerAction?: React.ReactNode
  icon?: React.ReactNode
}

export function DashboardCard({
  title,
  count,
  onViewAll,
  children,
  className = '',
  headerAction,
  icon,
}: DashboardCardProps) {
  return (
    <div
      className={`rounded-3xl border border-white/60 bg-white/70 p-6 shadow-lg shadow-slate-900/[0.04] backdrop-blur-xl dark:border-slate-700/40 dark:bg-slate-800/60 dark:shadow-black/20 ${className}`}
    >
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {icon}
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {title}
          </h3>
          {count !== undefined && (
            <span className="flex size-5 items-center justify-center rounded-full bg-indigo-500/10 text-[10px] font-bold text-indigo-500 dark:bg-indigo-400/10 dark:text-indigo-400">
              {count}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {headerAction}
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="flex items-center gap-0.5 text-xs font-semibold text-indigo-500 transition hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              View All
              <ChevronRight className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {children}
    </div>
  )
}
