/** Task status pipeline */
export type TaskStatus =
  | 'To Do'
  | 'In Progress'
  | 'Need Review'
  | 'Revision'
  | 'Approved'
  | 'Archived'

/** Activity status */
export type ActivityStatus = 'Active' | 'Completed' | 'Cancelled' | 'Archived'

/** User role */
export type UserRole = 'Leader' | 'PIC'

/** Current logged-in user */
export interface CurrentUser {
  id: string
  name: string
  role: UserRole
  isSuperAdmin: boolean
  avatarUrl: string | null
}

/** Greeting summary for the top section */
export interface GreetingSummary {
  overdueTasksCount: number
  activitiesThisWeek: number
}

/** Activity status counts for the summary card */
export interface ActivitySummary {
  active: number
  completed: number
  needReview: number
  archived: number
}

/** An overdue task displayed in the Overdue Tasks card */
export interface OverdueTask {
  id: string
  name: string
  activityName: string
  activityTypeColor: string
  picName: string
  endDate: string
  daysOverdue: number
  status: TaskStatus
}

/** A recent task displayed in the Recent Tasks card */
export interface RecentTask {
  id: string
  name: string
  activityName: string
  activityTypeColor: string
  picName: string
  status: TaskStatus
  startDate: string
  endDate: string
  updatedAt: string
}

/** Per-PIC progress stats for the PIC Progress card */
export interface PicProgressItem {
  userId: string
  name: string
  avatarUrl: string | null
  totalTasks: number
  approved: number
  inProgress: number
  overdue: number
  completionPercent: number
}

/** Per-activity budget data for the Budget Overview card */
export interface BudgetItem {
  activityId: string
  activityName: string
  activityTypeColor: string
  estimatedBudget: number
  spentBudget: number
  currency: string
}

/** A personal task for the PIC's My Tasks card */
export interface MyTask {
  id: string
  name: string
  activityName: string
  activityTypeColor: string
  status: TaskStatus
  endDate: string
  updatedAt: string
}

/** An upcoming deadline for the PIC's Nearest Deadlines card */
export interface DeadlineTask {
  id: string
  name: string
  activityName: string
  endDate: string
  daysUntil: number
  status: TaskStatus
}

/** PIC's personal progress breakdown */
export interface MyProgress {
  totalTasks: number
  approved: number
  inProgress: number
  needReview: number
  revision: number
  toDo: number
  overdue: number
  completionPercent: number
}

/** Filter option reference */
export interface FilterOption {
  id: string
  name: string
}

/** Filter option with role for user list */
export interface UserFilterOption extends FilterOption {
  role: UserRole
}

/** Recent tasks filter state */
export interface RecentTasksFilter {
  startDate?: string
  endDate?: string
  activityId?: string
  picId?: string
}

/** Dashboard component props */
export interface DashboardProps {
  currentUser: CurrentUser
  greeting: GreetingSummary
  activitySummary: ActivitySummary
  overdueTasks: OverdueTask[]
  recentTasks: RecentTask[]
  picProgress: PicProgressItem[]
  budgetOverview: BudgetItem[]
  myTasks: MyTask[]
  nearestDeadlines: DeadlineTask[]
  myProgress: MyProgress
  activities: FilterOption[]
  users: UserFilterOption[]

  /** Called when user clicks "View All" on a card */
  onViewAll?: (card: string) => void
  /** Called when user clicks on a specific task */
  onTaskClick?: (taskId: string) => void
  /** Called when user clicks on an activity name */
  onActivityClick?: (activityId: string) => void
  /** Called when user clicks on a PIC in the progress card */
  onPicClick?: (userId: string) => void
  /** Called when Recent Tasks filter changes */
  onRecentTasksFilterChange?: (filter: RecentTasksFilter) => void
}
