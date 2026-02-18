import { z } from 'zod';

export const InviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  role: z.enum(['Leader', 'PIC']).default('PIC'),
  isSuperAdmin: z.boolean().default(false),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role: z.enum(['Leader', 'PIC']).optional(),
  isSuperAdmin: z.boolean().optional(),
});

export const ProfileUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  notificationPreferences: z.object({
    taskAssignment: z.boolean(),
    approval: z.boolean(),
    revision: z.boolean(),
    reassignment: z.boolean(),
    deadlineAlert: z.boolean(),
  }).optional(),
});

export type InviteUserInput = z.infer<typeof InviteUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;
