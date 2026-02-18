import { prisma } from '../utils/prisma';
import { decrypt } from '../utils/crypto';
import { sendGroupMessage } from './watzap.service';
import { createNotification } from './notification.service';

const WA_DELAY_MS = 90_000; // 90 seconds between WA messages

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function diffDays(endDate: Date, today: Date): number {
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  return Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function shouldTrigger(trigger: string, customDays: number | null, endDate: Date, today: Date): boolean {
  const diff = diffDays(endDate, today);
  switch (trigger) {
    case 'H-7': return diff === 7;
    case 'H-3': return diff === 3;
    case 'H-1': return diff === 1;
    case 'Day-H': return diff === 0;
    case 'Custom': return customDays != null && diff === customDays;
    default: return false;
  }
}

function renderTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
}

async function resolveWhatsappGroup(channel: string): Promise<{ groupId: string; dbId: string } | null> {
  // Try exact match first, then partial match
  let group = await prisma.whatsappGroup.findFirst({
    where: { type: channel },
  });

  if (!group) {
    // Fallback: find group whose type contains the channel name
    group = await prisma.whatsappGroup.findFirst({
      where: { type: { contains: channel } },
    });
  }

  if (!group) return null;

  return {
    groupId: decrypt(group.groupIdEncrypted),
    dbId: group.id,
  };
}

interface WaQueueItem {
  groupId: string;
  dbId: string;
  message: string;
  label: string;
}

async function collectActivityReminders(today: Date): Promise<WaQueueItem[]> {
  const waQueue: WaQueueItem[] = [];

  const reminders = await prisma.reminder.findMany({
    where: { enabled: true },
    include: {
      activity: {
        include: {
          activityType: { select: { name: true } },
          pics: { include: { user: { select: { id: true, name: true } } } },
          approvers: { include: { user: { select: { id: true, name: true } } } },
        },
      },
    },
  });

  for (const reminder of reminders) {
    const activity = reminder.activity;

    // Skip completed/cancelled/archived activities
    if (['Completed', 'Cancelled', 'Archived'].includes(activity.status)) continue;

    if (!shouldTrigger(reminder.trigger, reminder.customDays, activity.endDate, today)) continue;

    const picNames = activity.pics.map((p) => p.user.name).join(', ') || '-';
    const approverNames = activity.approvers.map((a) => a.user.name).join(', ') || '-';

    const templateVars: Record<string, string> = {
      activity_name: activity.name,
      deadline: activity.endDate.toISOString().split('T')[0],
      pic_name: picNames,
      status: activity.status,
      activity_type: activity.activityType.name,
      approver_name: approverNames,
      task_name: '',
    };

    // Build message
    let message: string;
    if (reminder.customMessage) {
      message = renderTemplate(reminder.customMessage, templateVars);
    } else if (reminder.templateId) {
      const template = await prisma.messageTemplate.findUnique({ where: { id: reminder.templateId } });
      message = template ? renderTemplate(template.body, templateVars) : `Reminder: Activity "${activity.name}" deadline is ${activity.endDate.toISOString().split('T')[0]}`;
    } else {
      message = `Reminder: Activity "${activity.name}" deadline is ${activity.endDate.toISOString().split('T')[0]}. Status: ${activity.status}. PICs: ${picNames}`;
    }

    // Queue WhatsApp message
    const waGroup = await resolveWhatsappGroup(reminder.channel);
    if (waGroup) {
      waQueue.push({
        groupId: waGroup.groupId,
        dbId: waGroup.dbId,
        message,
        label: `Activity "${activity.name}" → ${reminder.channel}`,
      });
    } else {
      console.warn(`[Reminder] No WhatsApp group found for channel: ${reminder.channel}`);
    }

    // Create in-app notifications immediately (no rate limit)
    for (const pic of activity.pics) {
      await createNotification({
        userId: pic.user.id,
        type: 'deadlineAlert',
        title: 'Deadline Reminder',
        message: `Activity "${activity.name}" deadline: ${activity.endDate.toISOString().split('T')[0]}`,
        activityId: activity.id,
      });
    }
  }

  return waQueue;
}

async function collectTaskReminders(today: Date): Promise<WaQueueItem[]> {
  const waQueue: WaQueueItem[] = [];

  const reminders = await prisma.taskReminder.findMany({
    where: { enabled: true },
    include: {
      task: {
        include: {
          activity: {
            include: {
              activityType: { select: { name: true } },
            },
          },
          pics: { include: { user: { select: { id: true, name: true } } } },
          approvers: { include: { user: { select: { id: true, name: true } } } },
        },
      },
    },
  });

  for (const reminder of reminders) {
    const task = reminder.task;

    // Skip archived or approved tasks
    if (['Archived', 'Approved'].includes(task.status)) continue;

    if (!shouldTrigger(reminder.trigger, reminder.customDays, task.endDate, today)) continue;

    const picNames = task.pics.map((p) => p.user.name).join(', ') || '-';
    const approverNames = task.approvers.map((a) => a.user.name).join(', ') || '-';

    const templateVars: Record<string, string> = {
      task_name: task.name,
      activity_name: task.activity.name,
      deadline: task.endDate.toISOString().split('T')[0],
      pic_name: picNames,
      status: task.status,
      activity_type: task.activity.activityType.name,
      approver_name: approverNames,
    };

    // Build message
    let message: string;
    if (reminder.customMessage) {
      message = renderTemplate(reminder.customMessage, templateVars);
    } else if (reminder.templateId) {
      const template = await prisma.messageTemplate.findUnique({ where: { id: reminder.templateId } });
      message = template ? renderTemplate(template.body, templateVars) : `Reminder: Task "${task.name}" deadline is ${task.endDate.toISOString().split('T')[0]}`;
    } else {
      message = `Reminder: Task "${task.name}" (${task.activity.name}) deadline is ${task.endDate.toISOString().split('T')[0]}. Status: ${task.status}. PICs: ${picNames}`;
    }

    // Queue WhatsApp message
    const waGroup = await resolveWhatsappGroup(reminder.channel);
    if (waGroup) {
      waQueue.push({
        groupId: waGroup.groupId,
        dbId: waGroup.dbId,
        message,
        label: `Task "${task.name}" → ${reminder.channel}`,
      });
    } else {
      console.warn(`[Reminder] No WhatsApp group found for channel: ${reminder.channel}`);
    }

    // Create in-app notifications immediately (no rate limit)
    for (const pic of task.pics) {
      await createNotification({
        userId: pic.user.id,
        type: 'deadlineAlert',
        title: 'Deadline Reminder',
        message: `Task "${task.name}" deadline: ${task.endDate.toISOString().split('T')[0]}`,
        taskId: task.id,
        activityId: task.activityId,
      });
    }
  }

  return waQueue;
}

export async function processAllReminders(): Promise<void> {
  const today = startOfToday();
  console.log(`[Reminder] Processing reminders for ${today.toISOString().split('T')[0]}`);

  // Collect all WA messages (in-app notifications sent immediately during collection)
  const waQueue: WaQueueItem[] = [
    ...await collectActivityReminders(today),
    ...await collectTaskReminders(today),
  ];

  console.log(`[Reminder] ${waQueue.length} WA messages to send`);

  // Send WA messages sequentially with 90s delay between each
  for (let i = 0; i < waQueue.length; i++) {
    const item = waQueue[i];
    try {
      await sendGroupMessage(item.groupId, item.message);
      await prisma.whatsappGroup.update({
        where: { id: item.dbId },
        data: { lastMessageSentAt: new Date() },
      });
      console.log(`[Reminder] [${i + 1}/${waQueue.length}] Sent: ${item.label}`);
    } catch (err) {
      console.error(`[Reminder] Failed: ${item.label}`, err);
    }

    // Wait 90s before next message (skip delay after last)
    if (i < waQueue.length - 1) {
      console.log(`[Reminder] Waiting 90s before next message...`);
      await sleep(WA_DELAY_MS);
    }
  }

  console.log('[Reminder] Done processing reminders');
}
