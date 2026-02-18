import type { TaskStatus } from '@/types/dashboard'

const statusConfig: Record<
  TaskStatus,
  { bg: string; text: string; dot: string }
> = {
  'To Do': {
    bg: 'bg-slate-500/10 dark:bg-slate-400/10',
    text: 'text-slate-600 dark:text-slate-300',
    dot: 'bg-slate-400',
  },
  'In Progress': {
    bg: 'bg-indigo-500/10 dark:bg-indigo-400/10',
    text: 'text-indigo-600 dark:text-indigo-400',
    dot: 'bg-indigo-500 dark:bg-indigo-400',
  },
  'Need Review': {
    bg: 'bg-amber-500/10 dark:bg-amber-400/10',
    text: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500 dark:bg-amber-400',
  },
  Revision: {
    bg: 'bg-rose-500/10 dark:bg-rose-400/10',
    text: 'text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-500 dark:bg-rose-400',
  },
  Approved: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-400/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500 dark:bg-emerald-400',
  },
  Archived: {
    bg: 'bg-slate-500/8 dark:bg-slate-400/8',
    text: 'text-slate-500 dark:text-slate-400',
    dot: 'bg-slate-400 dark:bg-slate-500',
  },
}

interface StatusBadgeProps {
  status: TaskStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold ${config.bg} ${config.text}`}
    >
      <span className={`size-1.5 rounded-full ${config.dot}`} />
      {status}
    </span>
  )
}
