import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Name cannot be empty'),
  description: z.string().trim().min(1, 'Description cannot be empty').optional(),
});

export const updateCategorySchema = z
  .object({
    name: z.string().trim().min(1, 'Name cannot be empty').optional(),
    description: z
      .string()
      .trim()
      .min(1, 'Description cannot be empty')
      .nullable()
      .optional(),
  })
  .refine((data) => data.name !== undefined || data.description !== undefined, {
    message: 'At least one of name or description must be provided',
    path: ['body'],
  });
