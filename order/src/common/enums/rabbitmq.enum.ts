export enum MessageBusChannelsEnum {
  auth = "async_events_auth_micro",
  order = "async_events_order_micro",
}

export enum OrderMessagesEnum {
  OrderCreated = "order.event.created",
  OrderUpdated = "order.event.updated",
  OrderCancelled = "order.event.cancelled",
  OrderCompleted = "order.event.completed",
  PaymentRequested = "order.event.payment.requested",
}

export enum PaymentMessagesEnum {
  PaymentCompleted = "payment.event.completed",
  PaymentFailed = "payment.event.failed",
  PaymentRefunded = "payment.event.refunded",
}

export enum InventoryMessagesEnum {
  StockReserved = "inventory.event.stock.reserved",
  StockReleased = "inventory.event.stock.released",
  StockUpdated = "inventory.event.stock.updated",
}
