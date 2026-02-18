import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const CreateActivitySchema = z.object({
  name: z.string().min(1, 'Activity name is required').max(200),
  activityTypeId: z.string().min(1, 'Activity type is required'),
  startDate: z.string().regex(dateRegex, 'Invalid date format (YYYY-MM-DD)'),
  endDate: z.string().regex(dateRegex, 'Invalid date format (YYYY-MM-DD)'),
  description: z.string().max(2000).default(''),
  picIds: z.array(z.string()).default([]),
  approverIds: z.array(z.string()).default([]),
  requiresBudget: z.boolean().default(false),
  estimatedBudget: z.number().positive().nullable().optional(),
  budgetNeededDate: z.string().regex(dateRegex).nullable().optional(),
  reminders: z.array(z.object({
    trigger: z.string(),
    customDays: z.number().int().positive().nullable().optional(),
    channel: z.string(),
    templateId: z.string().nullable().optional(),
    customMessage: z.string().nullable().optional(),
    enabled: z.boolean().default(true),
  })).default([]),
});

export const UpdateActivitySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  activityTypeId: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().regex(dateRegex).optional(),
  endDate: z.string().regex(dateRegex).optional(),
  description: z.string().max(2000).optional(),
  picIds: z.array(z.string()).optional(),
  approverIds: z.array(z.string()).optional(),
  requiresBudget: z.boolean().optional(),
  estimatedBudget: z.number().positive().nullable().optional(),
  spentBudget: z.number().positive().nullable().optional(),
  budgetNeededDate: z.string().regex(dateRegex).nullable().optional(),
});

export type CreateActivityInput = z.infer<typeof CreateActivitySchema>;
export type UpdateActivityInput = z.infer<typeof UpdateActivitySchema>;
