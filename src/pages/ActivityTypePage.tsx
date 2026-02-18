import { useState, useEffect, useCallback } from 'react'
import { ActivityTypeView } from '@/components/activity-type'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import type { ActivityType, ActivityTypeFormData, ColorOption } from '@/types/activityType'

const colorOptions: ColorOption[] = [
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

const iconOptions: string[] = [
  'megaphone', 'users', 'calendar-check', 'camera', 'handshake',
  'pen-line', 'sparkles', 'rocket', 'target', 'gift',
  'mic', 'video', 'globe', 'heart', 'zap',
]

export default function ActivityTypePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([])

  const currentUser = user
    ? { id: user.id, name: user.name, role: user.role as 'Leader' | 'PIC', isSuperAdmin: user.isSuperAdmin }
    : { id: '', name: '', role: 'PIC' as const, isSuperAdmin: false }

  const fetchActivityTypes = useCallback(async () => {
    try {
      const data = await api.get<ActivityType[]>('/api/activity-types')
      setActivityTypes(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch activity types:', err)
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      await fetchActivityTypes()
      setLoading(false)
    })()
  }, [fetchActivityTypes])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading activity types...</p>
        </div>
      </div>
    )
  }

  return (
    <ActivityTypeView
      currentUser={currentUser}
      activityTypes={activityTypes}
      colorOptions={colorOptions}
      iconOptions={iconOptions}
      onCreate={async (data: ActivityTypeFormData) => {
        try {
          await api.post('/api/activity-types', data)
          await fetchActivityTypes()
        } catch (err) {
          console.error('Failed to create activity type:', err)
        }
      }}
      onUpdate={async (id: string, data: ActivityTypeFormData) => {
        try {
          await api.put(`/api/activity-types/${id}`, data)
          await fetchActivityTypes()
        } catch (err) {
          console.error('Failed to update activity type:', err)
        }
      }}
      onDelete={async (id: string) => {
        try {
          await api.del(`/api/activity-types/${id}`)
          await fetchActivityTypes()
        } catch (err) {
          console.error('Failed to delete activity type:', err)
        }
      }}
      onSelect={() => {}}
    />
  )
}
