import { Schema, Document } from 'mongoose';
import { Product } from '../interfaces/product.interface';

export interface ProductDocument extends Product, Document {}

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
