import { z } from 'zod';

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(1, 'Name cannot be empty').optional(),
    email: z.email('Invalid email address').optional(),
  })
  .refine((data) => data.name !== undefined || data.email !== undefined, {
    message: 'At least one of name or email must be provided',
    path: ['body'],
  });
