import type { NavItem } from '@/components/shell'

export const navigationItems: Omit<NavItem, 'isActive'>[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { label: 'Calendar', href: '/calendar', icon: 'calendar' },
  { label: 'Taskboard', href: '/taskboard', icon: 'taskboard' },
  { label: 'Activity Type', href: '/activity-type', icon: 'activity-type' },
  { label: 'Settings', href: '/settings', icon: 'settings' },
]

export const mockUser = {
  name: 'Sarah Chen',
  role: 'Marketing Manager',
}
