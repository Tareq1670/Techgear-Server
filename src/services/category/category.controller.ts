import { Request, Response } from 'express';
import { AppError } from '../../lib/AppError';
import { sendResponse } from '../../lib/response';
import * as categoryService from './category.service';

export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  const categories = await categoryService.getAllCategories();
  sendResponse(res, 200, true, 'Categories fetched successfully', { categories });
};

export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const category = await categoryService.getCategoryById(id);

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  sendResponse(res, 200, true, 'Category fetched successfully', { category });
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  const category = await categoryService.createCategory(req.body);
  sendResponse(res, 201, true, 'Category created successfully', { category });
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const category = await categoryService.updateCategory(id, req.body);

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  sendResponse(res, 200, true, 'Category updated successfully', { category });
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const category = await categoryService.deleteCategory(id);

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  sendResponse(res, 200, true, 'Category deleted successfully');
};
