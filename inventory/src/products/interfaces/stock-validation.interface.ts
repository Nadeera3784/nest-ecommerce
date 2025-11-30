export interface StockValidationRequest {
  requestId: string;
  items: Array<{
    productId: string;
    quantity: number;
    name?: string;
  }>;
}

export interface StockValidationError {
  productId: string;
  productName: string;
  requested: number;
  available: number;
  message: string;
}

export interface StockValidationResponse {
  requestId: string;
  isValid: boolean;
  errors: StockValidationError[];
}
