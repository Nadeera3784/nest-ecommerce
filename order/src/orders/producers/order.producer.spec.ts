import { Test, TestingModule } from "@nestjs/testing";
import { OrderProducer } from "./order.producer";
import { RabbitMqClient } from "../../core/rabbit-mq";
import { OrderMessagesEnum } from "../../common/enums/rabbitmq.enum";

describe("OrderProducer", () => {
  let producer: OrderProducer;
  let rabbitClient: jest.Mocked<RabbitMqClient>;

  beforeEach(async () => {
    const mockRabbitClient = {
      send: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderProducer,
        {
          provide: RabbitMqClient,
          useValue: mockRabbitClient,
        },
      ],
    }).compile();

    producer = module.get<OrderProducer>(OrderProducer);
    rabbitClient = module.get(RabbitMqClient);
  });

  it("should be defined", () => {
    expect(producer).toBeDefined();
  });

  describe("requestStockValidation", () => {
    it("should send stock validation request and return requestId", async () => {
      const items = [
        { productId: "prod-1", quantity: 2, name: "Product 1" },
        { productId: "prod-2", quantity: 5, name: "Product 2" },
      ];

      const requestId = await producer.requestStockValidation(items);

      expect(requestId).toBeDefined();
      expect(requestId).toMatch(/^stock-/);

      expect(rabbitClient.send).toHaveBeenCalledWith(
        {
          channel: OrderMessagesEnum.ValidateStock,
          exchange: "async_events",
        },
        {
          name: OrderMessagesEnum.ValidateStock,
          payload: {
            requestId: expect.stringMatching(/^stock-/),
            items,
          },
        },
        false,
      );
    });

    it("should generate unique requestIds for each call", async () => {
      const items = [{ productId: "prod-1", quantity: 1 }];

      const requestId1 = await producer.requestStockValidation(items);
      const requestId2 = await producer.requestStockValidation(items);

      expect(requestId1).not.toBe(requestId2);
    });
  });

  describe("publishOrderCreated", () => {
    it("should publish order created event", async () => {
      const order = {
        orderId: "order-123",
        orderNumber: "ORD-ABC123",
        userId: "user-456",
        items: [
          { productId: "prod-1", quantity: 2 },
          { productId: "prod-2", quantity: 1 },
        ],
        totalAmount: 150.0,
      };

      await producer.publishOrderCreated(order);

      expect(rabbitClient.send).toHaveBeenCalledWith(
        {
          channel: OrderMessagesEnum.OrderCreated,
          exchange: "async_events",
        },
        {
          name: OrderMessagesEnum.OrderCreated,
          payload: order,
        },
        false,
      );
    });
  });

  describe("publishOrderCancelled", () => {
    it("should publish order cancelled event", async () => {
      const order = {
        orderId: "order-123",
        orderNumber: "ORD-ABC123",
        userId: "user-456",
        items: [
          { productId: "prod-1", quantity: 2 },
          { productId: "prod-2", quantity: 1 },
        ],
      };

      await producer.publishOrderCancelled(order);

      expect(rabbitClient.send).toHaveBeenCalledWith(
        {
          channel: OrderMessagesEnum.OrderCancelled,
          exchange: "async_events",
        },
        {
          name: OrderMessagesEnum.OrderCancelled,
          payload: order,
        },
        false,
      );
    });
  });
});
