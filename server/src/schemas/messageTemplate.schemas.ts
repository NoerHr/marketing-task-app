import { z } from 'zod';

const placeholderRegex = /\{\{(\w+)\}\}/g;

function extractPlaceholders(body: string): string[] {
  const matches = [...body.matchAll(placeholderRegex)];
  return [...new Set(matches.map((m) => m[1]))];
}

export const CreateTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(200),
  body: z.string().min(1, 'Template body is required').max(2000),
}).transform((data) => ({
  ...data,
  placeholders: extractPlaceholders(data.body),
}));

export const UpdateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  body: z.string().min(1).max(2000).optional(),
}).transform((data) => ({
  ...data,
  placeholders: data.body ? extractPlaceholders(data.body) : undefined,
}));

export type CreateTemplateInput = z.infer<typeof CreateTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof UpdateTemplateSchema>;
