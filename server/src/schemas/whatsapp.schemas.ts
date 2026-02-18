import { z } from 'zod';

export const WhatsappAccountSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
});

export const WhatsappGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(200),
  groupId: z.string().min(1, 'Group ID is required'),
  type: z.string().min(1, 'Group type is required'),
});

export const UpdateWhatsappGroupSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  groupId: z.string().optional(),
  type: z.string().min(1).optional(),
});

export type WhatsappAccountInput = z.infer<typeof WhatsappAccountSchema>;
export type WhatsappGroupInput = z.infer<typeof WhatsappGroupSchema>;
