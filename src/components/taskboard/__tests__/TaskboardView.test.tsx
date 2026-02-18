import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TaskboardView } from '../TaskboardView'
import type {
  CurrentUser, BoardTask, ActivityRef, ActivityTypeRef,
  UserRef, TaskStatus, BoardFilter, TaskDetail,
} from '@/types/taskboard'
import type { ReminderTemplate } from '@/types/calendar'

/* ── Fixtures ── */

const picUser: CurrentUser = { id: 'u-pic', name: 'Pic User', role: 'PIC', isSuperAdmin: false }
const leaderUser: CurrentUser = { id: 'u-leader', name: 'Leader User', role: 'Leader', isSuperAdmin: false }
const creatorPicUser: CurrentUser = { id: 'u-creator', name: 'Creator PIC', role: 'PIC', isSuperAdmin: false }

const activities: ActivityRef[] = [
  { id: 'act-1', name: 'Campaign A', activityTypeColor: 'indigo', activityPicId: 'u-act-pic', picIds: ['u-act-pic', 'u-pic', 'u-creator'], startDate: '2026-01-01', endDate: '2026-03-31' },
  { id: 'act-2', name: 'Campaign B', activityTypeColor: 'rose', activityPicId: 'u-other', picIds: ['u-other'], startDate: '2026-01-01', endDate: '2026-03-31' },
]

const activityTypes: ActivityTypeRef[] = [
  { id: 'at-1', name: 'Marketing', color: 'indigo' },
]

const users: UserRef[] = [
  { id: 'u-pic', name: 'Pic User', role: 'PIC', avatarUrl: null },
  { id: 'u-leader', name: 'Leader User', role: 'Leader', avatarUrl: null },
  { id: 'u-creator', name: 'Creator PIC', role: 'PIC', avatarUrl: null },
]

const statuses: TaskStatus[] = ['To Do', 'In Progress', 'Need Review', 'Revision', 'Approved', 'Archived']

const filter: BoardFilter = {
  activityIds: [], picIds: [], statuses: [], activityTypeIds: [], showArchived: true,
}

const reminderTemplates: ReminderTemplate[] = [
  { id: 'tpl-1', name: 'Standard', type: 'standard' },
]

function makeTask(status: TaskStatus, overrides?: Partial<BoardTask>): BoardTask {
  return {
    id: 'task-1',
    name: 'Test Task',
    activityId: 'act-1',
    activityName: 'Campaign A',
    activityTypeColor: 'indigo',
    activityTypeName: 'Marketing',
    pics: [{ id: 'u-pic', name: 'Pic User', avatarUrl: null }],
    status,
    priority: 'Medium',
    startDate: '2026-01-15',
    endDate: '2026-02-15',
    isOverdue: false,
    creatorId: 'u-creator',
    ...overrides,
  }
}

const noopDetail: TaskDetail = {
  id: 'task-1',
  name: 'Test Task',
  description: 'Test description',
  activityId: 'act-1',
  activityName: 'Campaign A',
  activityTypeColor: 'indigo',
  activityTypeName: 'Marketing',
  pics: [{ id: 'u-pic', name: 'Pic User', avatarUrl: null }],
  status: 'To Do',
  priority: 'Medium',
  startDate: '2026-01-15',
  endDate: '2026-02-15',
  isOverdue: false,
  createdBy: { id: 'u-creator', name: 'Creator PIC' },
  approvers: [],
  approvalLog: [],
  assignmentLog: [],
  reminders: [],
}

interface RenderOpts {
  currentUser?: CurrentUser
  tasks?: BoardTask[]
  taskDetail?: TaskDetail | null
}

function renderAndOpenDetail(opts: RenderOpts = {}) {
  const task = (opts.tasks ?? [makeTask('To Do')])[0]
  const detail = opts.taskDetail !== undefined
    ? opts.taskDetail
    : { ...noopDetail, id: task.id, status: task.status }

  render(
    <TaskboardView
      currentUser={opts.currentUser ?? picUser}
      currentGrouping="status"
      tasks={opts.tasks ?? [task]}
      activities={activities}
      activityTypes={activityTypes}
      users={users}
      statuses={statuses}
      filter={filter}
      reminderTemplates={reminderTemplates}
      taskDetail={detail}
      onGroupingChange={vi.fn()}
      onTaskClick={vi.fn()}
      onTaskStatusChange={vi.fn()}
      onTaskCreate={vi.fn()}
      onPicAdd={vi.fn()}
      onPicRemove={vi.fn()}
      onTaskApprove={vi.fn()}
      onTaskRevision={vi.fn()}
      onTaskArchive={vi.fn()}
      onTaskReopen={vi.fn()}
      onFilterChange={vi.fn()}
      onTaskDetailClose={vi.fn()}
    />
  )

  // Click the task card to open detail
  const taskButton = screen.getByText(task.name)
  fireEvent.click(taskButton)
}

/* ── PIC sees correct actions per status ── */

describe('PIC status actions', () => {
  it('PIC sees "Start Working" on To Do', () => {
    renderAndOpenDetail({ tasks: [makeTask('To Do')] })
    expect(screen.getByText('Start Working')).toBeInTheDocument()
  })

  it('PIC sees "Submit for Review" on In Progress', () => {
    renderAndOpenDetail({ tasks: [makeTask('In Progress')] })
    expect(screen.getByText('Submit for Review')).toBeInTheDocument()
  })

  it('PIC sees "Continue Working" on Revision', () => {
    const task = makeTask('Revision')
    const detail: TaskDetail = {
      ...noopDetail, id: task.id, status: 'Revision',
      approvalLog: [{ id: 'log-1', reviewerId: 'u-leader', reviewerName: 'Leader', action: 'revision', feedback: 'Fix it', createdAt: '2026-02-10T10:00:00Z' }],
    }
    renderAndOpenDetail({ tasks: [task], taskDetail: detail })
    expect(screen.getByText('Continue Working')).toBeInTheDocument()
  })

  it('PIC sees "Waiting for leader review" on Need Review', () => {
    renderAndOpenDetail({ tasks: [makeTask('Need Review')] })
    expect(screen.getByText('Waiting for leader review')).toBeInTheDocument()
  })

  it('PIC sees "Task approved" on Approved', () => {
    renderAndOpenDetail({ tasks: [makeTask('Approved')] })
    expect(screen.getByText('Task approved')).toBeInTheDocument()
  })

  it('PIC does NOT see Approve/Revision/Archive buttons', () => {
    renderAndOpenDetail({ tasks: [makeTask('Need Review')] })
    expect(screen.queryByText('Approve')).not.toBeInTheDocument()
    expect(screen.queryByText('Archive')).not.toBeInTheDocument()
  })
})

/* ── Leader sees Approve / Revision / Archive on Need Review ── */

describe('Leader actions', () => {
  it('Leader sees Approve, Revision, and Archive on Need Review', () => {
    renderAndOpenDetail({
      currentUser: leaderUser,
      tasks: [makeTask('Need Review')],
    })
    expect(screen.getByText('Approve')).toBeInTheDocument()
    // "Revision" appears as both a kanban column header and a button; find the button
    const revisionElements = screen.getAllByText('Revision')
    const revisionButton = revisionElements.find(el => el.closest('button[class*="bg-rose-500"]'))
    expect(revisionButton).toBeDefined()
    expect(screen.getByText('Archive')).toBeInTheDocument()
  })

  it('Leader sees Archive on Approved tasks', () => {
    renderAndOpenDetail({
      currentUser: leaderUser,
      tasks: [makeTask('Approved')],
    })
    expect(screen.getByText('Archive')).toBeInTheDocument()
  })

  it('Leader sees Reopen Task on Archived tasks', () => {
    renderAndOpenDetail({
      currentUser: leaderUser,
      tasks: [makeTask('Archived')],
    })
    expect(screen.getByText('Reopen Task')).toBeInTheDocument()
  })
})

/* ── Creator PIC can Add PIC ── */

describe('Creator PIC actions', () => {
  it('Creator PIC sees Add button for PICs', () => {
    const task = makeTask('To Do', { creatorId: 'u-creator', pics: [{ id: 'u-pic', name: 'Pic User', avatarUrl: null }] })
    renderAndOpenDetail({
      currentUser: creatorPicUser,
      tasks: [task],
    })
    expect(screen.getByText('Add')).toBeInTheDocument()
  })
})

/* ── Edit/Delete visibility ── */

describe('Edit/Delete buttons', () => {
  it('Creator sees Edit and Delete buttons on own task', () => {
    const task = makeTask('To Do', { creatorId: 'u-creator' })
    renderAndOpenDetail({ currentUser: creatorPicUser, tasks: [task] })
    expect(screen.getByTitle('Edit task')).toBeInTheDocument()
    expect(screen.getByTitle('Delete task')).toBeInTheDocument()
  })

  it('Non-creator PIC does NOT see Edit or Delete buttons', () => {
    const task = makeTask('To Do', { creatorId: 'u-other' })
    renderAndOpenDetail({ currentUser: picUser, tasks: [task] })
    expect(screen.queryByTitle('Edit task')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Delete task')).not.toBeInTheDocument()
  })

  it('Leader sees Edit and Delete on any task', () => {
    const task = makeTask('To Do', { creatorId: 'u-other' })
    renderAndOpenDetail({ currentUser: leaderUser, tasks: [task] })
    expect(screen.getByTitle('Edit task')).toBeInTheDocument()
    expect(screen.getByTitle('Delete task')).toBeInTheDocument()
  })

  it('No Edit button on Archived task (even for creator)', () => {
    const task = makeTask('Archived', { creatorId: 'u-creator' })
    renderAndOpenDetail({ currentUser: creatorPicUser, tasks: [task] })
    expect(screen.queryByTitle('Edit task')).not.toBeInTheDocument()
    // Delete is still visible
    expect(screen.getByTitle('Delete task')).toBeInTheDocument()
  })
})

/* ── Activity filtering in create form ── */

describe('Activity filter in create form', () => {
  it('PIC only sees activities where they are a member', () => {
    render(
      <TaskboardView
        currentUser={picUser}
        currentGrouping="status"
        tasks={[]}
        activities={activities}
        activityTypes={[{ id: 'at-1', name: 'Marketing', color: 'indigo' }]}
        users={users}
        statuses={statuses}
        filter={filter}
        reminderTemplates={reminderTemplates}
        onGroupingChange={vi.fn()}
        onTaskClick={vi.fn()}
        onTaskStatusChange={vi.fn()}
        onTaskCreate={vi.fn()}
        onPicAdd={vi.fn()}
        onPicRemove={vi.fn()}
        onTaskApprove={vi.fn()}
        onTaskRevision={vi.fn()}
        onTaskArchive={vi.fn()}
        onTaskReopen={vi.fn()}
        onFilterChange={vi.fn()}
        onTaskDetailClose={vi.fn()}
      />
    )
    // Click "New Task" button
    fireEvent.click(screen.getByText('New Task'))
    // Should see Campaign A (u-pic is a member) but not Campaign B
    expect(screen.getByText('Campaign A')).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Campaign B' })).not.toBeInTheDocument()
  })

  it('Leader sees all activities in create form', () => {
    render(
      <TaskboardView
        currentUser={leaderUser}
        currentGrouping="status"
        tasks={[]}
        activities={activities}
        activityTypes={[{ id: 'at-1', name: 'Marketing', color: 'indigo' }]}
        users={users}
        statuses={statuses}
        filter={filter}
        reminderTemplates={reminderTemplates}
        onGroupingChange={vi.fn()}
        onTaskClick={vi.fn()}
        onTaskStatusChange={vi.fn()}
        onTaskCreate={vi.fn()}
        onPicAdd={vi.fn()}
        onPicRemove={vi.fn()}
        onTaskApprove={vi.fn()}
        onTaskRevision={vi.fn()}
        onTaskArchive={vi.fn()}
        onTaskReopen={vi.fn()}
        onFilterChange={vi.fn()}
        onTaskDetailClose={vi.fn()}
      />
    )
    fireEvent.click(screen.getByText('New Task'))
    expect(screen.getByRole('option', { name: 'Campaign A' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Campaign B' })).toBeInTheDocument()
  })
})
