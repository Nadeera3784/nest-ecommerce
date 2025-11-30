import { Test, TestingModule } from "@nestjs/testing";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { StockValidationService } from "./stock-validation.service";
import { StockValidationResponse } from "../interfaces/stock-validation.interface";

describe("StockValidationService", () => {
  let service: StockValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockValidationService,
        {
          provide: EventEmitter2,
          useValue: {
            on: jest.fn(),
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StockValidationService>(StockValidationService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("waitForResponse", () => {
    it("should resolve when handleResponse is called with matching requestId", async () => {
      const requestId = "test-request-123";
      const mockResponse: StockValidationResponse = {
        requestId,
        isValid: true,
        errors: [],
      };

      // Start waiting for response
      const responsePromise = service.waitForResponse(requestId, 5000);

      // Simulate response arriving
      service.handleResponse(mockResponse);

      const result = await responsePromise;
      expect(result).toEqual(mockResponse);
      expect(result.isValid).toBe(true);
    });

    it("should resolve with validation errors when stock is insufficient", async () => {
      const requestId = "test-request-456";
      const mockResponse: StockValidationResponse = {
        requestId,
        isValid: false,
        errors: [
          {
            productId: "prod-1",
            productName: "Test Product",
            requested: 10,
            available: 5,
            message:
              'Insufficient stock for "Test Product". Requested: 10, Available: 5',
          },
        ],
      };

      const responsePromise = service.waitForResponse(requestId, 5000);
      service.handleResponse(mockResponse);

      const result = await responsePromise;
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].productId).toBe("prod-1");
      expect(result.errors[0].requested).toBe(10);
      expect(result.errors[0].available).toBe(5);
    });

    it("should timeout if no response is received", async () => {
      const requestId = "test-request-timeout";

      await expect(service.waitForResponse(requestId, 100)).rejects.toThrow(
        `Stock validation request ${requestId} timed out`,
      );
    });

    it("should handle multiple concurrent requests independently", async () => {
      const requestId1 = "request-1";
      const requestId2 = "request-2";

      const response1: StockValidationResponse = {
        requestId: requestId1,
        isValid: true,
        errors: [],
      };

      const response2: StockValidationResponse = {
        requestId: requestId2,
        isValid: false,
        errors: [
          {
            productId: "prod-2",
            productName: "Another Product",
            requested: 5,
            available: 0,
            message: 'Product "Another Product" not found',
          },
        ],
      };

      const promise1 = service.waitForResponse(requestId1, 5000);
      const promise2 = service.waitForResponse(requestId2, 5000);

      // Respond in reverse order
      service.handleResponse(response2);
      service.handleResponse(response1);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1.requestId).toBe(requestId1);
      expect(result1.isValid).toBe(true);

      expect(result2.requestId).toBe(requestId2);
      expect(result2.isValid).toBe(false);
    });

    it("should ignore responses for unknown request IDs", () => {
      const unknownResponse: StockValidationResponse = {
        requestId: "unknown-request",
        isValid: true,
        errors: [],
      };

      // Should not throw
      expect(() => service.handleResponse(unknownResponse)).not.toThrow();
    });
  });
});
