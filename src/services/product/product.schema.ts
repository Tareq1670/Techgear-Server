import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().trim().min(1, 'Name cannot be empty'),
  description: z.string().trim().min(1, 'Description cannot be empty'),
  price: z.number().positive('Price must be greater than 0'),
  stock: z.number().int().nonnegative('Stock cannot be negative').default(0),
  imageUrl: z.string().url('imageUrl must be a valid URL').optional(),
  categoryId: z.string().uuid('categoryId must be a valid UUID'),
});

export const updateProductSchema = z
  .object({
    name: z.string().trim().min(1, 'Name cannot be empty').optional(),
    description: z.string().trim().min(1, 'Description cannot be empty').optional(),
    price: z.number().positive('Price must be greater than 0').optional(),
    stock: z.number().int().nonnegative('Stock cannot be negative').optional(),
    imageUrl: z.string().url('imageUrl must be a valid URL').nullable().optional(),
    categoryId: z.string().uuid('categoryId must be a valid UUID').optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
    path: ['body'],
  });

export const productQuerySchema = z.object({
  categoryId: z.string().uuid('categoryId must be a valid UUID').optional(),
  search: z.string().optional().transform((value) => value?.trim() || undefined),
  minPrice: z.coerce.number().nonnegative('minPrice must be nonnegative').optional(),
  maxPrice: z.coerce.number().positive('maxPrice must be positive').optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc']).optional(),
  page: z.coerce.number().int().positive('page must be a positive integer').default(1),
  limit: z.coerce.number().int().positive('limit must be a positive integer').max(100).default(12),
});
