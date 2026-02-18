import { useState, useEffect, useCallback } from 'react'
import { CalendarView } from '@/components/calendar'
import { api } from '@/lib/api'
import { hexToColorName } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import type {
  CalendarView as ViewMode,
  CalendarFilter,
  CalendarTask,
  CalendarActivity,
  PlanSummary,
  DayWorkload,
  ConflictWarning,
  TaskDetail,
  ActivityTypeOption,
  UserOption,
  TaskStatus,
  CreateActivityForm,
  ReminderTemplate,
  ActivityEditData,
} from '@/types/calendar'
import type { WaChannel } from '@/types/taskboard'

const defaultFilter: CalendarFilter = {
  activityTypeIds: [],
  picIds: [],
  statuses: [],
  myTasksOnly: false,
}

const allStatuses: TaskStatus[] = [
  'To Do', 'In Progress', 'Need Review', 'Revision', 'Approved', 'Archived',
]

function getMonthString(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getMonthRange(dateStr: string): { startDate: string; endDate: string } {
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = d.getMonth()
  const start = new Date(y, m, 1)
  const end = new Date(y, m + 1, 0)
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
}

function buildCalendarQuery(startDate: string, endDate: string, f: CalendarFilter): string {
  const params = new URLSearchParams()
  params.set('startDate', startDate)
  params.set('endDate', endDate)
  if (f.activityTypeIds.length) params.set('activityTypeId', f.activityTypeIds.join(','))
  if (f.picIds.length) params.set('picId', f.picIds.join(','))
  if (f.statuses.length) params.set('status', f.statuses.join(','))
  if (f.myTasksOnly) params.set('myTasksOnly', 'true')
  return params.toString()
}

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
  startDate: string
  endDate: string
  startTime: string | null
  endTime: string | null
  isOverdue: boolean
}

// Raw API activity shape
interface ApiActivity {
  id: string
  name: string
  startDate: string
  endDate: string
  activityType: { id: string; name: string; color: string }
}

// Raw API message template shape
interface ApiMessageTemplate {
  id: string
  name: string
  body: string
}

function mapToCalendarTask(t: ApiTask): CalendarTask {
  const pic = t.pics?.[0]
  return {
    id: t.id,
    name: t.name,
    activityId: t.activityId,
    activityName: t.activityName,
    activityTypeColor: hexToColorName(t.activityTypeColor),
    activityTypeName: t.activityTypeName,
    picId: pic?.id || '',
    picName: pic?.name || '-',
    picAvatarUrl: pic?.avatarUrl || null,
    status: t.status as TaskStatus,
    startDate: t.startDate,
    endDate: t.endDate,
    startTime: t.startTime,
    endTime: t.endTime,
    isOverdue: t.isOverdue,
  }
}

function mapToReminderTemplate(t: ApiMessageTemplate): ReminderTemplate {
  let type: ReminderTemplate['type'] = 'standard'
  const lower = t.name.toLowerCase()
  if (lower.includes('urgent') || lower.includes('day-of')) type = 'urgent'
  if (lower.includes('budget') || lower.includes('finance')) type = 'finance'
  return { id: t.id, name: t.name, type }
}

export default function CalendarPage() {
  const { user } = useAuth()
  const isLeader = user?.role === 'Leader'

  const today = new Date().toISOString().slice(0, 10)
  const [currentView, setCurrentView] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(today)
  const [filter, setFilter] = useState<CalendarFilter>(defaultFilter)
  const [loading, setLoading] = useState(true)

  const [tasks, setTasks] = useState<CalendarTask[]>([])
  const [calendarActivities, setCalendarActivities] = useState<CalendarActivity[]>([])
  const [planSummary, setPlanSummary] = useState<PlanSummary>({ activeTasks: 0, overdueTasks: 0, next7DaysTasks: 0 })
  const [dayWorkloads, setDayWorkloads] = useState<DayWorkload[]>([])
  const [conflictWarnings, setConflictWarnings] = useState<ConflictWarning[]>([])
  const [activityTypes, setActivityTypes] = useState<ActivityTypeOption[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [reminderTemplates, setReminderTemplates] = useState<ReminderTemplate[]>([])
  const [waChannels, setWaChannels] = useState<WaChannel[]>([])
  const [taskDetail, setTaskDetail] = useState<TaskDetail | null>(null)
  const [editActivityData, setEditActivityData] = useState<ActivityEditData | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)

  const fetchCalendarData = useCallback(async (date: string, f: CalendarFilter) => {
    const month = getMonthString(date)
    const { startDate, endDate } = getMonthRange(date)
    const query = buildCalendarQuery(startDate, endDate, f)
    try {
      const [tasksRes, summaryRes, workloadRes, conflictsRes, typesRes, usersRes, templatesRes, activitiesRes, channelsRes] = await Promise.all([
        api.get<ApiTask[]>(`/api/tasks?${query}`),
        api.get<PlanSummary>(`/api/calendar/summary?month=${month}`),
        api.get<DayWorkload[]>(`/api/calendar/workloads?month=${month}`),
        api.get<ConflictWarning[]>('/api/calendar/conflicts'),
        api.get<ActivityTypeOption[]>('/api/activity-types'),
        api.get<UserOption[]>('/api/users'),
        api.get<ApiMessageTemplate[]>('/api/message-templates'),
        api.get<ApiActivity[]>('/api/activities'),
        api.get<WaChannel[]>('/api/whatsapp/channels'),
      ])

      const taskList = Array.isArray(tasksRes) ? tasksRes : []
      setTasks(taskList.map(mapToCalendarTask))
      setCalendarActivities((Array.isArray(activitiesRes) ? activitiesRes : []).map(a => ({
        id: a.id,
        name: a.name,
        activityTypeColor: hexToColorName(a.activityType?.color || '#6366f1'),
        activityTypeName: a.activityType?.name || '',
        startDate: a.startDate,
        endDate: a.endDate,
      })))
      setPlanSummary(summaryRes)
      setDayWorkloads(Array.isArray(workloadRes) ? workloadRes : [])
      setConflictWarnings(Array.isArray(conflictsRes) ? conflictsRes : [])
      setActivityTypes((Array.isArray(typesRes) ? typesRes : []).map(at => ({ ...at, color: hexToColorName(at.color) })))
      setUsers(Array.isArray(usersRes) ? usersRes : [])
      setReminderTemplates((Array.isArray(templatesRes) ? templatesRes : []).map(mapToReminderTemplate))
      setWaChannels(Array.isArray(channelsRes) ? channelsRes : [])
    } catch (err) {
      console.error('Failed to load calendar data:', err)
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      await fetchCalendarData(currentDate, filter)
      setLoading(false)
    })()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading calendar...</p>
        </div>
      </div>
    )
  }

  return (
    <CalendarView
      currentView={currentView}
      currentDate={currentDate}
      tasks={tasks}
      activities={calendarActivities}
      planSummary={planSummary}
      dayWorkloads={dayWorkloads}
      conflictWarnings={conflictWarnings}
      activityTypes={activityTypes}
      users={users}
      statuses={allStatuses}
      filter={filter}
      reminderTemplates={reminderTemplates}
      waChannels={waChannels}
      taskDetail={taskDetail}
      onViewChange={(view: ViewMode) => setCurrentView(view)}
      onDateChange={(date: string) => {
        setCurrentDate(date)
        fetchCalendarData(date, filter)
      }}
      onFilterChange={(f: CalendarFilter) => {
        setFilter(f)
        fetchCalendarData(currentDate, f)
      }}
      onTaskClick={async (taskId: string) => {
        try {
          const detail = await api.get<TaskDetail>(`/api/tasks/${taskId}`)
          setTaskDetail(detail)
        } catch (err) {
          console.error('Failed to fetch task detail:', err)
        }
      }}
      onTaskDrag={async (taskId: string, newStartDate: string, newEndDate: string) => {
        try {
          await api.patch(`/api/tasks/${taskId}`, { startDate: newStartDate, endDate: newEndDate })
          await fetchCalendarData(currentDate, filter)
        } catch (err) {
          console.error('Failed to drag task:', err)
        }
      }}
      onTaskResize={async (taskId: string, newEndDate: string) => {
        try {
          await api.patch(`/api/tasks/${taskId}`, { endDate: newEndDate })
          await fetchCalendarData(currentDate, filter)
        } catch (err) {
          console.error('Failed to resize task:', err)
        }
      }}
      onDayExpand={(date: string) => {
        setCurrentDate(date)
        setCurrentView('day')
      }}
      onDayClick={(date: string) => {
        setCurrentDate(date)
        setCurrentView('day')
      }}
      onCreateActivity={async (form: CreateActivityForm) => {
        try {
          await api.post('/api/activities', form)
          await fetchCalendarData(currentDate, filter)
        } catch (err) {
          console.error('Failed to create activity:', err)
        }
      }}
      isLeader={isLeader}
      onActivityEdit={async (activityId: string) => {
        try {
          const detail = await api.get<ActivityEditData>(`/api/activities/${activityId}`)
          setEditActivityData(detail)
          setEditModalOpen(true)
        } catch (err) {
          console.error('Failed to fetch activity detail:', err)
        }
      }}
      onEditActivity={async (id: string, form: CreateActivityForm) => {
        try {
          await api.patch(`/api/activities/${id}`, form)
          await fetchCalendarData(currentDate, filter)
        } catch (err) {
          console.error('Failed to update activity:', err)
        }
      }}
      editActivityData={editActivityData}
      editModalOpen={editModalOpen}
      onEditModalClose={() => {
        setEditModalOpen(false)
        setEditActivityData(null)
      }}
    />
  )
}
