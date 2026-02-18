import type {
  CurrentUser,
  ActivityType,
  ColorOption,
} from '@/types/activityType'

export const currentUser: CurrentUser = {
  id: 'usr-001',
  name: 'Alex Morgan',
  role: 'Leader',
  isSuperAdmin: true,
}

export const activityTypes: ActivityType[] = [
  {
    id: 'at-001',
    name: 'IG Campaign',
    color: '#f43f5e',
    icon: 'megaphone',
    usedByCount: 3,
    createdAt: '2025-11-15T08:00:00Z',
  },
  {
    id: 'at-002',
    name: 'Influencer',
    color: '#8b5cf6',
    icon: 'users',
    usedByCount: 2,
    createdAt: '2025-11-15T08:05:00Z',
  },
  {
    id: 'at-003',
    name: 'Event',
    color: '#f59e0b',
    icon: 'calendar-check',
    usedByCount: 4,
    createdAt: '2025-11-20T10:00:00Z',
  },
  {
    id: 'at-004',
    name: 'Photoshoot',
    color: '#14b8a6',
    icon: 'camera',
    usedByCount: 2,
    createdAt: '2025-12-01T09:00:00Z',
  },
  {
    id: 'at-005',
    name: 'Sponsorship',
    color: '#0ea5e9',
    icon: 'handshake',
    usedByCount: 1,
    createdAt: '2025-12-10T14:00:00Z',
  },
  {
    id: 'at-006',
    name: 'Content Writing',
    color: '#10b981',
    icon: 'pen-line',
    usedByCount: 0,
    createdAt: '2026-01-05T11:30:00Z',
  },
  {
    id: 'at-007',
    name: 'Brand Activation',
    color: '#6366f1',
    icon: null,
    usedByCount: 0,
    createdAt: '2026-02-01T08:00:00Z',
  },
]

export const colorOptions: ColorOption[] = [
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Red', value: '#ef4444' },
]

export const iconOptions: string[] = [
  'megaphone',
  'users',
  'calendar-check',
  'camera',
  'handshake',
  'pen-line',
  'sparkles',
  'rocket',
  'target',
  'gift',
  'mic',
  'video',
  'globe',
  'heart',
  'zap',
]
