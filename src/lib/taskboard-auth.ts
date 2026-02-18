import type { CurrentUser, ActivityRef, BoardTask } from '@/types/taskboard'

/** Check if userId is the designated Activity PIC for the given activity */
export function isActivityPicFor(activities: ActivityRef[], userId: string, activityId: string): boolean {
  const act = activities.find(a => a.id === activityId)
  return act ? act.activityPicId === userId : false
}

/** Check if userId is the creator of the task */
export function isCreatorOf(userId: string, task: BoardTask): boolean {
  return task.creatorId === userId
}

/** Check if userId is assigned as a PIC on the task */
export function isAssignedTo(userId: string, task: BoardTask): boolean {
  return task.pics.some(p => p.id === userId)
}

/** Can edit status: Leader, Activity PIC, or Assigned PIC */
export function canEditStatus(currentUser: CurrentUser, activities: ActivityRef[], task: BoardTask): boolean {
  return currentUser.role === 'Leader' || isActivityPicFor(activities, currentUser.id, task.activityId) || isAssignedTo(currentUser.id, task)
}

/** Can fully manage PICs (add + remove): Leader or Activity PIC */
export function canManagePics(currentUser: CurrentUser, activities: ActivityRef[], task: BoardTask): boolean {
  return currentUser.role === 'Leader' || isActivityPicFor(activities, currentUser.id, task.activityId)
}

/** Can only add PICs (not remove): Creator or Assigned PIC who is not Leader or Activity PIC */
export function canAddPicOnly(currentUser: CurrentUser, activities: ActivityRef[], task: BoardTask): boolean {
  const hasBaseRight = isCreatorOf(currentUser.id, task) || isAssignedTo(currentUser.id, task)
  return hasBaseRight && currentUser.role !== 'Leader' && !isActivityPicFor(activities, currentUser.id, task.activityId)
}

/** Can edit a task: Leader or Creator (only if not Archived) */
export function canEditTask(currentUser: CurrentUser, task: BoardTask): boolean {
  if (task.status === 'Archived') return false
  return currentUser.role === 'Leader' || isCreatorOf(currentUser.id, task)
}

/** Can delete a task: Leader or Creator */
export function canDeleteTask(currentUser: CurrentUser, task: BoardTask): boolean {
  return currentUser.role === 'Leader' || isCreatorOf(currentUser.id, task)
}
