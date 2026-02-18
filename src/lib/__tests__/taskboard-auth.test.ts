import { describe, it, expect } from 'vitest'
import {
  isActivityPicFor,
  isCreatorOf,
  isAssignedTo,
  canEditStatus,
  canManagePics,
  canAddPicOnly,
  canEditTask,
  canDeleteTask,
} from '../taskboard-auth'
import type { CurrentUser, ActivityRef, BoardTask } from '@/types/taskboard'

/* ── Fixtures ── */

const leader: CurrentUser = { id: 'u-leader', name: 'Leader', role: 'Leader', isSuperAdmin: false }
const activityPic: CurrentUser = { id: 'u-act-pic', name: 'Act PIC', role: 'PIC', isSuperAdmin: false }
const assignedPic: CurrentUser = { id: 'u-assigned', name: 'Assigned', role: 'PIC', isSuperAdmin: false }
const creator: CurrentUser = { id: 'u-creator', name: 'Creator', role: 'PIC', isSuperAdmin: false }
const unrelatedPic: CurrentUser = { id: 'u-random', name: 'Random', role: 'PIC', isSuperAdmin: false }

const activities: ActivityRef[] = [
  { id: 'act-1', name: 'Campaign A', activityTypeColor: 'indigo', activityPicId: 'u-act-pic', picIds: ['u-act-pic', 'u-assigned', 'u-creator'], startDate: '2026-01-01', endDate: '2026-03-31' },
]

function makeTask(overrides?: Partial<BoardTask>): BoardTask {
  return {
    id: 'task-1',
    name: 'Test Task',
    activityId: 'act-1',
    activityName: 'Campaign A',
    activityTypeColor: 'indigo',
    activityTypeName: 'Marketing',
    pics: [{ id: 'u-assigned', name: 'Assigned', avatarUrl: null }],
    status: 'To Do',
    priority: 'Medium',
    startDate: '2026-01-15',
    endDate: '2026-02-15',
    isOverdue: false,
    creatorId: 'u-creator',
    ...overrides,
  }
}

/* ── Tests ── */

describe('isActivityPicFor', () => {
  it('returns true for the activity PIC', () => {
    expect(isActivityPicFor(activities, 'u-act-pic', 'act-1')).toBe(true)
  })
  it('returns false for non-activity PIC', () => {
    expect(isActivityPicFor(activities, 'u-random', 'act-1')).toBe(false)
  })
  it('returns false for unknown activity', () => {
    expect(isActivityPicFor(activities, 'u-act-pic', 'act-unknown')).toBe(false)
  })
})

describe('isCreatorOf', () => {
  const task = makeTask()
  it('returns true for the creator', () => {
    expect(isCreatorOf('u-creator', task)).toBe(true)
  })
  it('returns false for non-creator', () => {
    expect(isCreatorOf('u-random', task)).toBe(false)
  })
})

describe('isAssignedTo', () => {
  const task = makeTask()
  it('returns true for an assigned PIC', () => {
    expect(isAssignedTo('u-assigned', task)).toBe(true)
  })
  it('returns false for a non-assigned user', () => {
    expect(isAssignedTo('u-random', task)).toBe(false)
  })
})

describe('canEditStatus', () => {
  const task = makeTask()
  it('Leader can always edit status', () => {
    expect(canEditStatus(leader, activities, task)).toBe(true)
  })
  it('Activity PIC can edit status', () => {
    expect(canEditStatus(activityPic, activities, task)).toBe(true)
  })
  it('Assigned PIC can edit status', () => {
    expect(canEditStatus(assignedPic, activities, task)).toBe(true)
  })
  it('Unrelated PIC cannot edit status', () => {
    expect(canEditStatus(unrelatedPic, activities, task)).toBe(false)
  })
})

describe('canManagePics', () => {
  const task = makeTask()
  it('Leader can manage PICs', () => {
    expect(canManagePics(leader, activities, task)).toBe(true)
  })
  it('Activity PIC can manage PICs', () => {
    expect(canManagePics(activityPic, activities, task)).toBe(true)
  })
  it('Assigned PIC cannot manage PICs', () => {
    expect(canManagePics(assignedPic, activities, task)).toBe(false)
  })
  it('Creator (non-leader, non-activity-pic) cannot manage PICs', () => {
    expect(canManagePics(creator, activities, task)).toBe(false)
  })
})

describe('canAddPicOnly', () => {
  const task = makeTask()
  it('Creator who is not Leader or Activity PIC can add PICs only', () => {
    expect(canAddPicOnly(creator, activities, task)).toBe(true)
  })
  it('Leader cannot be add-only (has full manage)', () => {
    const leaderCreator: CurrentUser = { ...leader, id: 'u-creator' }
    expect(canAddPicOnly(leaderCreator, activities, task)).toBe(false)
  })
  it('Activity PIC who is also creator cannot be add-only (has full manage)', () => {
    const taskByActPic = makeTask({ creatorId: 'u-act-pic' })
    expect(canAddPicOnly(activityPic, activities, taskByActPic)).toBe(false)
  })
  it('Assigned PIC who is not Leader or Activity PIC can add PICs only', () => {
    expect(canAddPicOnly(assignedPic, activities, task)).toBe(true)
  })
  it('Non-creator non-assigned PIC cannot add PICs', () => {
    expect(canAddPicOnly(unrelatedPic, activities, task)).toBe(false)
  })
})

describe('canEditTask', () => {
  it('Creator can edit own task', () => {
    expect(canEditTask(creator, makeTask())).toBe(true)
  })
  it('Leader can edit any task', () => {
    expect(canEditTask(leader, makeTask())).toBe(true)
  })
  it('Non-creator PIC cannot edit', () => {
    expect(canEditTask(unrelatedPic, makeTask())).toBe(false)
  })
  it('Nobody can edit archived task', () => {
    const archivedTask = makeTask({ status: 'Archived' })
    expect(canEditTask(creator, archivedTask)).toBe(false)
    expect(canEditTask(leader, archivedTask)).toBe(false)
  })
})

describe('canDeleteTask', () => {
  it('Creator can delete own task', () => {
    expect(canDeleteTask(creator, makeTask())).toBe(true)
  })
  it('Leader can delete any task', () => {
    expect(canDeleteTask(leader, makeTask())).toBe(true)
  })
  it('Non-creator PIC cannot delete', () => {
    expect(canDeleteTask(unrelatedPic, makeTask())).toBe(false)
  })
})
