import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { success, created, notFound, noContent } from '../utils/response';
import { requireAuth } from '../middleware/auth.middleware';
import { requireLeader } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { WhatsappAccountSchema, WhatsappGroupSchema, UpdateWhatsappGroupSchema } from '../schemas/whatsapp.schemas';
import { encrypt, decrypt, maskSensitive } from '../utils/crypto';
import { generateId } from '../services/id.service';
import { checkApiStatus } from '../services/watzap.service';

export const whatsappRouter = Router();

// Public authenticated endpoint — accessible by all logged-in users (no Leader role required)
whatsappRouter.get('/channels', requireAuth, async (_req: Request, res: Response) => {
  try {
    const groups = await prisma.whatsappGroup.findMany({
      select: { type: true, name: true },
      orderBy: { type: 'asc' },
    });
    return success(res, groups);
  } catch (err) {
    console.error('List WhatsApp channels error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list channels' } });
  }
});

// All routes below require Leader role
whatsappRouter.use(requireAuth, requireLeader);

// GET /whatsapp/account
whatsappRouter.get('/account', async (_req: Request, res: Response) => {
  try {
    const account = await prisma.whatsappAccount.findUnique({
      where: { id: 'default' },
    });

    if (!account) {
      return success(res, null);
    }

    const apiKey = decrypt(account.apiKeyEncrypted);

    return success(res, {
      apiKey: maskSensitive(apiKey),
      phoneNumber: account.phoneNumber,
      connectionStatus: account.connectionStatus,
      lastTestedAt: account.lastTestedAt?.toISOString() ?? null,
    });
  } catch (err) {
    console.error('Get WhatsApp account error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get account' } });
  }
});

// PUT /whatsapp/account
whatsappRouter.put('/account', validate(WhatsappAccountSchema), async (req: Request, res: Response) => {
  try {
    const { apiKey, phoneNumber } = req.body;

    const apiKeyEncrypted = encrypt(apiKey);

    const account = await prisma.whatsappAccount.upsert({
      where: { id: 'default' },
      update: { apiKeyEncrypted, phoneNumber },
      create: { id: 'default', apiKeyEncrypted, phoneNumber },
    });

    return success(res, {
      apiKey: maskSensitive(apiKey),
      phoneNumber: account.phoneNumber,
      connectionStatus: account.connectionStatus,
      lastTestedAt: account.lastTestedAt?.toISOString() ?? null,
    });
  } catch (err) {
    console.error('Update WhatsApp account error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update account' } });
  }
});

// POST /whatsapp/test
whatsappRouter.post('/test', async (_req: Request, res: Response) => {
  try {
    const result = await checkApiStatus();

    const connectionStatus = result.status ? 'Connected' : 'Disconnected';

    await prisma.whatsappAccount.update({
      where: { id: 'default' },
      data: {
        connectionStatus,
        lastTestedAt: new Date(),
      },
    });

    return success(res, { status: connectionStatus, message: result.message });
  } catch (err) {
    // On error, mark as disconnected
    try {
      await prisma.whatsappAccount.update({
        where: { id: 'default' },
        data: {
          connectionStatus: 'Disconnected',
          lastTestedAt: new Date(),
        },
      });
    } catch { /* ignore update error */ }

    console.error('Test WhatsApp error:', err);
    return success(res, { status: 'Disconnected', message: err instanceof Error ? err.message : 'Connection test failed' });
  }
});

// GET /whatsapp/groups
whatsappRouter.get('/groups', async (_req: Request, res: Response) => {
  try {
    const groups = await prisma.whatsappGroup.findMany({
      orderBy: { createdAt: 'asc' },
    });

    const data = groups.map((g) => ({
      id: g.id,
      name: g.name,
      groupId: maskSensitive(decrypt(g.groupIdEncrypted), 8),
      type: g.type,
      memberCount: g.memberCount,
      lastMessageSentAt: g.lastMessageSentAt?.toISOString() ?? null,
      connectionStatus: g.connectionStatus,
    }));

    return success(res, data);
  } catch (err) {
    console.error('List WhatsApp groups error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list groups' } });
  }
});

// POST /whatsapp/groups
whatsappRouter.post('/groups', validate(WhatsappGroupSchema), async (req: Request, res: Response) => {
  try {
    const { name, groupId, type } = req.body;
    const id = await generateId('wg');

    const group = await prisma.whatsappGroup.create({
      data: {
        id,
        name,
        groupIdEncrypted: encrypt(groupId),
        type,
      },
    });

    return created(res, {
      id: group.id,
      name: group.name,
      groupId: maskSensitive(groupId, 8),
      type: group.type,
      memberCount: group.memberCount,
      lastMessageSentAt: null,
      connectionStatus: group.connectionStatus,
    });
  } catch (err) {
    console.error('Create WhatsApp group error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create group' } });
  }
});

// PATCH /whatsapp/groups/:id
whatsappRouter.patch('/groups/:id', validate(UpdateWhatsappGroupSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, groupId, type } = req.body;

    const existing = await prisma.whatsappGroup.findUnique({ where: { id } });
    if (!existing) return notFound(res, 'WhatsApp group not found');

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (groupId) updateData.groupIdEncrypted = encrypt(groupId);
    if (type) updateData.type = type;

    const group = await prisma.whatsappGroup.update({
      where: { id },
      data: updateData,
    });

    const decryptedGroupId = decrypt(group.groupIdEncrypted);

    return success(res, {
      id: group.id,
      name: group.name,
      groupId: maskSensitive(decryptedGroupId, 8),
      type: group.type,
      memberCount: group.memberCount,
      lastMessageSentAt: group.lastMessageSentAt?.toISOString() ?? null,
      connectionStatus: group.connectionStatus,
    });
  } catch (err) {
    console.error('Update WhatsApp group error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update group' } });
  }
});

// DELETE /whatsapp/groups/:id
whatsappRouter.delete('/groups/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.whatsappGroup.findUnique({ where: { id } });
    if (!existing) return notFound(res, 'WhatsApp group not found');

    await prisma.whatsappGroup.delete({ where: { id } });
    return noContent(res);
  } catch (err) {
    console.error('Delete WhatsApp group error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete group' } });
  }
});
