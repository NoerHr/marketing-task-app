import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { success, created, notFound, noContent } from '../utils/response';
import { requireAuth } from '../middleware/auth.middleware';
import { requireLeader } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { CreateTemplateSchema, UpdateTemplateSchema } from '../schemas/messageTemplate.schemas';
import { generateId } from '../services/id.service';

export const messageTemplatesRouter = Router();

messageTemplatesRouter.use(requireAuth);

// GET /message-templates
messageTemplatesRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const templates = await prisma.messageTemplate.findMany({
      orderBy: { createdAt: 'asc' },
    });

    // Count how many reminders reference each template
    const reminderCounts = await prisma.reminder.groupBy({
      by: ['templateId'],
      _count: { templateId: true },
    });

    const countMap = new Map(
      reminderCounts
        .filter((r) => r.templateId)
        .map((r) => [r.templateId!, r._count.templateId])
    );

    const data = templates.map((t) => ({
      id: t.id,
      name: t.name,
      body: t.body,
      placeholders: t.placeholders,
      usedByCount: countMap.get(t.id) || 0,
      createdAt: t.createdAt.toISOString(),
    }));

    return success(res, data);
  } catch (err) {
    console.error('List templates error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list templates' } });
  }
});

// GET /message-templates/placeholders
messageTemplatesRouter.get('/placeholders', (_req: Request, res: Response) => {
  return success(res, [
    { key: 'activity_name', label: 'Activity Name', example: 'Ramadan Campaign 2026' },
    { key: 'task_name', label: 'Task Name', example: 'Final edit product video' },
    { key: 'deadline', label: 'Deadline', example: 'Feb 20, 2026' },
    { key: 'pic_name', label: 'PIC Name', example: 'Dina Rahma' },
    { key: 'status', label: 'Status', example: 'In Progress' },
    { key: 'approver_name', label: 'Approver Name', example: 'Alex Morgan' },
    { key: 'activity_type', label: 'Activity Type', example: 'IG Campaign' },
  ]);
});

// POST /message-templates
messageTemplatesRouter.post('/', requireLeader, validate(CreateTemplateSchema), async (req: Request, res: Response) => {
  try {
    const { name, body, placeholders } = req.body;
    const id = await generateId('mt');

    const template = await prisma.messageTemplate.create({
      data: { id, name, body, placeholders },
    });

    return created(res, {
      id: template.id,
      name: template.name,
      body: template.body,
      placeholders: template.placeholders,
      usedByCount: 0,
      createdAt: template.createdAt.toISOString(),
    });
  } catch (err) {
    console.error('Create template error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create template' } });
  }
});

// PATCH /message-templates/:id
messageTemplatesRouter.patch('/:id', requireLeader, validate(UpdateTemplateSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.messageTemplate.findUnique({ where: { id } });
    if (!existing) return notFound(res, 'Template not found');

    const updateData: Record<string, unknown> = {};
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.body) {
      updateData.body = req.body.body;
      updateData.placeholders = req.body.placeholders;
    }

    const template = await prisma.messageTemplate.update({
      where: { id },
      data: updateData,
    });

    return success(res, {
      id: template.id,
      name: template.name,
      body: template.body,
      placeholders: template.placeholders,
      createdAt: template.createdAt.toISOString(),
    });
  } catch (err) {
    console.error('Update template error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update template' } });
  }
});

// DELETE /message-templates/:id
messageTemplatesRouter.delete('/:id', requireLeader, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.messageTemplate.findUnique({ where: { id } });
    if (!existing) return notFound(res, 'Template not found');

    await prisma.messageTemplate.delete({ where: { id } });
    return noContent(res);
  } catch (err) {
    console.error('Delete template error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete template' } });
  }
});
