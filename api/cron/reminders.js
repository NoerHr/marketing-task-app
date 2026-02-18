import reminderService from '../../server/dist/services/reminder.service.js';

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  try {
    await reminderService.processAllReminders();
    return res.json({ ok: true, message: 'Reminders processed' });
  } catch (err) {
    console.error('[Cron] Reminder processing failed:', err);
    return res.status(500).json({ ok: false, error: 'Failed to process reminders' });
  }
}
