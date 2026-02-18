import { useState } from 'react'
import { Bell, Menu, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MainNav, BottomTabs } from './MainNav'
import { UserMenu } from './UserMenu'
import type { NavItem } from './MainNav'

interface AppShellProps {
  children: React.ReactNode
  navigationItems: NavItem[]
  user?: { name: string; role?: string; avatarUrl?: string }
  unreadCount?: number
  onNavigate?: (href: string) => void
  onLogout?: () => void
  onNotificationsClick?: () => void
}

export default function AppShell({
  children,
  navigationItems,
  user = { name: 'User' },
  unreadCount = 0,
  onNavigate,
  onLogout,
  onNotificationsClick,
}: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-slate-50 via-slate-100/80 to-indigo-50/40 font-['Plus_Jakarta_Sans'] dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20">
      {/* Sidebar — desktop: full, tablet: collapsed, mobile: hidden */}
      <aside
        className={cn(
          'relative hidden shrink-0 flex-col',
          'border-r border-slate-200/40 bg-white/50 backdrop-blur-2xl',
          'dark:border-slate-700/25 dark:bg-slate-900/40',
          'md:flex md:w-16 lg:w-[248px]'
        )}
      >
        {/* Subtle inner gradient overlay for depth */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-white/10 dark:from-slate-800/20 dark:via-transparent dark:to-slate-800/10" />

        {/* Logo header */}
        <div className="relative z-10 flex h-16 items-center px-4 lg:px-5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-extrabold text-white shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
              M
            </div>
            <span className="hidden text-[15px] font-bold tracking-tight text-slate-800 lg:block dark:text-slate-100">
              Marketing Board
            </span>
          </div>
        </div>

        {/* Gradient separator */}
        <div className="relative z-10 mx-4 h-px lg:mx-5">
          <div className="h-full bg-gradient-to-r from-transparent via-slate-300/50 to-transparent dark:via-slate-600/30" />
        </div>

        {/* Navigation */}
        <div className="relative z-10 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <MainNav items={navigationItems} collapsed={false} onNavigate={onNavigate} />
        </div>

        {/* Gradient separator */}
        <div className="relative z-10 mx-4 h-px lg:mx-5">
          <div className="h-full bg-gradient-to-r from-transparent via-slate-300/50 to-transparent dark:via-slate-600/30" />
        </div>

        {/* User section at sidebar bottom — visible on expanded (lg) */}
        <div className="relative z-10 hidden p-3 lg:block">
          <UserMenu user={user} onLogout={onLogout} variant="sidebar" />
        </div>

        {/* Decorative ambient glow */}
        <div className="pointer-events-none absolute -bottom-8 left-1/2 size-32 -translate-x-1/2 rounded-full bg-indigo-400/[0.06] blur-3xl dark:bg-indigo-500/[0.05]" />
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="relative z-10 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/40 bg-white/50 px-4 backdrop-blur-2xl lg:px-6 dark:border-slate-700/25 dark:bg-slate-900/40">
          {/* Left: Mobile hamburger + logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-xl border border-slate-200/40 bg-white/60 p-2 text-slate-500 transition-all duration-200 hover:bg-white/90 hover:text-slate-700 md:hidden dark:border-slate-700/30 dark:bg-slate-800/40 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
            <div className="flex items-center gap-2.5 md:hidden">
              <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-extrabold text-white shadow-md shadow-indigo-500/20">
                M
              </div>
              <span className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100">
                Marketing Board
              </span>
            </div>

            {/* Quick search hint — desktop only */}
            <button className="ml-2 hidden items-center gap-2 rounded-xl border border-slate-200/30 bg-white/40 px-3 py-2 text-sm text-slate-400 transition-all duration-200 hover:border-slate-300/50 hover:bg-white/70 hover:text-slate-500 lg:flex dark:border-slate-700/20 dark:bg-slate-800/30 dark:text-slate-500 dark:hover:border-slate-600/30 dark:hover:bg-slate-800/50 dark:hover:text-slate-400">
              <Search className="size-4" />
              <span>Search...</span>
              <kbd className="ml-4 rounded-md border border-slate-200/50 bg-slate-100/60 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:border-slate-600/40 dark:bg-slate-700/40 dark:text-slate-500">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right: Notifications + User menu */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <button
                onClick={onNotificationsClick}
                className="relative rounded-xl border border-slate-200/40 bg-white/60 p-2.5 text-slate-500 transition-all duration-200 hover:bg-white/90 hover:text-slate-700 dark:border-slate-700/30 dark:bg-slate-800/40 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
              >
                <Bell className="size-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute right-2 top-2 flex size-2 items-center justify-center">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-indigo-400 opacity-50" />
                    <span className="relative inline-flex size-2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />
                  </span>
                )}
              </button>
            </div>
            {/* User menu in top bar — visible on mobile/tablet, hidden on expanded sidebar */}
            <div className="lg:hidden">
              <UserMenu user={user} onLogout={onLogout} variant="topbar" />
            </div>
          </div>
        </header>

        {/* Mobile drawer overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm transition-all duration-300 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <aside
              className="relative h-full w-[272px] border-r border-slate-200/40 bg-white/90 backdrop-blur-2xl dark:border-slate-700/30 dark:bg-slate-900/95"
              style={{
                boxShadow: '8px 0 40px rgba(0,0,0,0.08), 2px 0 8px rgba(0,0,0,0.04)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer inner gradient */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white/20 dark:from-slate-800/20 dark:via-transparent dark:to-slate-800/10" />

              <div className="relative z-10 flex h-16 items-center justify-between px-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-extrabold text-white shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
                    M
                  </div>
                  <span className="text-[15px] font-bold tracking-tight text-slate-800 dark:text-slate-100">
                    Marketing Board
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg p-1 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Gradient separator */}
              <div className="relative z-10 mx-5 h-px">
                <div className="h-full bg-gradient-to-r from-transparent via-slate-300/50 to-transparent dark:via-slate-600/30" />
              </div>

              <div className="relative z-10">
                <MainNav
                  items={navigationItems}
                  onNavigate={(href) => {
                    onNavigate?.(href)
                    setMobileMenuOpen(false)
                  }}
                />
              </div>

              {/* Decorative ambient glow */}
              <div className="pointer-events-none absolute -bottom-8 left-1/2 size-32 -translate-x-1/2 rounded-full bg-indigo-400/[0.06] blur-3xl dark:bg-indigo-500/[0.05]" />
            </aside>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{children}</main>

        {/* Bottom tabs — mobile only */}
        <div className="md:hidden">
          <BottomTabs items={navigationItems} onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  )
}
