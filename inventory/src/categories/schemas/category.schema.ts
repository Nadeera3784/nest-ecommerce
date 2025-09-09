import { Schema, Document } from 'mongoose';

export interface CategoryDocument extends Document {
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const CATEGORY_MODEL = 'Category';

export const CategorySchema = new Schema<CategoryDocument>({
  name: { type: String, required: true, trim: true, unique: true },
  description: { type: String, trim: true },
}, { timestamps: true });
