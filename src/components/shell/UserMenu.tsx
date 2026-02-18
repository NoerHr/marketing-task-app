import { ChevronDown, LogOut, User } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface UserMenuProps {
  user: {
    name: string
    role?: string
    avatarUrl?: string
  }
  onLogout?: () => void
  /** "topbar" renders compact avatar-only; "sidebar" renders full-width with name */
  variant?: 'topbar' | 'sidebar'
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function UserMenu({ user, onLogout, variant = 'topbar' }: UserMenuProps) {
  const avatar = (
    <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-bold text-white shadow-md shadow-indigo-500/20 ring-1 ring-white/20 transition-shadow duration-200 group-hover:shadow-lg group-hover:shadow-indigo-500/25">
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.name}
          className="size-9 rounded-xl object-cover"
        />
      ) : (
        getInitials(user.name)
      )}
    </div>
  )

  const dropdownContent = (
    <DropdownMenuContent
      align={variant === 'sidebar' ? 'start' : 'end'}
      side={variant === 'sidebar' ? 'top' : 'bottom'}
      className="w-52 rounded-2xl border border-slate-200/50 bg-white/90 p-1.5 shadow-xl shadow-slate-900/[0.08] backdrop-blur-2xl dark:border-slate-700/40 dark:bg-slate-800/90 dark:shadow-black/30"
    >
      <DropdownMenuLabel className="rounded-xl px-3 py-2 font-normal">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {user.name}
          </p>
          {user.role && (
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
              {user.role}
            </p>
          )}
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator className="mx-2 bg-gradient-to-r from-transparent via-slate-200/60 to-transparent dark:via-slate-700/40" />
      <DropdownMenuItem className="cursor-pointer gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors focus:bg-slate-100/70 dark:text-slate-300 dark:focus:bg-slate-700/40">
        <User className="size-4" />
        Profile
      </DropdownMenuItem>
      <DropdownMenuSeparator className="mx-2 bg-gradient-to-r from-transparent via-slate-200/60 to-transparent dark:via-slate-700/40" />
      <DropdownMenuItem
        onClick={onLogout}
        className="cursor-pointer gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-rose-500 transition-colors focus:bg-rose-50/70 dark:text-rose-400 dark:focus:bg-rose-950/30"
      >
        <LogOut className="size-4" />
        Logout
      </DropdownMenuItem>
    </DropdownMenuContent>
  )

  /* Sidebar variant — full-width trigger with name + role */
  if (variant === 'sidebar') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-all duration-200 hover:bg-white/50 dark:hover:bg-slate-800/30">
            {avatar}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                {user.name}
              </p>
              {user.role && (
                <p className="truncate text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  {user.role}
                </p>
              )}
            </div>
            <ChevronDown className="size-4 shrink-0 text-slate-400 transition-transform duration-200 group-data-[state=open]:rotate-180 dark:text-slate-500" />
          </button>
        </DropdownMenuTrigger>
        {dropdownContent}
      </DropdownMenu>
    )
  }

  /* Top bar variant — compact avatar trigger */
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="group flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-all duration-200 hover:bg-white/50 dark:hover:bg-slate-800/30">
          {avatar}
          <div className="hidden text-left md:block">
            <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
              {user.name}
            </p>
            {user.role && (
              <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                {user.role}
              </p>
            )}
          </div>
        </button>
      </DropdownMenuTrigger>
      {dropdownContent}
    </DropdownMenu>
  )
}
