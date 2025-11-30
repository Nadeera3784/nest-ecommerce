import { Schema, Document } from "mongoose";
import { CartItem } from "../interfaces/cart.interface";

export { CartItem };

export interface CartDocument extends Document {
  userId: string;
  items: CartItem[];
  totalAmount: number;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export const CART_MODEL = "Cart";

const CartItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    imageUrl: { type: String },
  },
  { _id: false },
);

export const CartSchema = new Schema<CartDocument>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    items: { type: [CartItemSchema], default: [] },
    totalAmount: { type: Number, default: 0, min: 0 },
    itemCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

// Pre-save middleware to calculate totals
CartSchema.pre("save", function (next) {
  this.totalAmount = this.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  this.itemCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
  next();
});
