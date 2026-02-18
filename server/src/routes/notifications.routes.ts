import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { success, notFound, forbidden } from '../utils/response';
import { requireAuth } from '../middleware/auth.middleware';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

// GET /notifications
notificationsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.sub },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return success(res, notifications.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    })));
  } catch (err) {
    console.error('List notifications error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list notifications' } });
  }
});

// PATCH /notifications/:id/read
notificationsRouter.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id },
    });

    if (!notification) {
      return notFound(res, 'Notification not found');
    }

    if (notification.userId !== req.user!.sub) {
      return forbidden(res, 'Cannot mark another user\'s notification as read');
    }

    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });

    return success(res, {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    console.error('Mark notification read error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to mark notification as read' } });
  }
});

// POST /notifications/mark-all-read
// BUG FIX: Frontend calls POST /api/notifications/mark-all-read
notificationsRouter.post('/mark-all-read', async (req: Request, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.sub, isRead: false },
      data: { isRead: true },
    });

    return success(res, { message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Mark all notifications read error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to mark all notifications as read' } });
  }
});
