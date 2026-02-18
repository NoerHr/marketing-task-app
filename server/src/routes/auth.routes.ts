import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { success, badRequest, unauthorized, notFound } from '../utils/response';
import { validate } from '../middleware/validate.middleware';
import { LoginSchema, RegisterSchema, ForgotPasswordSchema, ResetPasswordSchema } from '../schemas/auth.schemas';
import { signAccessToken, signRefreshToken, verifyRefreshToken, hashPassword, comparePassword } from '../services/auth.service';
import { generateId } from '../services/id.service';
import { sendPasswordResetEmail } from '../services/email.service';
import crypto from 'crypto';

export const authRouter = Router();

// POST /auth/login
authRouter.post('/login', validate(LoginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return unauthorized(res, 'Invalid email or password');
    }

    if (user.status === 'Deactivated') {
      return unauthorized(res, 'Account has been deactivated');
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return unauthorized(res, 'Invalid email or password');
    }

    const payload = { sub: user.id, role: user.role, isSuperAdmin: user.isSuperAdmin };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Update last active
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth',
    });

    return success(res, {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Login failed' } });
  }
});

// POST /auth/register
authRouter.post('/register', validate(RegisterSchema), async (req: Request, res: Response) => {
  try {
    const { email, fullName, password, inviteToken } = req.body;

    // Verify invite token
    const invite = await prisma.invite.findUnique({ where: { token: inviteToken } });
    if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
      return badRequest(res, 'Invalid or expired invite token');
    }

    if (invite.email !== email) {
      return badRequest(res, 'Email does not match invite');
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return badRequest(res, 'User with this email already exists');
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.$transaction(async (tx) => {
      const id = await generateId('usr', tx);
      const newUser = await tx.user.create({
        data: {
          id,
          name: fullName,
          email,
          passwordHash,
          role: invite.role,
        },
      });

      await tx.invite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      });

      return newUser;
    });

    const payload = { sub: user.id, role: user.role, isSuperAdmin: user.isSuperAdmin };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });

    return success(res, {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
        avatarUrl: user.avatarUrl,
      },
    }, 201);
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Registration failed' } });
  }
});

// POST /auth/logout
authRouter.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('refreshToken', { path: '/api/auth' });
  return success(res, { message: 'Logged out' });
});

// POST /auth/refresh
authRouter.post('/refresh', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) {
      return unauthorized(res, 'No refresh token provided');
    }

    const payload = verifyRefreshToken(token);

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status === 'Deactivated') {
      return unauthorized(res, 'User not found or deactivated');
    }

    const newPayload = { sub: user.id, role: user.role, isSuperAdmin: user.isSuperAdmin };
    const accessToken = signAccessToken(newPayload);
    const refreshToken = signRefreshToken(newPayload);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });

    return success(res, { accessToken });
  } catch (err) {
    return unauthorized(res, 'Invalid refresh token');
  }
});

// POST /auth/forgot-password
authRouter.post('/forgot-password', validate(ForgotPasswordSchema), async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      });
      sendPasswordResetEmail({ to: email, token, expiresAt });
    }

    // Always return success to prevent email enumeration
    return success(res, { message: 'If the email exists, a reset link has been sent' });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to process request' } });
  }
});

// POST /auth/reset-password
authRouter.post('/reset-password', validate(ResetPasswordSchema), async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return badRequest(res, 'Invalid or expired reset token');
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return success(res, { message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to reset password' } });
  }
});

// GET /auth/invite/:token
authRouter.get('/invite/:token', async (req: Request, res: Response) => {
  try {
    const invite = await prisma.invite.findUnique({
      where: { token: req.params.token },
      include: { invitedBy: { select: { name: true } } },
    });

    if (!invite) {
      return notFound(res, 'Invite not found');
    }

    return success(res, {
      teamName: 'Marketing Team',
      invitedEmail: invite.email,
      invitedByName: invite.invitedBy.name,
      isValid: !invite.usedAt && invite.expiresAt > new Date(),
      expiresAt: invite.expiresAt.toISOString(),
    });
  } catch (err) {
    console.error('Invite lookup error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to look up invite' } });
  }
});
