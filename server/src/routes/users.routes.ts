import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { success, created, notFound, conflict, badRequest } from '../utils/response';
import { requireAuth } from '../middleware/auth.middleware';
import { requireLeader, requireSuperAdmin } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { InviteUserSchema, UpdateUserSchema } from '../schemas/user.schemas';
import { sendInviteEmail } from '../services/email.service';
import crypto from 'crypto';

export const usersRouter = Router();

usersRouter.use(requireAuth);

// GET /users
usersRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        isSuperAdmin: true,
        status: true,
        lastActiveAt: true,
      },
      orderBy: { name: 'asc' },
    });

    const data = users.map((u) => ({
      ...u,
      lastActiveAt: u.lastActiveAt.toISOString(),
    }));

    return success(res, data);
  } catch (err) {
    console.error('List users error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list users' } });
  }
});

// GET /users/:id
usersRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        isSuperAdmin: true,
        status: true,
        lastActiveAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      return notFound(res, 'User not found');
    }

    return success(res, {
      ...user,
      lastActiveAt: user.lastActiveAt.toISOString(),
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    console.error('Get user error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get user' } });
  }
});

// POST /users/invite
usersRouter.post('/invite', requireLeader, validate(InviteUserSchema), async (req: Request, res: Response) => {
  try {
    const { email, name, role, isSuperAdmin } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return conflict(res, 'User with this email already exists');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const invite = await prisma.invite.create({
      data: {
        email,
        role,
        token,
        invitedById: req.user!.sub,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Fetch inviter name for the email
    const inviter = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      select: { name: true },
    });

    sendInviteEmail({
      to: email,
      token,
      role,
      invitedByName: inviter?.name ?? 'Team Admin',
      expiresAt: invite.expiresAt,
    });

    return created(res, {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt.toISOString(),
    });
  } catch (err) {
    console.error('Invite user error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to invite user' } });
  }
});

// PATCH /users/:id
usersRouter.patch('/:id', requireLeader, validate(UpdateUserSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return notFound(res, 'User not found');
    }

    // Only super admins can grant super admin
    if (req.body.isSuperAdmin && !req.user!.isSuperAdmin) {
      return badRequest(res, 'Only super admins can grant super admin access');
    }

    const user = await prisma.user.update({
      where: { id },
      data: req.body,
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        isSuperAdmin: true,
        status: true,
        lastActiveAt: true,
      },
    });

    return success(res, {
      ...user,
      lastActiveAt: user.lastActiveAt.toISOString(),
    });
  } catch (err) {
    console.error('Update user error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update user' } });
  }
});

// POST /users/:id/deactivate
usersRouter.post('/:id/deactivate', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (id === req.user!.sub) {
      return badRequest(res, 'Cannot deactivate yourself');
    }

    const user = await prisma.user.update({
      where: { id },
      data: { status: 'Deactivated' },
      select: { id: true, name: true, status: true },
    });

    return success(res, user);
  } catch (err) {
    console.error('Deactivate user error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to deactivate user' } });
  }
});

// POST /users/:id/reactivate
usersRouter.post('/:id/reactivate', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.update({
      where: { id },
      data: { status: 'Active' },
      select: { id: true, name: true, status: true },
    });

    return success(res, user);
  } catch (err) {
    console.error('Reactivate user error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to reactivate user' } });
  }
});
