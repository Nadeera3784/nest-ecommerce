export enum MessageBusChannelsEnum {
  order = "async_events_order_micro",
  inventory = "async_events_inventory_micro",
}

export enum OrderMessagesEnum {
  OrderCreated = "order.event.created",
  OrderCancelled = "order.event.cancelled",
  ValidateStock = "inventory.command.validate-stock",
  StockValidated = "order.event.stock-validated",
}

export enum InventoryMessagesEnum {
  StockReserved = "inventory.event.stock.reserved",
  StockReleased = "inventory.event.stock.released",
}
