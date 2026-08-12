import { Request, Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import { AppError } from '../../lib/AppError';
import { sendResponse } from '../../lib/response';
import { productQuerySchema } from './product.schema';
import * as productService from './product.service';

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  const parsed = productQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    throw new AppError('Invalid query parameters', 400);
  }

  const result = await productService.getAllProducts(parsed.data);
  sendResponse(res, 200, true, 'Products fetched successfully', result);
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const product = await productService.getProductById(id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  sendResponse(res, 200, true, 'Product fetched successfully', { product });
};

export const getMyProducts = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userId = req.auth?.sub;
  if (!userId) {
    throw new AppError('Unauthorized access', 401);
  }

  const products = await productService.getMyProducts(userId);
  sendResponse(res, 200, true, 'My products fetched successfully', { products });
};

const ensureProductOwnership = (
  productUserId: string | null,
  auth: AuthRequest['auth'],
): void => {
  const isAdmin = auth?.role === 'ADMIN';
  const isOwner = Boolean(auth?.sub && productUserId === auth.sub);

  if (!isAdmin && !isOwner) {
    throw new AppError('Forbidden: You can only modify your own products', 403);
  }
};

export const createProduct = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userId = req.auth?.sub;
  if (!userId) {
    throw new AppError('Unauthorized access', 401);
  }

  const product = await productService.createProduct({ ...req.body, userId });
  sendResponse(res, 201, true, 'Product created successfully', { product });
};

export const updateProduct = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const id = String(req.params.id);
  const existing = await productService.getProductById(id);

  if (!existing) {
    throw new AppError('Product not found', 404);
  }

  ensureProductOwnership(existing.userId, req.auth);

  const product = await productService.updateProduct(id, req.body);
  sendResponse(res, 200, true, 'Product updated successfully', { product });
};

export const deleteProduct = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const id = String(req.params.id);
  const existing = await productService.getProductById(id);

  if (!existing) {
    throw new AppError('Product not found', 404);
  }

  ensureProductOwnership(existing.userId, req.auth);

  await productService.deleteProduct(id);
  sendResponse(res, 200, true, 'Product deleted successfully');
};
