import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { success, created, notFound, noContent } from '../utils/response';
import { requireAuth } from '../middleware/auth.middleware';
import { requireLeader } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { CreateActivitySchema, UpdateActivitySchema } from '../schemas/activity.schemas';
import { generateId } from '../services/id.service';
import { Decimal } from '@prisma/client/runtime/library';
import { notifyUsers } from '../services/notification.service';

export const activitiesRouter = Router();

activitiesRouter.use(requireAuth);

const activityInclude = {
  activityType: { select: { id: true, name: true, color: true } },
  pics: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
  approvers: { include: { user: { select: { id: true, name: true } } } },
} as const;

function formatActivity(a: any) {
  return {
    id: a.id,
    name: a.name,
    description: a.description,
    activityType: a.activityType,
    status: a.status,
    startDate: a.startDate.toISOString().split('T')[0],
    endDate: a.endDate.toISOString().split('T')[0],
    requiresBudget: a.requiresBudget,
    estimatedBudget: a.estimatedBudget ? Number(a.estimatedBudget) : null,
    spentBudget: a.spentBudget ? Number(a.spentBudget) : null,
    currency: a.currency,
    pics: a.pics?.map((p: any) => p.user) ?? [],
    approvers: a.approvers?.map((ap: any) => ap.user) ?? [],
    createdAt: a.createdAt.toISOString(),
  };
}

// GET /activities
activitiesRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const activities = await prisma.activity.findMany({
      include: {
        ...activityInclude,
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = activities.map((a: any) => ({
      ...formatActivity(a),
      taskCount: a._count.tasks,
    }));

    return success(res, data);
  } catch (err) {
    console.error('List activities error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list activities' } });
  }
});

// GET /activities/:id
activitiesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const activity: any = await prisma.activity.findUnique({
      where: { id: req.params.id },
      include: {
        ...activityInclude,
        tasks: {
          select: { id: true, name: true, status: true, priority: true, startDate: true, endDate: true },
        },
        reminders: true,
      },
    });

    if (!activity) {
      return notFound(res, 'Activity not found');
    }

    return success(res, {
      ...formatActivity(activity),
      budgetNeededDate: activity.budgetNeededDate?.toISOString().split('T')[0] ?? null,
      tasks: activity.tasks.map((t: any) => ({
        ...t,
        startDate: t.startDate.toISOString().split('T')[0],
        endDate: t.endDate.toISOString().split('T')[0],
      })),
      reminders: activity.reminders,
    });
  } catch (err) {
    console.error('Get activity error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get activity' } });
  }
});

// POST /activities
activitiesRouter.post('/', requireLeader, validate(CreateActivitySchema), async (req: Request, res: Response) => {
  try {
    const { name, activityTypeId, startDate, endDate, description, picIds, approverIds, requiresBudget, estimatedBudget, budgetNeededDate, reminders } = req.body;

    const activity = await prisma.$transaction(async (tx) => {
      const id = await generateId('act', tx);

      const newActivity = await tx.activity.create({
        data: {
          id,
          name,
          activityTypeId,
          description,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          requiresBudget,
          estimatedBudget: estimatedBudget ? new Decimal(estimatedBudget) : null,
          budgetNeededDate: budgetNeededDate ? new Date(budgetNeededDate) : null,
        },
      });

      if (picIds?.length) {
        await tx.activityPic.createMany({
          data: picIds.map((userId: string) => ({ activityId: id, userId })),
        });
      }

      if (approverIds?.length) {
        await tx.activityApprover.createMany({
          data: approverIds.map((userId: string) => ({ activityId: id, userId })),
        });
      }

      if (reminders?.length) {
        for (const rem of reminders) {
          const remId = await generateId('rem', tx);
          await tx.reminder.create({
            data: {
              id: remId,
              activityId: id,
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

      // Auto-create Finance reminder when activity has budget
      if (requiresBudget) {
        const financeRemId = await generateId('rem', tx);
        const budgetDate = budgetNeededDate ? new Date(budgetNeededDate) : new Date(endDate);
        const budgetStr = estimatedBudget ? `Rp ${Number(estimatedBudget).toLocaleString('id-ID')}` : 'TBD';
        await tx.reminder.create({
          data: {
            id: financeRemId,
            activityId: id,
            trigger: 'H-7',
            channel: 'Marketing-Finance',
            customMessage: `[Budget Reminder] Activity "${name}" membutuhkan budget sebesar ${budgetStr}. Deadline budget: ${budgetDate.toISOString().split('T')[0]}. PIC: {{pic_name}}. Status: {{status}}.`,
            enabled: true,
          },
        });
      }

      return newActivity;
    });

    const full: any = await prisma.activity.findUnique({
      where: { id: activity.id },
      include: activityInclude,
    });

    // Notify assigned PICs
    if (picIds?.length) {
      await notifyUsers(picIds, req.user!.sub, {
        type: 'taskAssignment',
        title: 'Assigned to Activity',
        message: `You have been assigned to activity "${full.name}"`,
        activityId: full.id,
      });
    }

    return created(res, formatActivity(full));
  } catch (err) {
    console.error('Create activity error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create activity' } });
  }
});

// PATCH /activities/:id
activitiesRouter.patch('/:id', requireLeader, validate(UpdateActivitySchema), async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { picIds, approverIds, startDate, endDate, budgetNeededDate, estimatedBudget, spentBudget, ...rest } = req.body;

    const existing = await prisma.activity.findUnique({ where: { id } });
    if (!existing) {
      return notFound(res, 'Activity not found');
    }

    await prisma.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = { ...rest };
      if (startDate) updateData.startDate = new Date(startDate);
      if (endDate) updateData.endDate = new Date(endDate);
      if (budgetNeededDate !== undefined) updateData.budgetNeededDate = budgetNeededDate ? new Date(budgetNeededDate) : null;
      if (estimatedBudget !== undefined) updateData.estimatedBudget = estimatedBudget ? new Decimal(estimatedBudget) : null;
      if (spentBudget !== undefined) updateData.spentBudget = spentBudget ? new Decimal(spentBudget) : null;

      await tx.activity.update({ where: { id }, data: updateData });

      if (picIds) {
        await tx.activityPic.deleteMany({ where: { activityId: id } });
        if (picIds.length) {
          await tx.activityPic.createMany({
            data: picIds.map((userId: string) => ({ activityId: id, userId })),
          });
        }
      }

      if (approverIds) {
        await tx.activityApprover.deleteMany({ where: { activityId: id } });
        if (approverIds.length) {
          await tx.activityApprover.createMany({
            data: approverIds.map((userId: string) => ({ activityId: id, userId })),
          });
        }
      }

      // Auto-create Finance reminder if budget just enabled and no finance reminder exists
      if (rest.requiresBudget === true && !existing.requiresBudget) {
        const existingFinanceReminder = await tx.reminder.findFirst({
          where: { activityId: id, channel: 'Marketing-Finance' },
        });
        if (!existingFinanceReminder) {
          const financeRemId = await generateId('rem', tx);
          const budgetDate = budgetNeededDate ? new Date(budgetNeededDate) : (existing.budgetNeededDate || existing.endDate);
          const budgetAmt = estimatedBudget ?? (existing.estimatedBudget ? Number(existing.estimatedBudget) : null);
          const budgetStr = budgetAmt ? `Rp ${Number(budgetAmt).toLocaleString('id-ID')}` : 'TBD';
          await tx.reminder.create({
            data: {
              id: financeRemId,
              activityId: id,
              trigger: 'H-7',
              channel: 'Marketing-Finance',
              customMessage: `[Budget Reminder] Activity "${existing.name}" membutuhkan budget sebesar ${budgetStr}. Deadline budget: ${budgetDate.toISOString().split('T')[0]}. PIC: {{pic_name}}. Status: {{status}}.`,
              enabled: true,
            },
          });
        }
      }
    });

    const updated: any = await prisma.activity.findUnique({
      where: { id },
      include: activityInclude,
    });

    return success(res, formatActivity(updated));
  } catch (err) {
    console.error('Update activity error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update activity' } });
  }
});

// DELETE /activities/:id
activitiesRouter.delete('/:id', requireLeader, async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const existing = await prisma.activity.findUnique({ where: { id } });
    if (!existing) {
      return notFound(res, 'Activity not found');
    }

    await prisma.activity.delete({ where: { id } });
    return noContent(res);
  } catch (err) {
    console.error('Delete activity error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete activity' } });
  }
});
