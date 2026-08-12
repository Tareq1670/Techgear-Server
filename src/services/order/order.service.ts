import prisma from '../../lib/prisma';
import { Prisma, OrderStatus, PaymentMethod } from '@prisma/client';
import { AppError } from '../../lib/AppError';

export const orderItemSelect = {
  id: true,
  productId: true,
  quantity: true,
  price: true,
  product: {
    select: { id: true, name: true, imageUrl: true },
  },
} satisfies Prisma.OrderItemSelect;

export const orderSelect = {
  id: true,
  userId: true,
  totalAmount: true,
  status: true,
  shippingAddress: true,
  paymentMethod: true,
  createdAt: true,
  updatedAt: true,
  items: {
    select: orderItemSelect,
    orderBy: { id: 'asc' },
  },
} satisfies Prisma.OrderSelect;

export const adminOrderSelect = {
  id: true,
  userId: true,
  user: {
    select: { id: true, email: true, name: true },
  },
  totalAmount: true,
  status: true,
  shippingAddress: true,
  paymentMethod: true,
  createdAt: true,
  updatedAt: true,
  items: {
    select: orderItemSelect,
    orderBy: { id: 'asc' },
  },
} satisfies Prisma.OrderSelect;

export const getOrderById = (id: string) =>
  prisma.order.findFirst({
    where: { id, isDeleted: false },
    select: orderSelect,
  });

export const getOrdersByUser = (userId: string) =>
  prisma.order.findMany({
    where: { userId, isDeleted: false },
    select: orderSelect,
    orderBy: { createdAt: 'desc' },
  });

export const getAllOrders = () =>
  prisma.order.findMany({
    where: { isDeleted: false },
    select: adminOrderSelect,
    orderBy: { createdAt: 'desc' },
  });

export const createOrder = async (data: {
  items: { productId: string; quantity: number }[];
  userId: string;
  shippingAddress: string;
  paymentMethod: PaymentMethod;
}) => {
  const quantities = new Map<string, number>();
  for (const item of data.items) {
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  }
  const items = [...quantities.entries()].map(([productId, quantity]) => ({
    productId,
    quantity,
  }));

  return prisma.$transaction(async (tx) => {
    const orderItems: { productId: string; quantity: number; price: number }[] = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = await tx.product.findFirst({
        where: { id: item.productId, isDeleted: false },
        select: { id: true, name: true, price: true, stock: true },
      });

      if (!product) {
        throw new AppError('Product not found', 400);
      }

      if (product.stock < item.quantity) {
        throw new AppError(`Insufficient stock for "${product.name}"`, 400);
      }

      const result = await tx.product.updateMany({
        where: { id: item.productId, isDeleted: false, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });

      if (result.count === 0) {
        throw new AppError(`Insufficient stock for "${product.name}"`, 400);
      }

      totalAmount += product.price * item.quantity;
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      });
    }

    return tx.order.create({
      data: {
        userId: data.userId,
        totalAmount: Number(totalAmount.toFixed(2)),
        shippingAddress: data.shippingAddress,
        paymentMethod: data.paymentMethod,
        items: { create: orderItems },
      },
      select: orderSelect,
    });
  });
};

export const updateOrderStatus = async (id: string, status: OrderStatus) => {
  const existing = await getOrderById(id);
  if (!existing) return null;

  return prisma.order.update({
    where: { id },
    data: { status },
    select: orderSelect,
  });
};

export const deleteOrder = async (id: string) => {
  const existing = await getOrderById(id);
  if (!existing) return null;

  return prisma.order.update({
    where: { id },
    data: { isDeleted: true },
    select: orderSelect,
  });
};
