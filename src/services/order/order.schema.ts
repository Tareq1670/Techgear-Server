import { z } from 'zod';

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid('productId must be a valid UUID'),
        quantity: z
          .number()
          .int('quantity must be an integer')
          .positive('quantity must be greater than 0'),
      }),
    )
    .min(1, 'At least one item is required'),
  shippingAddress: z.string().trim().min(10, 'Shipping address is too short'),
  paymentMethod: z.enum(['CARD', 'PAYPAL', 'COD']),
  totalAmount: z.number().positive('totalAmount must be positive').optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
});
