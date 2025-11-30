export interface OrderItem {
  productId: string;
  quantity: number;
  name?: string;
  price?: number;
}

export interface OrderPaidEventPayload {
  paymentId: string;
  orderId: string;
  userId: string;
  items: OrderItem[];
}
