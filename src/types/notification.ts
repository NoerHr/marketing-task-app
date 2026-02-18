export type NotificationType =
  | 'taskAssignment'
  | 'approval'
  | 'revision'
  | 'reassignment'
  | 'deadlineAlert'
  | 'reminder'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  taskId?: string
  activityId?: string
  isRead: boolean
  createdAt: string
}

export interface NotificationFilter {
  type?: NotificationType
  readStatus?: 'all' | 'read' | 'unread'
}

export interface NotificationsPageProps {
  notifications: Notification[]
  filter: NotificationFilter
  onFilterChange: (filter: NotificationFilter) => void
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
  onNotificationClick: (notification: Notification) => void
}
