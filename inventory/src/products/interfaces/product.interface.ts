export interface Product {
  name: string;
  description?: string;
  price: number;
  stock: number;
  categoryId?: string;
  averageRating: number;
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
}
