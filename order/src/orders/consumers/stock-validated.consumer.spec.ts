import { Test, TestingModule } from "@nestjs/testing";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { StockValidatedConsumer } from "./stock-validated.consumer";
import { StockValidationResponse } from "../interfaces/stock-validation.interface";

describe("StockValidatedConsumer", () => {
  let consumer: StockValidatedConsumer;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(async () => {
    const mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockValidatedConsumer,
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    consumer = module.get<StockValidatedConsumer>(StockValidatedConsumer);
    eventEmitter = module.get(EventEmitter2);
  });

  it("should be defined", () => {
    expect(consumer).toBeDefined();
  });

  describe("handleStockValidated", () => {
    it("should emit stock.validation.response event with valid response", async () => {
      const payload: StockValidationResponse = {
        requestId: "test-request-123",
        isValid: true,
        errors: [],
      };

      await consumer.handleStockValidated(payload);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        "stock.validation.response",
        payload,
      );
    });

    it("should emit stock.validation.response event with invalid response", async () => {
      const payload: StockValidationResponse = {
        requestId: "test-request-456",
        isValid: false,
        errors: [
          {
            productId: "prod-1",
            productName: "Test Product",
            requested: 10,
            available: 5,
            message: "Insufficient stock",
          },
        ],
      };

      await consumer.handleStockValidated(payload);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        "stock.validation.response",
        payload,
      );
    });

    it("should handle multiple validation responses", async () => {
      const payload1: StockValidationResponse = {
        requestId: "request-1",
        isValid: true,
        errors: [],
      };

      const payload2: StockValidationResponse = {
        requestId: "request-2",
        isValid: false,
        errors: [
          {
            productId: "prod-2",
            productName: "Another Product",
            requested: 5,
            available: 0,
            message: "Product not found",
          },
        ],
      };

      await consumer.handleStockValidated(payload1);
      await consumer.handleStockValidated(payload2);

      expect(eventEmitter.emit).toHaveBeenCalledTimes(2);
      expect(eventEmitter.emit).toHaveBeenNthCalledWith(
        1,
        "stock.validation.response",
        payload1,
      );
      expect(eventEmitter.emit).toHaveBeenNthCalledWith(
        2,
        "stock.validation.response",
        payload2,
      );
    });
  });
});
