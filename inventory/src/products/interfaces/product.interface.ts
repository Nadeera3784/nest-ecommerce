export interface Product {
  name: string;
  description?: string;
  price: number;
  stock: number;
  categoryId?: string;
  createdAt: Date;
  updatedAt: Date;
}
