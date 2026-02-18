/** Task status pipeline */
export type TaskStatus =
  | 'To Do'
  | 'In Progress'
  | 'Need Review'
  | 'Revision'
  | 'Approved'
  | 'Archived'

/** Calendar view modes */
export type CalendarView = 'day' | 'week' | 'month'

/** User role */
export type UserRole = 'Leader' | 'PIC'

/** A task displayed on the calendar */
export interface CalendarTask {
  id: string
  name: string
  activityId: string
  activityName: string
  activityTypeColor: string
  activityTypeName: string
  picId: string
  picName: string
  picAvatarUrl: string | null
  status: TaskStatus
  startDate: string
  endDate: string
  startTime: string | null
  endTime: string | null
  isOverdue: boolean
}

/** Planning summary stats shown above the calendar */
export interface PlanSummary {
  activeTasks: number
  overdueTasks: number
  next7DaysTasks: number
}

/** Per-day workload indicator for Month View */
export interface DayWorkload {
  date: string
  taskCount: number
  isOverloaded: boolean
}

/** Conflict warning when PIC has overlapping assignments */
export interface ConflictWarning {
  picId: string
  picName: string
  date: string
  taskCount: number
  message: string
}

/** Approver reference */
export interface Approver {
  id: string
  name: string
}

/** Approval log entry */
export interface ApprovalLogEntry {
  id: string
  reviewerId: string
  reviewerName: string
  action: 'approved' | 'revision'
  feedback: string
  createdAt: string
}

/** Full task detail shown in side panel */
export interface TaskDetail {
  id: string
  name: string
  description: string
  activityId: string
  activityName: string
  activityTypeColor: string
  activityTypeName: string
  picId: string
  picName: string
  picAvatarUrl: string | null
  status: TaskStatus
  startDate: string
  endDate: string
  startTime: string | null
  endTime: string | null
  isOverdue: boolean
  approvers: Approver[]
  approvalLog: ApprovalLogEntry[]
}

/** Activity type for filter dropdown and calendar color-coding */
export interface ActivityTypeOption {
  id: string
  name: string
  color: string
}

/** User for filter dropdown and team assignment */
export interface UserOption {
  id: string
  name: string
  role: UserRole
}

/** Calendar filter state */
export interface CalendarFilter {
  activityTypeIds: string[]
  picIds: string[]
  statuses: TaskStatus[]
  myTasksOnly: boolean
}

/* ─── Create Activity Modal Types ─── */

/** Reminder trigger options */
export type ReminderTrigger = 'H-7' | 'H-3' | 'H-1' | 'Day-H' | 'Custom'

/** Reminder channel options (dynamic from WhatsApp groups) */
export type ReminderChannel = string

/** A reminder template from master data */
export interface ReminderTemplate {
  id: string
  name: string
  type: 'standard' | 'urgent' | 'finance'
}

/** A single reminder configuration within an Activity */
export interface ReminderConfig {
  id: string
  trigger: ReminderTrigger
  customDays?: number
  channel: ReminderChannel
  templateId: string
  customMessage?: string
  enabled: boolean
}

/** Create Activity form data */
export interface CreateActivityForm {
  name: string
  activityTypeId: string
  startDate: string
  endDate: string
  description: string
  picIds: string[]
  approverIds: string[]
  requiresBudget: boolean
  estimatedBudget: number | null
  budgetNeededDate: string | null
  reminders: ReminderConfig[]
}

/** Edit Activity form — extends CreateActivityForm with id */
export interface EditActivityForm extends CreateActivityForm {
  id: string
}

/** Activity detail data fetched from GET /api/activities/:id for edit mode */
export interface ActivityEditData {
  id: string
  name: string
  description: string
  activityType: { id: string; name: string; color: string }
  status: string
  startDate: string
  endDate: string
  requiresBudget: boolean
  estimatedBudget: number | null
  budgetNeededDate: string | null
  pics: { id: string; name: string }[]
  approvers: { id: string; name: string }[]
  reminders: { id: string; trigger: string; customDays: number | null; channel: string; templateId: string | null; customMessage: string | null; enabled: boolean }[]
}

/** An activity displayed on the calendar */
export interface CalendarActivity {
  id: string
  name: string
  activityTypeColor: string   // Tailwind color name (e.g. 'rose')
  activityTypeName: string
  startDate: string            // YYYY-MM-DD
  endDate: string              // YYYY-MM-DD
}

/** Calendar component props */
export interface CalendarProps {
  currentView: CalendarView
  currentDate: string
  tasks: CalendarTask[]
  activities?: CalendarActivity[]
  planSummary: PlanSummary
  dayWorkloads: DayWorkload[]
  conflictWarnings: ConflictWarning[]
  activityTypes: ActivityTypeOption[]
  users: UserOption[]
  statuses: TaskStatus[]
  filter: CalendarFilter
  reminderTemplates: ReminderTemplate[]

  /** Called when user switches between day/week/month */
  onViewChange?: (view: CalendarView) => void
  /** Called when user navigates to a different date (prev/next/today) */
  onDateChange?: (date: string) => void
  /** Called when user clicks a task to open side panel */
  onTaskClick?: (taskId: string) => void
  /** Called when user drags a task to a new date */
  onTaskDrag?: (taskId: string, newStartDate: string, newEndDate: string) => void
  /** Called when user resizes a task block in Week View */
  onTaskResize?: (taskId: string, newEndDate: string) => void
  /** Called when filter changes */
  onFilterChange?: (filter: CalendarFilter) => void
  /** Called when "+N more" is clicked on a day cell in Month View */
  onDayExpand?: (date: string) => void
  /** Called when user clicks a day in Month View to switch to Day View */
  onDayClick?: (date: string) => void
  /** Called when user submits the Create Activity form */
  onCreateActivity?: (form: CreateActivityForm) => void
  /** Called when user clicks edit on an activity (Leader only) */
  onActivityEdit?: (activityId: string) => void
  /** Called when user submits the Edit Activity form */
  onEditActivity?: (id: string, form: CreateActivityForm) => void
  /** Whether the current user is a Leader (controls edit button visibility) */
  isLeader?: boolean
}
