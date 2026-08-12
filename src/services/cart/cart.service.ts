import prisma from '../../lib/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '../../lib/AppError';

export const cartSelect = {
  id: true,
  items: {
    select: {
      id: true,
      productId: true,
      quantity: true,
      product: {
        select: { id: true, name: true, price: true, imageUrl: true, stock: true },
      },
    },
    orderBy: { id: 'asc' },
  },
} satisfies Prisma.CartSelect;

export interface CartView {
  id: string;
  items: {
    id: string;
    productId: string;
    quantity: number;
    product: { id: string; name: string; price: number; imageUrl: string | null; stock: number };
  }[];
  totalCount: number;
  totalPrice: number;
}

const getOrCreateCart = async (userId: string) => {
  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId } });
  }
  return cart;
};

const toView = (cart: Prisma.CartGetPayload<{ select: typeof cartSelect }>): CartView => {
  const totalCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = Number(
    cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0).toFixed(2),
  );
  return { id: cart.id, items: cart.items, totalCount, totalPrice };
};

export const getCart = async (userId: string): Promise<CartView> => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    select: cartSelect,
  });

  if (!cart) {
    return { id: '', items: [], totalCount: 0, totalPrice: 0 };
  }

  return toView(cart);
};

const ensureProductAvailable = async (
  productId: string,
): Promise<{ id: string; name: string; stock: number }> => {
  const product = await prisma.product.findFirst({
    where: { id: productId, isDeleted: false },
    select: { id: true, name: true, stock: true },
  });

  if (!product) {
    throw new AppError('Product not found', 400);
  }

  if (product.stock <= 0) {
    throw new AppError(`"${product.name}" is out of stock`, 400);
  }

  return product;
};

export const addCartItem = async (userId: string, productId: string, quantity: number) => {
  const product = await ensureProductAvailable(productId);
  const cart = await getOrCreateCart(userId);

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });

  const nextQuantity = Math.min((existing?.quantity ?? 0) + quantity, product.stock);

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: nextQuantity },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, quantity: nextQuantity },
    });
  }

  return getCart(userId);
};

export const updateCartItem = async (userId: string, productId: string, quantity: number) => {
  const cart = await prisma.cart.findUnique({ where: { userId } });

  if (!cart) {
    throw new AppError('Cart item not found', 404);
  }

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });

  if (!existing) {
    throw new AppError('Cart item not found', 404);
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, isDeleted: false },
    select: { id: true, name: true, stock: true },
  });

  if (!product) {
    throw new AppError('Product not found', 400);
  }

  if (product.stock <= 0) {
    throw new AppError(`"${product.name}" is out of stock`, 400);
  }

  await prisma.cartItem.update({
    where: { id: existing.id },
    data: { quantity: Math.min(quantity, product.stock) },
  });

  return getCart(userId);
};

export const removeCartItem = async (userId: string, productId: string) => {
  const cart = await prisma.cart.findUnique({ where: { userId } });

  if (!cart) {
    throw new AppError('Cart item not found', 404);
  }

  const result = await prisma.cartItem.deleteMany({
    where: { cartId: cart.id, productId },
  });

  if (result.count === 0) {
    throw new AppError('Cart item not found', 404);
  }

  return getCart(userId);
};

export const clearCart = async (userId: string) => {
  const cart = await prisma.cart.findUnique({ where: { userId } });

  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }

  return getCart(userId);
};
