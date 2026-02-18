import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { success, created, notFound, badRequest, forbidden, noContent } from '../utils/response';
import { requireAuth } from '../middleware/auth.middleware';
import { requireLeader } from '../middleware/role.middleware';
import { validate, validateQuery } from '../middleware/validate.middleware';
import { CreateTaskSchema, UpdateTaskSchema, TaskQuerySchema, ApprovalActionSchema, TaskPicSchema } from '../schemas/task.schemas';
import { generateId } from '../services/id.service';
import { isOverdue } from '../utils/date';
import { notifyUsers, createNotification } from '../services/notification.service';

const taskInclude = {
  activity: {
    select: {
      id: true,
      name: true,
      activityType: { select: { id: true, name: true, color: true } },
    },
  },
  pics: {
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  },
  approvers: {
    include: { user: { select: { id: true, name: true } } },
  },
  createdBy: { select: { id: true, name: true } },
  reminders: true,
};

function formatTask(t: any) {
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    activityId: t.activity.id,
    activityName: t.activity.name,
    activityTypeColor: t.activity.activityType.color,
    activityTypeName: t.activity.activityType.name,
    pics: t.pics.map((p: any) => p.user),
    status: t.status,
    priority: t.priority,
    startDate: t.startDate.toISOString().split('T')[0],
    endDate: t.endDate.toISOString().split('T')[0],
    startTime: t.startTime,
    endTime: t.endTime,
    isOverdue: isOverdue(t.endDate, t.status),
    createdBy: t.createdBy,
    approvers: t.approvers?.map((a: any) => a.user) ?? [],
    reminders: (t.reminders ?? []).map((r: any) => ({
      id: r.id,
      trigger: r.trigger,
      customDays: r.customDays,
      channel: r.channel,
      templateId: r.templateId,
      customMessage: r.customMessage,
      enabled: r.enabled,
    })),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

/** Split a query param that may contain comma-separated values */
function splitParam(val: string | string[]): string[] {
  if (Array.isArray(val)) return val.flatMap(v => v.split(','));
  return val.split(',');
}

export const tasksRouter = Router();

tasksRouter.use(requireAuth);

// GET /tasks
tasksRouter.get('/', validateQuery(TaskQuerySchema), async (req: Request, res: Response) => {
  try {
    const q = req.query as any;
    const where: any = {};

    // Filter by activity
    if (q.activityId) {
      const ids = splitParam(q.activityId);
      where.activityId = ids.length === 1 ? ids[0] : { in: ids };
    }
    if (q.activityIds) {
      const ids = splitParam(q.activityIds);
      where.activityId = { in: ids };
    }

    // Filter by status
    const statuses = q.statuses || q.status;
    if (statuses) {
      const statusList = splitParam(statuses);
      // Virtual "overdue" status: endDate past and not completed/archived
      if (statusList.length === 1 && statusList[0] === 'overdue') {
        where.endDate = { lt: new Date() };
        where.status = { notIn: ['Approved', 'Archived'] };
      } else {
        where.status = { in: statusList };
      }
    }

    // Exclude archived by default
    if (q.showArchived !== 'true' && !where.status) {
      where.status = { not: 'Archived' };
    }

    // Filter by activity type
    const atIds = q.activityTypeIds || q.activityTypeId;
    if (atIds) {
      const ids = splitParam(atIds);
      where.activity = { activityTypeId: { in: ids } };
    }

    // Filter by PIC or Creator
    const picIds = q.picIds || q.picId;
    if (picIds) {
      const ids = splitParam(picIds);
      where.OR = [
        { pics: { some: { userId: { in: ids } } } },
        { createdById: { in: ids } },
      ];
    }

    // My tasks only (PIC or Creator)
    if (q.myTasksOnly === 'true' && req.user) {
      where.OR = [
        { pics: { some: { userId: req.user.sub } } },
        { createdById: req.user.sub },
      ];
    }

    // Date range
    if (q.startDate) where.startDate = { gte: new Date(q.startDate) };
    if (q.endDate) where.endDate = { lte: new Date(q.endDate) };

    // Sort
    let orderBy: Record<string, string> = { createdAt: 'desc' };
    if (q.sort === 'recent') orderBy = { updatedAt: 'desc' };
    if (q.sort === 'deadline') orderBy = { endDate: 'asc' };

    // Limit (capped at 100)
    const take = q.limit ? Math.min(parseInt(q.limit, 10), 100) : undefined;

    const tasks = await prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy,
      ...(take ? { take } : {}),
    });

    return success(res, tasks.map(formatTask));
  } catch (err) {
    console.error('List tasks error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list tasks' } });
  }
});

// GET /tasks/:id
tasksRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        ...taskInclude,
        reminders: true,
        approvalLogs: {
          include: { reviewer: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        assignmentLogs: {
          include: {
            changedBy: { select: { id: true, name: true } },
            affectedUser: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!task) {
      return notFound(res, 'Task not found');
    }

    return success(res, {
      ...formatTask(task),
      approvalLog: task.approvalLogs.map((l) => ({
        id: l.id,
        reviewerId: l.reviewer.id,
        reviewerName: l.reviewer.name,
        action: l.action,
        feedback: l.feedback,
        createdAt: l.createdAt.toISOString(),
      })),
      assignmentLog: task.assignmentLogs.map((l) => ({
        id: l.id,
        changedById: l.changedBy.id,
        changedByName: l.changedBy.name,
        actionType: l.actionType,
        affectedUserId: l.affectedUser.id,
        affectedUserName: l.affectedUser.name,
        createdAt: l.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error('Get task error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get task' } });
  }
});

// POST /tasks
tasksRouter.post('/', validate(CreateTaskSchema), async (req: Request, res: Response) => {
  try {
    const { name, activityId, picIds, priority, startDate, endDate, startTime, endTime, description, reminders } = req.body;

    // Validate: creator must be Leader or a member (ActivityPic) of the activity
    if (req.user!.role !== 'Leader') {
      const membership = await prisma.activityPic.findUnique({
        where: { activityId_userId: { activityId, userId: req.user!.sub } },
      });
      if (!membership) {
        return forbidden(res, 'You must be a member of this activity to create tasks');
      }
    }

    const task = await prisma.$transaction(async (tx) => {
      const id = await generateId('tsk', tx);

      const newTask = await tx.task.create({
        data: {
          id,
          name,
          activityId,
          priority,
          description,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          startTime: startTime ?? null,
          endTime: endTime ?? null,
          createdById: req.user!.sub,
        },
      });

      // Assign PICs
      await tx.taskPic.createMany({
        data: picIds.map((userId: string) => ({ taskId: id, userId })),
      });

      // Auto-add PICs to ActivityPic if they are not already members
      for (const userId of picIds) {
        const existing = await tx.activityPic.findUnique({
          where: { activityId_userId: { activityId, userId } },
        });
        if (!existing) {
          await tx.activityPic.create({ data: { activityId, userId } });
        }
      }

      // Log assignments
      for (const userId of picIds) {
        const asgId = await generateId('asg', tx);
        await tx.assignmentLog.create({
          data: {
            id: asgId,
            taskId: id,
            changedById: req.user!.sub,
            actionType: 'add',
            affectedUserId: userId,
          },
        });
      }

      // Create reminders
      if (reminders?.length) {
        for (const rem of reminders) {
          const remId = await generateId('trem', tx);
          await tx.taskReminder.create({
            data: {
              id: remId,
              taskId: id,
              trigger: rem.trigger,
              customDays: rem.customDays ?? null,
              channel: rem.channel,
              templateId: rem.templateId ?? null,
              customMessage: rem.customMessage ?? null,
              enabled: rem.enabled,
            },
          });
        }
      }

      return newTask;
    });

    const full = await prisma.task.findUnique({
      where: { id: task.id },
      include: taskInclude,
    });

    // Notify assigned PICs
    const picUserIds = full!.pics.map((p: any) => p.user.id);
    await notifyUsers(picUserIds, req.user!.sub, {
      type: 'taskAssignment',
      title: 'New Task Assigned',
      message: `You have been assigned to task "${full!.name}"`,
      taskId: full!.id,
      activityId: full!.activityId,
    });

    return created(res, formatTask(full));
  } catch (err) {
    console.error('Create task error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create task' } });
  }
});

// PATCH /tasks/:id
tasksRouter.patch('/:id', validate(UpdateTaskSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, ...rest } = req.body;

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      return notFound(res, 'Task not found');
    }

    const updateData: Record<string, unknown> = { ...rest };
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);

    await prisma.task.update({ where: { id }, data: updateData });

    const updated = await prisma.task.findUnique({
      where: { id },
      include: taskInclude,
    });

    return success(res, formatTask(updated));
  } catch (err) {
    console.error('Update task error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update task' } });
  }
});

// DELETE /tasks/:id — Leader or task creator can delete
tasksRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      return notFound(res, 'Task not found');
    }

    // Allow Leader or the task creator to delete
    if (req.user!.role !== 'Leader' && existing.createdById !== req.user!.sub) {
      return forbidden(res, 'Only the task creator or a Leader can delete this task');
    }

    await prisma.task.delete({ where: { id } });
    return noContent(res);
  } catch (err) {
    console.error('Delete task error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete task' } });
  }
});

// POST /tasks/:id/approve — approval or revision
tasksRouter.post('/:id/approve', requireLeader, validate(ApprovalActionSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, feedback } = req.body;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return notFound(res, 'Task not found');

    if (task.status !== 'Need Review') {
      return badRequest(res, 'Task must be in "Need Review" status to approve/revise');
    }

    const newStatus = action === 'approved' ? 'Approved' : 'Revision';

    await prisma.$transaction(async (tx) => {
      await tx.task.update({ where: { id }, data: { status: newStatus } });

      const logId = await generateId('apr', tx);
      await tx.approvalLog.create({
        data: {
          id: logId,
          taskId: id,
          reviewerId: req.user!.sub,
          action,
          feedback,
        },
      });
    });

    const updated = await prisma.task.findUnique({
      where: { id },
      include: taskInclude,
    });

    // Notify PICs about approval/revision
    const approvalPicIds = updated!.pics.map((p: any) => p.user.id);
    const isApproved = action === 'approved';
    await notifyUsers(approvalPicIds, req.user!.sub, {
      type: isApproved ? 'approval' : 'revision',
      title: isApproved ? 'Task Approved' : 'Task Needs Revision',
      message: isApproved
        ? `Task "${updated!.name}" has been approved`
        : `Task "${updated!.name}" needs revision${feedback ? ': ' + feedback : ''}`,
      taskId: updated!.id,
      activityId: updated!.activityId,
    });

    return success(res, formatTask(updated));
  } catch (err) {
    console.error('Approve task error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to process approval' } });
  }
});

// POST /tasks/:id/revision — submit for revision (PIC action)
tasksRouter.post('/:id/revision', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return notFound(res, 'Task not found');

    await prisma.task.update({ where: { id }, data: { status: 'Need Review' } });

    const updated = await prisma.task.findUnique({
      where: { id },
      include: taskInclude,
    });

    return success(res, formatTask(updated));
  } catch (err) {
    console.error('Submit for review error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to submit for review' } });
  }
});

// POST /tasks/:id/archive
tasksRouter.post('/:id/archive', requireLeader, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return notFound(res, 'Task not found');

    await prisma.task.update({ where: { id }, data: { status: 'Archived' } });

    const updated = await prisma.task.findUnique({
      where: { id },
      include: taskInclude,
    });

    return success(res, formatTask(updated));
  } catch (err) {
    console.error('Archive task error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to archive task' } });
  }
});

// POST /tasks/:id/reopen
tasksRouter.post('/:id/reopen', requireLeader, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return notFound(res, 'Task not found');

    await prisma.task.update({ where: { id }, data: { status: 'In Progress' } });

    const updated = await prisma.task.findUnique({
      where: { id },
      include: taskInclude,
    });

    return success(res, formatTask(updated));
  } catch (err) {
    console.error('Reopen task error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to reopen task' } });
  }
});

// POST /tasks/:taskId/pics — add PIC to task (auto-add to ActivityPic if not member)
tasksRouter.post('/:taskId/pics', validate(TaskPicSchema), async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { userId } = req.body;

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return notFound(res, 'Task not found');

    await prisma.$transaction(async (tx) => {
      await tx.taskPic.create({ data: { taskId, userId } });

      // Auto-add user to ActivityPic if not already a member
      const existingMembership = await tx.activityPic.findUnique({
        where: { activityId_userId: { activityId: task.activityId, userId } },
      });
      if (!existingMembership) {
        await tx.activityPic.create({ data: { activityId: task.activityId, userId } });
      }

      const logId = await generateId('asg', tx);
      await tx.assignmentLog.create({
        data: {
          id: logId,
          taskId,
          changedById: req.user!.sub,
          actionType: 'add',
          affectedUserId: userId,
        },
      });
    });

    const updated = await prisma.task.findUnique({
      where: { id: taskId },
      include: taskInclude,
    });

    // Notify added PIC
    await createNotification({
      userId,
      type: 'taskAssignment',
      title: 'Added to Task',
      message: `You have been added to task "${updated!.name}"`,
      taskId,
      activityId: updated!.activityId,
    });

    return success(res, formatTask(updated));
  } catch (err) {
    console.error('Add task PIC error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to add PIC' } });
  }
});

// DELETE /tasks/:taskId/pics/:userId — remove PIC from task
tasksRouter.delete('/:taskId/pics/:userId', async (req: Request, res: Response) => {
  try {
    const { taskId, userId } = req.params;

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return notFound(res, 'Task not found');

    await prisma.$transaction(async (tx) => {
      await tx.taskPic.delete({
        where: { taskId_userId: { taskId, userId } },
      });

      const logId = await generateId('asg', tx);
      await tx.assignmentLog.create({
        data: {
          id: logId,
          taskId,
          changedById: req.user!.sub,
          actionType: 'remove',
          affectedUserId: userId,
        },
      });
    });

    const updated = await prisma.task.findUnique({
      where: { id: taskId },
      include: taskInclude,
    });

    // Notify removed PIC
    await createNotification({
      userId,
      type: 'reassignment',
      title: 'Removed from Task',
      message: `You have been removed from task "${updated!.name}"`,
      taskId,
      activityId: updated!.activityId,
    });

    return success(res, formatTask(updated));
  } catch (err) {
    console.error('Remove task PIC error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to remove PIC' } });
  }
});
