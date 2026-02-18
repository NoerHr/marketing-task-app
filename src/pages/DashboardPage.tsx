import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardView } from '@/components/dashboard'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { hexToColorName } from '@/lib/utils'
import type {
  CurrentUser,
  GreetingSummary,
  ActivitySummary,
  OverdueTask,
  RecentTask,
  PicProgressItem,
  BudgetItem,
  MyTask,
  DeadlineTask,
  MyProgress,
  FilterOption,
  UserFilterOption,
} from '@/types/dashboard'

// Raw API task shape (from GET /api/tasks)
interface ApiTask {
  id: string
  name: string
  activityName: string
  activityTypeColor: string
  pics: { id: string; name: string; avatarUrl: string | null }[]
  status: string
  priority: string
  startDate: string
  endDate: string
  isOverdue: boolean
  createdAt: string
  updatedAt: string
}

// Raw API activity shape
interface ApiActivity {
  id: string
  name: string
}

// Raw API user shape
interface ApiUser {
  id: string
  name: string
  role: string
}

// Raw API my-progress response (nested)
interface ApiMyProgress {
  progress: MyProgress
  myTasks: ApiTask[]
  nearestDeadlines: { id: string; name: string; activityName: string; endDate: string; daysUntil: number; status: string }[]
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [greeting, setGreeting] = useState<GreetingSummary>({ overdueTasksCount: 0, activitiesThisWeek: 0 })
  const [activitySummary, setActivitySummary] = useState<ActivitySummary>({ active: 0, completed: 0, needReview: 0, archived: 0 })
  const [overdueTasks, setOverdueTasks] = useState<OverdueTask[]>([])
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([])
  const [picProgress, setPicProgress] = useState<PicProgressItem[]>([])
  const [budgetOverview, setBudgetOverview] = useState<BudgetItem[]>([])
  const [myTasks, setMyTasks] = useState<MyTask[]>([])
  const [nearestDeadlines, setNearestDeadlines] = useState<DeadlineTask[]>([])
  const [myProgress, setMyProgress] = useState<MyProgress>({
    totalTasks: 0, approved: 0, inProgress: 0, needReview: 0, revision: 0, toDo: 0, overdue: 0, completionPercent: 0,
  })
  const [activities, setActivities] = useState<FilterOption[]>([])
  const [users, setUsers] = useState<UserFilterOption[]>([])

  // Map API task to OverdueTask
  function mapOverdueTask(t: ApiTask): OverdueTask {
    const daysOverdue = Math.max(0, Math.ceil((Date.now() - new Date(t.endDate).getTime()) / (1000 * 60 * 60 * 24)))
    return {
      id: t.id,
      name: t.name,
      activityName: t.activityName,
      activityTypeColor: hexToColorName(t.activityTypeColor),
      picName: t.pics?.[0]?.name || '-',
      endDate: t.endDate,
      daysOverdue,
      status: t.status as OverdueTask['status'],
    }
  }

  // Map API task to RecentTask
  function mapRecentTask(t: ApiTask): RecentTask {
    return {
      id: t.id,
      name: t.name,
      activityName: t.activityName,
      activityTypeColor: hexToColorName(t.activityTypeColor),
      picName: t.pics?.[0]?.name || '-',
      status: t.status as RecentTask['status'],
      startDate: t.startDate,
      endDate: t.endDate,
      updatedAt: t.updatedAt,
    }
  }

  const fetchData = useCallback(async () => {
    try {
      const [
        meRes,
        summaryRes,
        actSummaryRes,
        picRes,
        budgetRes,
        myProgressRes,
        overdueRes,
        recentRes,
        activitiesRes,
        usersRes,
      ] = await Promise.all([
        api.get<CurrentUser>('/api/me'),
        api.get<GreetingSummary>('/api/dashboard/summary'),
        api.get<ActivitySummary>('/api/dashboard/activity-summary'),
        api.get<PicProgressItem[]>('/api/dashboard/pic-progress'),
        api.get<BudgetItem[]>('/api/dashboard/budget-overview'),
        api.get<ApiMyProgress>('/api/dashboard/my-progress'),
        api.get<ApiTask[]>('/api/tasks?status=overdue&limit=5'),
        api.get<ApiTask[]>('/api/tasks?sort=recent&limit=5'),
        api.get<ApiActivity[]>('/api/activities'),
        api.get<ApiUser[]>('/api/users'),
      ])

      setCurrentUser(meRes)
      setGreeting(summaryRes)
      setActivitySummary(actSummaryRes)
      setPicProgress(picRes)
      setBudgetOverview((Array.isArray(budgetRes) ? budgetRes : []).map(b => ({ ...b, activityTypeColor: hexToColorName(b.activityTypeColor) })))

      // Unwrap nested my-progress response
      const progressData = myProgressRes as ApiMyProgress
      if (progressData.progress) {
        setMyProgress(progressData.progress)
        setMyTasks((progressData.myTasks || []).map((t) => ({
          id: t.id,
          name: t.name,
          activityName: t.activityName,
          activityTypeColor: hexToColorName(t.activityTypeColor),
          status: t.status as MyTask['status'],
          endDate: t.endDate,
          updatedAt: t.updatedAt,
        })))
        setNearestDeadlines((progressData.nearestDeadlines || []).map((d) => ({
          ...d,
          status: d.status as DeadlineTask['status'],
        })))
      } else {
        // Fallback: if API returns flat MyProgress
        setMyProgress(myProgressRes as unknown as MyProgress)
      }

      // Map API tasks to OverdueTask[] and RecentTask[]
      const overdueList = Array.isArray(overdueRes) ? overdueRes : []
      setOverdueTasks(overdueList.map(mapOverdueTask))

      const recentList = Array.isArray(recentRes) ? recentRes : []
      setRecentTasks(recentList.map(mapRecentTask))

      // If myTasks/nearestDeadlines empty from my-progress, compute from recent
      if (!progressData.progress && recentList.length > 0) {
        const now = new Date()
        setMyTasks(recentList.map((t) => ({
          id: t.id,
          name: t.name,
          activityName: t.activityName,
          activityTypeColor: hexToColorName(t.activityTypeColor),
          status: t.status as MyTask['status'],
          endDate: t.endDate,
          updatedAt: t.updatedAt,
        })))
        setNearestDeadlines(
          recentList
            .filter((t) => new Date(t.endDate) >= now)
            .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
            .slice(0, 4)
            .map((t) => ({
              id: t.id,
              name: t.name,
              activityName: t.activityName,
              endDate: t.endDate,
              daysUntil: Math.ceil((new Date(t.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
              status: t.status as DeadlineTask['status'],
            })),
        )
      }

      // Map activities to FilterOption[]
      setActivities((Array.isArray(activitiesRes) ? activitiesRes : []).map((a) => ({
        id: a.id,
        name: a.name,
      })))

      // Map users to UserFilterOption[]
      setUsers((Array.isArray(usersRes) ? usersRes : []).map((u) => ({
        id: u.id,
        name: u.name,
        role: u.role as UserFilterOption['role'],
      })))
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading || !currentUser) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardView
      currentUser={currentUser}
      greeting={greeting}
      activitySummary={activitySummary}
      overdueTasks={overdueTasks}
      recentTasks={recentTasks}
      picProgress={picProgress}
      budgetOverview={budgetOverview}
      myTasks={myTasks}
      nearestDeadlines={nearestDeadlines}
      myProgress={myProgress}
      activities={activities}
      users={users}
      onViewAll={(card) => {
        if (card === 'overdue' || card === 'recent') navigate('/taskboard')
        else if (card === 'calendar') navigate('/calendar')
      }}
      onTaskClick={() => navigate('/taskboard')}
      onActivityClick={() => navigate('/calendar')}
      onPicClick={() => navigate('/taskboard')}
      onRecentTasksFilterChange={() => {}}
    />
  )
}
