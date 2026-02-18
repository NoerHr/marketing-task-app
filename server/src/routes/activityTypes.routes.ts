import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { success, created, notFound, conflict, noContent } from '../utils/response';
import { requireAuth } from '../middleware/auth.middleware';
import { requireLeader } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { CreateActivityTypeSchema, UpdateActivityTypeSchema } from '../schemas/activityType.schemas';
import { generateId } from '../services/id.service';

export const activityTypesRouter = Router();

activityTypesRouter.use(requireAuth);

// GET /activity-types
activityTypesRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const types = await prisma.activityType.findMany({
      include: { _count: { select: { activities: true } } },
      orderBy: { createdAt: 'asc' },
    });

    const data = types.map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color,
      icon: t.icon,
      usedByCount: t._count.activities,
      createdAt: t.createdAt.toISOString(),
    }));

    return success(res, data);
  } catch (err) {
    console.error('List activity types error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list activity types' } });
  }
});

// POST /activity-types
activityTypesRouter.post('/', requireLeader, validate(CreateActivityTypeSchema), async (req: Request, res: Response) => {
  try {
    const { name, color, icon } = req.body;

    const existing = await prisma.activityType.findUnique({ where: { name } });
    if (existing) {
      return conflict(res, 'Activity type with this name already exists');
    }

    const id = await generateId('at');
    const activityType = await prisma.activityType.create({
      data: { id, name, color, icon: icon ?? null },
    });

    return created(res, {
      id: activityType.id,
      name: activityType.name,
      color: activityType.color,
      icon: activityType.icon,
      usedByCount: 0,
      createdAt: activityType.createdAt.toISOString(),
    });
  } catch (err) {
    console.error('Create activity type error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create activity type' } });
  }
});

// PUT /activity-types/:id
activityTypesRouter.put('/:id', requireLeader, validate(UpdateActivityTypeSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.activityType.findUnique({ where: { id } });
    if (!existing) {
      return notFound(res, 'Activity type not found');
    }

    const activityType = await prisma.activityType.update({
      where: { id },
      data: req.body,
      include: { _count: { select: { activities: true } } },
    });

    return success(res, {
      id: activityType.id,
      name: activityType.name,
      color: activityType.color,
      icon: activityType.icon,
      usedByCount: activityType._count.activities,
      createdAt: activityType.createdAt.toISOString(),
    });
  } catch (err) {
    console.error('Update activity type error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update activity type' } });
  }
});

// DELETE /activity-types/:id
activityTypesRouter.delete('/:id', requireLeader, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.activityType.findUnique({
      where: { id },
      include: { _count: { select: { activities: true } } },
    });

    if (!existing) {
      return notFound(res, 'Activity type not found');
    }

    if (existing._count.activities > 0) {
      return conflict(res, 'Cannot delete activity type that is in use');
    }

    await prisma.activityType.delete({ where: { id } });
    return noContent(res);
  } catch (err) {
    console.error('Delete activity type error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete activity type' } });
  }
});
