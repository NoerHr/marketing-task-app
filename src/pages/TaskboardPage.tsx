import { useState, useEffect, useCallback } from 'react'
import { TaskboardView } from '@/components/taskboard'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { hexToColorName } from '@/lib/utils'
import type {
  BoardGrouping,
  BoardFilter,
  BoardTask,
  TaskDetail,
  ActivityRef,
  ActivityTypeRef,
  UserRef,
  TaskStatus,
  TaskFormData,
  WaChannel,
} from '@/types/taskboard'
import type { ReminderTemplate } from '@/types/calendar'

const defaultFilter: BoardFilter = {
  activityIds: [],
  picIds: [],
  statuses: [],
  activityTypeIds: [],
  showArchived: false,
}

const allStatuses: TaskStatus[] = [
  'To Do', 'In Progress', 'Need Review', 'Revision', 'Approved', 'Archived',
]

// Raw API task shape
interface ApiTask {
  id: string
  name: string
  activityId: string
  activityName: string
  activityTypeColor: string
  activityTypeName: string
  pics: { id: string; name: string; avatarUrl: string | null }[]
  status: string
  priority: string
  startDate: string
  endDate: string
  isOverdue: boolean
  createdBy: { id: string; name: string }
}

// Raw API activity shape
interface ApiActivity {
  id: string
  name: string
  startDate: string
  endDate: string
  activityType: { id: string; name: string; color: string }
  pics: { id: string; name: string }[]
}

// Raw API message template shape
interface ApiMessageTemplate {
  id: string
  name: string
  body: string
}

function mapToReminderTemplate(t: ApiMessageTemplate): ReminderTemplate {
  let type: ReminderTemplate['type'] = 'standard'
  const lower = t.name.toLowerCase()
  if (lower.includes('urgent') || lower.includes('day-of')) type = 'urgent'
  if (lower.includes('budget') || lower.includes('finance')) type = 'finance'
  return { id: t.id, name: t.name, type }
}

function mapToBoardTask(t: ApiTask): BoardTask {
  return {
    id: t.id,
    name: t.name,
    activityId: t.activityId,
    activityName: t.activityName,
    activityTypeColor: hexToColorName(t.activityTypeColor),
    activityTypeName: t.activityTypeName,
    pics: t.pics,
    status: t.status as TaskStatus,
    priority: t.priority as BoardTask['priority'],
    startDate: t.startDate,
    endDate: t.endDate,
    isOverdue: t.isOverdue,
    creatorId: t.createdBy?.id || '',
  }
}

function mapToActivityRef(a: ApiActivity): ActivityRef {
  return {
    id: a.id,
    name: a.name,
    activityTypeColor: hexToColorName(a.activityType?.color || '#6366f1'),
    activityPicId: a.pics?.[0]?.id || '',
    picIds: (a.pics ?? []).map((p: { id: string }) => p.id),
    startDate: a.startDate,
    endDate: a.endDate,
  }
}

export default function TaskboardPage() {
  const { user } = useAuth()
  const [grouping, setGrouping] = useState<BoardGrouping>('status')
  const [filter, setFilter] = useState<BoardFilter>(() => ({
    ...defaultFilter,
    picIds: user && user.role === 'PIC' ? [user.id] : [],
  }))
  const [loading, setLoading] = useState(true)

  const [tasks, setTasks] = useState<BoardTask[]>([])
  const [activities, setActivities] = useState<ActivityRef[]>([])
  const [activityTypes, setActivityTypes] = useState<ActivityTypeRef[]>([])
  const [users, setUsers] = useState<UserRef[]>([])
  const [reminderTemplates, setReminderTemplates] = useState<ReminderTemplate[]>([])
  const [waChannels, setWaChannels] = useState<WaChannel[]>([])
  const [taskDetail, setTaskDetail] = useState<TaskDetail | null>(null)

  const currentUser = user
    ? { id: user.id, name: user.name, role: user.role as 'Leader' | 'PIC', isSuperAdmin: user.isSuperAdmin }
    : { id: '', name: '', role: 'PIC' as const, isSuperAdmin: false }

  // Build query string from filter
  const buildQuery = useCallback((f: BoardFilter) => {
    const params = new URLSearchParams()
    if (f.activityIds.length) params.set('activityId', f.activityIds.join(','))
    if (f.statuses.length) params.set('status', f.statuses.join(','))
    if (f.picIds.length) params.set('picId', f.picIds.join(','))
    if (f.showArchived) params.set('showArchived', 'true')
    return params.toString()
  }, [])

  const fetchTasks = useCallback(async (f: BoardFilter) => {
    try {
      const query = buildQuery(f)
      const data = await api.get<ApiTask[]>(`/api/tasks${query ? `?${query}` : ''}`)
      setTasks((Array.isArray(data) ? data : []).map(mapToBoardTask))
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
    }
  }, [buildQuery])

  const fetchReferenceData = useCallback(async () => {
    try {
      const [activitiesRes, typesRes, usersRes, templatesRes, channelsRes] = await Promise.all([
        api.get<ApiActivity[]>('/api/activities'),
        api.get<ActivityTypeRef[]>('/api/activity-types'),
        api.get<UserRef[]>('/api/users'),
        api.get<ApiMessageTemplate[]>('/api/message-templates'),
        api.get<WaChannel[]>('/api/whatsapp/channels'),
      ])
      setActivities((Array.isArray(activitiesRes) ? activitiesRes : []).map(mapToActivityRef))
      setActivityTypes((Array.isArray(typesRes) ? typesRes : []).map(at => ({ ...at, color: hexToColorName(at.color) })))
      setUsers(Array.isArray(usersRes) ? usersRes : [])
      setReminderTemplates((Array.isArray(templatesRes) ? templatesRes : []).map(mapToReminderTemplate))
      setWaChannels(Array.isArray(channelsRes) ? channelsRes : [])
    } catch (err) {
      console.error('Failed to fetch reference data:', err)
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      await Promise.all([fetchTasks(filter), fetchReferenceData()])
      setLoading(false)
    })()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const refetch = useCallback(() => fetchTasks(filter), [fetchTasks, filter])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading taskboard...</p>
        </div>
      </div>
    )
  }

  return (
    <TaskboardView
      currentUser={currentUser}
      currentGrouping={grouping}
      tasks={tasks}
      activities={activities}
      activityTypes={activityTypes}
      users={users}
      statuses={allStatuses}
      filter={filter}
      reminderTemplates={reminderTemplates}
      waChannels={waChannels}
      taskDetail={taskDetail}
      onGroupingChange={(g) => setGrouping(g)}
      onTaskClick={async (id) => {
        try {
          const detail = await api.get<TaskDetail>(`/api/tasks/${id}`)
          setTaskDetail(detail)
        } catch (err) {
          console.error('Failed to fetch task detail:', err)
        }
      }}
      onTaskDetailClose={() => setTaskDetail(null)}
      onTaskStatusChange={async (id, newStatus) => {
        try {
          await api.patch(`/api/tasks/${id}`, { status: newStatus })
          await refetch()
          if (taskDetail?.id === id) {
            const detail = await api.get<TaskDetail>(`/api/tasks/${id}`)
            setTaskDetail(detail)
          }
        } catch (err) {
          console.error('Failed to update task status:', err)
        }
      }}
      onTaskCreate={async (data: TaskFormData) => {
        try {
          await api.post('/api/tasks', data)
          await refetch()
        } catch (err) {
          console.error('Failed to create task:', err)
        }
      }}
      onTaskUpdate={async (id, data) => {
        try {
          await api.patch(`/api/tasks/${id}`, data)
          await refetch()
          if (taskDetail?.id === id) {
            const detail = await api.get<TaskDetail>(`/api/tasks/${id}`)
            setTaskDetail(detail)
          }
        } catch (err) {
          console.error('Failed to update task:', err)
        }
      }}
      onTaskDelete={async (id) => {
        try {
          await api.del(`/api/tasks/${id}`)
          await refetch()
          setTaskDetail(null)
        } catch (err) {
          console.error('Failed to delete task:', err)
        }
      }}
      onPicAdd={async (taskId, userId) => {
        try {
          await api.post(`/api/tasks/${taskId}/pics`, { userId })
          await refetch()
          if (taskDetail?.id === taskId) {
            const detail = await api.get<TaskDetail>(`/api/tasks/${taskId}`)
            setTaskDetail(detail)
          }
        } catch (err) {
          console.error('Failed to add PIC:', err)
        }
      }}
      onPicRemove={async (taskId, userId) => {
        try {
          await api.del(`/api/tasks/${taskId}/pics/${userId}`)
          await refetch()
          if (taskDetail?.id === taskId) {
            const detail = await api.get<TaskDetail>(`/api/tasks/${taskId}`)
            setTaskDetail(detail)
          }
        } catch (err) {
          console.error('Failed to remove PIC:', err)
        }
      }}
      onTaskApprove={async (id, feedback) => {
        try {
          await api.post(`/api/tasks/${id}/approve`, { action: 'approved', feedback })
          await refetch()
          if (taskDetail?.id === id) {
            const detail = await api.get<TaskDetail>(`/api/tasks/${id}`)
            setTaskDetail(detail)
          }
        } catch (err) {
          console.error('Failed to approve task:', err)
        }
      }}
      onTaskRevision={async (id, feedback) => {
        try {
          await api.post(`/api/tasks/${id}/approve`, { action: 'revision', feedback })
          await refetch()
          if (taskDetail?.id === id) {
            const detail = await api.get<TaskDetail>(`/api/tasks/${id}`)
            setTaskDetail(detail)
          }
        } catch (err) {
          console.error('Failed to request revision:', err)
        }
      }}
      onTaskArchive={async (id) => {
        try {
          await api.post(`/api/tasks/${id}/archive`)
          await refetch()
          setTaskDetail(null)
        } catch (err) {
          console.error('Failed to archive task:', err)
        }
      }}
      onTaskReopen={async (id) => {
        try {
          await api.post(`/api/tasks/${id}/reopen`)
          await refetch()
          if (taskDetail?.id === id) {
            const detail = await api.get<TaskDetail>(`/api/tasks/${id}`)
            setTaskDetail(detail)
          }
        } catch (err) {
          console.error('Failed to reopen task:', err)
        }
      }}
      onFilterChange={(f) => {
        setFilter(f)
        fetchTasks(f)
      }}
    />
  )
}
