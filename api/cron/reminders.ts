// Vercel Cron Job endpoint — runs daily at 08:00 WIB (01:00 UTC)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { processAllReminders } from '../../server/src/services/reminder.service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify cron secret (Vercel sends this header automatically for cron jobs)
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  try {
    await processAllReminders();
    return res.json({ ok: true, message: 'Reminders processed' });
  } catch (err) {
    console.error('[Cron] Reminder processing failed:', err);
    return res.status(500).json({ ok: false, error: 'Failed to process reminders' });
  }
}
