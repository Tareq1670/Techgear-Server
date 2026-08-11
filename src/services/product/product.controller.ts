import { Request, Response } from 'express';
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

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  const product = await productService.createProduct(req.body);
  sendResponse(res, 201, true, 'Product created successfully', { product });
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const product = await productService.updateProduct(id, req.body);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  sendResponse(res, 200, true, 'Product updated successfully', { product });
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const product = await productService.deleteProduct(id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  sendResponse(res, 200, true, 'Product deleted successfully');
};
