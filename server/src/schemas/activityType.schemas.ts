import { z } from 'zod';

const hexColorRegex = /^#[0-9a-fA-F]{6}$/;

export const CreateActivityTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  color: z.string().regex(hexColorRegex, 'Invalid hex color (e.g. #f43f5e)'),
  icon: z.string().max(50).nullable().optional(),
});

export const UpdateActivityTypeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().regex(hexColorRegex).optional(),
  icon: z.string().max(50).nullable().optional(),
});

export type CreateActivityTypeInput = z.infer<typeof CreateActivityTypeSchema>;
export type UpdateActivityTypeInput = z.infer<typeof UpdateActivityTypeSchema>;
