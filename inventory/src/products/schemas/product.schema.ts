import { Schema, Document } from 'mongoose';

export interface ProductDocument extends Document {
  name: string;
  description?: string;
  price: number;
  stock: number;
  categoryId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const PRODUCT_MODEL = 'Product';

export const ProductSchema = new Schema<ProductDocument>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    categoryId: { type: String, index: true },
  },
  { timestamps: true },
);
