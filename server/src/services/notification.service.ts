import { prisma } from '../utils/prisma';
import { generateId } from './id.service';

interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  message: string;
  taskId?: string;
  activityId?: string;
}

const typeToPreferenceKey: Record<string, string> = {
  taskAssignment: 'taskAssignment',
  approval: 'approval',
  revision: 'revision',
  reassignment: 'reassignment',
  deadlineAlert: 'deadlineAlert',
  reminder: 'deadlineAlert',
};

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  try {
    // Check user notification preferences
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { notificationPreferences: true },
    });

    if (user) {
      const prefs = typeof user.notificationPreferences === 'string'
        ? JSON.parse(user.notificationPreferences)
        : user.notificationPreferences;

      const prefKey = typeToPreferenceKey[input.type] || input.type;
      if (prefs[prefKey] === false) {
        return; // User has disabled this notification type
      }
    }

    const id = await generateId('notif');
    await prisma.notification.create({
      data: {
        id,
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        taskId: input.taskId ?? null,
        activityId: input.activityId ?? null,
      },
    });
  } catch (err) {
    // Fire-and-forget: log error but don't break the main operation
    console.error('[Notification] Failed to create notification:', err);
  }
}

interface NotifyUsersData {
  type: string;
  title: string;
  message: string;
  taskId?: string;
  activityId?: string;
}

export async function notifyUsers(
  userIds: string[],
  actorId: string,
  data: NotifyUsersData,
): Promise<void> {
  try {
    // Skip the actor — don't notify yourself
    const recipients = userIds.filter((id) => id !== actorId);
    await Promise.all(
      recipients.map((userId) =>
        createNotification({
          userId,
          type: data.type,
          title: data.title,
          message: data.message,
          taskId: data.taskId,
          activityId: data.activityId,
        }),
      ),
    );
  } catch (err) {
    console.error('[Notification] Failed to notify users:', err);
  }
}
