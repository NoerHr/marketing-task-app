import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/shell'
import type { NavItem } from '@/components/shell'
import { navigationItems } from '@/data/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/hooks/useTheme'
import { api } from '@/lib/api'
import type { Notification } from '@/types/notification'
import DashboardPage from '@/pages/DashboardPage'
import CalendarPage from '@/pages/CalendarPage'
import TaskboardPage from '@/pages/TaskboardPage'
import ActivityTypePage from '@/pages/ActivityTypePage'
import NotificationsPage from '@/pages/NotificationsPage'
import SettingsPage from '@/pages/SettingsPage'
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'

/** Redirect to /login if not authenticated */
function RequireAuth() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

/** Redirect to /dashboard if already authenticated */
function RedirectIfAuth() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

function AppShellLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [notifications, setNotifications] = useState<Notification[]>([])

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.get<Notification[]>('/api/notifications')
      setNotifications(Array.isArray(data) ? data : [])
    } catch {
      // silently fail — notifications are non-critical
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30_000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const unreadCount = notifications.filter(n => !n.isRead).length

  const navItems: NavItem[] = navigationItems.map((item) => ({
    ...item,
    isActive: location.pathname === item.href,
  }))

  return (
    <div className="h-full overflow-hidden">
      <AppShell
        navigationItems={navItems}
        user={user ? { name: user.name, role: user.role } : { name: 'User' }}
        unreadCount={unreadCount}
        onNavigate={(href) => navigate(href)}
        onLogout={() => logout().then(() => navigate('/login'))}
        onNotificationsClick={() => navigate('/notifications')}
      >
        <Outlet />
      </AppShell>
    </div>
  )
}

export default function App() {
  // Apply theme at root level so it persists across all pages
  useTheme()

  return (
    <Routes>
      {/* Auth routes — redirect to dashboard if already logged in */}
      <Route element={<RedirectIfAuth />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      {/* App routes — require auth */}
      <Route element={<RequireAuth />}>
        <Route element={<AppShellLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/taskboard" element={<TaskboardPage />} />
          <Route path="/activity-type" element={<ActivityTypePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
