import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { success, notFound } from '../utils/response';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { ProfileUpdateSchema } from '../schemas/user.schemas';

export const meRouter = Router();

meRouter.use(requireAuth);

// GET /me
meRouter.get('/', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        isSuperAdmin: true,
        notificationPreferences: true,
        status: true,
        lastActiveAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      return notFound(res, 'User not found');
    }

    // Ensure all notification preferences default to true for existing users with empty/partial prefs
    const defaultPrefs = { taskAssignment: true, approval: true, revision: true, reassignment: true, deadlineAlert: true };
    const prefs = typeof user.notificationPreferences === 'object' && user.notificationPreferences !== null
      ? user.notificationPreferences as Record<string, boolean>
      : {};
    const merged = { ...defaultPrefs, ...prefs };

    return success(res, { ...user, notificationPreferences: merged });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get profile' } });
  }
});

// PATCH /me
meRouter.patch('/', validate(ProfileUpdateSchema), async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.user!.sub },
      data: req.body,
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        isSuperAdmin: true,
        notificationPreferences: true,
      },
    });

    return success(res, user);
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update profile' } });
  }
});
