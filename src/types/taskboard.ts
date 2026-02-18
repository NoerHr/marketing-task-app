import type { ReminderConfig, ReminderTemplate } from './calendar'

/** WhatsApp channel option fetched from API */
export interface WaChannel {
  type: string
  name: string
}

/** Task status pipeline */
export type TaskStatus =
  | 'To Do'
  | 'In Progress'
  | 'Need Review'
  | 'Revision'
  | 'Approved'
  | 'Archived'

/** Task priority */
export type TaskPriority = 'Low' | 'Medium' | 'High'

/** Board grouping modes */
export type BoardGrouping = 'status' | 'activity' | 'pic' | 'table'

/** User role */
export type UserRole = 'Leader' | 'PIC'

/** Assignment action type */
export type AssignmentActionType = 'add' | 'remove' | 'replace'

/** Approval action type */
export type ApprovalAction = 'approved' | 'revision'

/** A PIC reference with avatar */
export interface PicRef {
  id: string
  name: string
  avatarUrl: string | null
}

/** A user reference for the create/filter dropdowns */
export interface UserRef {
  id: string
  name: string
  role: UserRole
  avatarUrl: string | null
}

/** Current logged-in user */
export interface CurrentUser {
  id: string
  name: string
  role: UserRole
  isSuperAdmin: boolean
}

/** Activity reference for grouping and filtering */
export interface ActivityRef {
  id: string
  name: string
  activityTypeColor: string
  /** The designated PIC for this activity (has elevated edit rights) */
  activityPicId: string
  /** All member PIC IDs for this activity */
  picIds: string[]
  startDate: string
  endDate: string
}

/** Activity type for filtering */
export interface ActivityTypeRef {
  id: string
  name: string
  color: string
}

/** A task card on the board */
export interface BoardTask {
  id: string
  name: string
  activityId: string
  activityName: string
  activityTypeColor: string
  activityTypeName: string
  pics: PicRef[]
  status: TaskStatus
  priority: TaskPriority
  startDate: string
  endDate: string
  isOverdue: boolean
  /** Who created this task */
  creatorId: string
}

/** Approver reference */
export interface ApproverRef {
  id: string
  name: string
}

/** Creator reference */
export interface CreatorRef {
  id: string
  name: string
}

/** A single approval log entry */
export interface ApprovalLogEntry {
  id: string
  reviewerId: string
  reviewerName: string
  action: ApprovalAction
  feedback: string
  createdAt: string
}

/** A single assignment change log entry */
export interface AssignmentLogEntry {
  id: string
  changedById: string
  changedByName: string
  actionType: AssignmentActionType
  affectedUserId: string
  affectedUserName: string
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
  pics: PicRef[]
  status: TaskStatus
  priority: TaskPriority
  startDate: string
  endDate: string
  isOverdue: boolean
  createdBy: CreatorRef
  approvers: ApproverRef[]
  approvalLog: ApprovalLogEntry[]
  assignmentLog: AssignmentLogEntry[]
  reminders: ReminderConfig[]
}

/** Create/edit task form data */
export interface TaskFormData {
  name: string
  activityId: string
  picIds: string[]
  priority: TaskPriority
  startDate: string
  endDate: string
  description: string
  reminders: ReminderConfig[]
}

/** Board filter state */
export interface BoardFilter {
  activityIds: string[]
  picIds: string[]
  statuses: TaskStatus[]
  activityTypeIds: string[]
  showArchived: boolean
}

/** Taskboard component props */
export interface TaskboardProps {
  currentUser: CurrentUser
  currentGrouping: BoardGrouping
  tasks: BoardTask[]
  activities: ActivityRef[]
  activityTypes: ActivityTypeRef[]
  users: UserRef[]
  statuses: TaskStatus[]
  filter: BoardFilter
  reminderTemplates: ReminderTemplate[]

  /** Called when user switches grouping mode */
  onGroupingChange?: (grouping: BoardGrouping) => void
  /** Called when user clicks a task card to open detail */
  onTaskClick?: (taskId: string) => void
  /** Called when user drags a task to a new status column */
  onTaskStatusChange?: (taskId: string, newStatus: TaskStatus) => void
  /** Called when user submits the create task form */
  onTaskCreate?: (data: TaskFormData) => void
  /** Called when user updates a task */
  onTaskUpdate?: (taskId: string, data: Partial<TaskFormData>) => void
  /** Called when user deletes a task */
  onTaskDelete?: (taskId: string) => void
  /** Called when user adds a PIC to a task */
  onPicAdd?: (taskId: string, userId: string) => void
  /** Called when user removes a PIC from a task */
  onPicRemove?: (taskId: string, userId: string) => void
  /** Called when leader approves a task */
  onTaskApprove?: (taskId: string, feedback: string) => void
  /** Called when leader requests revision */
  onTaskRevision?: (taskId: string, feedback: string) => void
  /** Called when leader archives a task */
  onTaskArchive?: (taskId: string) => void
  /** Called when leader reopens an archived task */
  onTaskReopen?: (taskId: string) => void
  /** Called when filter changes */
  onFilterChange?: (filter: BoardFilter) => void
}
