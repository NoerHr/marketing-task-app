import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { NotificationsView } from '@/components/notifications'
import { api } from '@/lib/api'
import type { Notification, NotificationFilter } from '@/types/notification'

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<NotificationFilter>({ readStatus: 'all' })

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.get<Notification[]>('/api/notifications')
      setNotifications(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const handleMarkRead = async (id: string) => {
    try {
      await api.patch(`/api/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
      // Optimistic: still mark locally
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await api.post('/api/notifications/mark-all-read')
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch (err) {
      console.error('Failed to mark all as read:', err)
      // Optimistic: still mark locally
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      handleMarkRead(notification.id)
    }
    // Navigate to the relevant page
    if (notification.taskId) {
      navigate('/taskboard')
    } else if (notification.activityId) {
      navigate('/calendar')
    }
  }

  return (
    <NotificationsView
      notifications={notifications}
      filter={filter}
      onFilterChange={setFilter}
      onMarkRead={handleMarkRead}
      onMarkAllRead={handleMarkAllRead}
      onNotificationClick={handleNotificationClick}
    />
  )
}
