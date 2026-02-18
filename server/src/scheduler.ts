import cron from 'node-cron';
import { processAllReminders } from './services/reminder.service';

export function startScheduler(): void {
  // Daily reminders at 08:00 AM
  cron.schedule('0 8 * * *', async () => {
    try {
      await processAllReminders();
    } catch (err) {
      console.error('[Scheduler] Reminder job failed:', err);
    }
  });

  console.log('[Scheduler] Cron jobs registered (daily reminders at 08:00)');
}
