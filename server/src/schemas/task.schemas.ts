import { z } from 'zod';

const TaskStatusEnum = z.enum([
  'To Do', 'In Progress', 'Need Review', 'Revision', 'Approved', 'Archived',
]);

const TaskPriorityEnum = z.enum(['Low', 'Medium', 'High']);

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^\d{2}:\d{2}$/;

export const CreateTaskSchema = z.object({
  name: z.string().min(1, 'Task name is required').max(200),
  activityId: z.string().min(1, 'Activity is required'),
  picIds: z.array(z.string()).min(1, 'At least one PIC is required'),
  priority: TaskPriorityEnum.default('Medium'),
  startDate: z.string().regex(dateRegex, 'Invalid date format (YYYY-MM-DD)'),
  endDate: z.string().regex(dateRegex, 'Invalid date format (YYYY-MM-DD)'),
  startTime: z.string().regex(timeRegex).nullable().optional(),
  endTime: z.string().regex(timeRegex).nullable().optional(),
  description: z.string().max(2000).default(''),
  reminders: z.array(z.object({
    trigger: z.string(),
    customDays: z.number().int().positive().nullable().optional(),
    channel: z.string(),
    templateId: z.string().nullable().optional(),
    customMessage: z.string().nullable().optional(),
    enabled: z.boolean().default(true),
  })).default([]),
});

export const UpdateTaskSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  activityId: z.string().optional(),
  priority: TaskPriorityEnum.optional(),
  status: TaskStatusEnum.optional(),
  startDate: z.string().regex(dateRegex).optional(),
  endDate: z.string().regex(dateRegex).optional(),
  startTime: z.string().regex(timeRegex).nullable().optional(),
  endTime: z.string().regex(timeRegex).nullable().optional(),
  description: z.string().max(2000).optional(),
});

export const TaskQuerySchema = z.object({
  activityId: z.string().optional(),
  activityIds: z.union([z.string(), z.array(z.string())]).optional(),
  picId: z.string().optional(),
  picIds: z.union([z.string(), z.array(z.string())]).optional(),
  status: z.union([z.string(), z.array(z.string())]).optional(),
  statuses: z.union([z.string(), z.array(z.string())]).optional(),
  activityTypeId: z.string().optional(),
  activityTypeIds: z.union([z.string(), z.array(z.string())]).optional(),
  showArchived: z.enum(['true', 'false']).optional(),
  startDate: z.string().regex(dateRegex).optional(),
  endDate: z.string().regex(dateRegex).optional(),
  myTasksOnly: z.enum(['true', 'false']).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  sort: z.enum(['recent', 'deadline', 'created']).optional(),
});

export const ApprovalActionSchema = z.object({
  action: z.enum(['approved', 'revision']),
  feedback: z.string().max(1000).default(''),
});

export const TaskPicSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type TaskQueryInput = z.infer<typeof TaskQuerySchema>;
export type ApprovalActionInput = z.infer<typeof ApprovalActionSchema>;
