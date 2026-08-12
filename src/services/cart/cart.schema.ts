import { z } from 'zod';

export const addCartItemSchema = z.object({
  productId: z.string().uuid('productId must be a valid UUID'),
  quantity: z
    .number()
    .int('quantity must be an integer')
    .positive('quantity must be greater than 0')
    .default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z
    .number()
    .int('quantity must be an integer')
    .positive('quantity must be greater than 0'),
});
