import { Schema, Document } from 'mongoose';
import { Category } from '../interfaces/category.interface';

export interface CategoryDocument extends Category, Document {}

export const CATEGORY_MODEL = 'Category';

export const CategorySchema = new Schema<CategoryDocument>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
  },
  { timestamps: true },
);
