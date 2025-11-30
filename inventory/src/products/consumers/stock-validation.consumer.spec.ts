import { Test, TestingModule } from '@nestjs/testing';
import { StockValidationConsumer } from './stock-validation.consumer';
import { ProductsService } from '../services/products.service';
import { RabbitMqClient } from '../../core/rabbit-mq';
import { StockValidationRequest } from '../interfaces/stock-validation.interface';
import { InventoryMessagesEnum } from '../../common/enums/rabbitmq.enum';

describe('StockValidationConsumer', () => {
  let consumer: StockValidationConsumer;
  let productsService: jest.Mocked<ProductsService>;
  let rabbitClient: jest.Mocked<RabbitMqClient>;

  beforeEach(async () => {
    const mockProductsService = {
      findById: jest.fn(),
    };

    const mockRabbitClient = {
      send: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockValidationConsumer,
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
        {
          provide: RabbitMqClient,
          useValue: mockRabbitClient,
        },
      ],
    }).compile();

    consumer = module.get<StockValidationConsumer>(StockValidationConsumer);
    productsService = module.get(ProductsService);
    rabbitClient = module.get(RabbitMqClient);
  });

  it('should be defined', () => {
    expect(consumer).toBeDefined();
  });

  describe('handleStockValidation', () => {
    it('should return valid response when all products have sufficient stock', async () => {
      const payload: StockValidationRequest = {
        requestId: 'test-request-123',
        items: [
          { productId: 'prod-1', quantity: 2, name: 'Product 1' },
          { productId: 'prod-2', quantity: 3, name: 'Product 2' },
        ],
      };

      productsService.findById
        .mockResolvedValueOnce({
          _id: 'prod-1',
          name: 'Product 1',
          stock: 10,
        } as any)
        .mockResolvedValueOnce({
          _id: 'prod-2',
          name: 'Product 2',
          stock: 5,
        } as any);

      await consumer.handleStockValidation(payload);

      expect(rabbitClient.send).toHaveBeenCalledWith(
        {
          channel: InventoryMessagesEnum.StockValidated,
          exchange: 'async_events',
        },
        {
          name: InventoryMessagesEnum.StockValidated,
          payload: {
            requestId: 'test-request-123',
            isValid: true,
            errors: [],
          },
        },
        false,
      );
    });

    it('should return invalid response when product has insufficient stock', async () => {
      const payload: StockValidationRequest = {
        requestId: 'test-request-456',
        items: [{ productId: 'prod-1', quantity: 15, name: 'Product 1' }],
      };

      productsService.findById.mockResolvedValueOnce({
        _id: 'prod-1',
        name: 'Product 1',
        stock: 10,
      } as any);

      await consumer.handleStockValidation(payload);

      expect(rabbitClient.send).toHaveBeenCalledWith(
        {
          channel: InventoryMessagesEnum.StockValidated,
          exchange: 'async_events',
        },
        {
          name: InventoryMessagesEnum.StockValidated,
          payload: {
            requestId: 'test-request-456',
            isValid: false,
            errors: [
              {
                productId: 'prod-1',
                productName: 'Product 1',
                requested: 15,
                available: 10,
                message:
                  'Insufficient stock for "Product 1". Requested: 15, Available: 10',
              },
            ],
          },
        },
        false,
      );
    });

    it('should return invalid response when product is not found', async () => {
      const payload: StockValidationRequest = {
        requestId: 'test-request-789',
        items: [
          {
            productId: 'prod-nonexistent',
            quantity: 1,
            name: 'Unknown Product',
          },
        ],
      };

      productsService.findById.mockResolvedValueOnce(null);

      await consumer.handleStockValidation(payload);

      expect(rabbitClient.send).toHaveBeenCalledWith(
        {
          channel: InventoryMessagesEnum.StockValidated,
          exchange: 'async_events',
        },
        {
          name: InventoryMessagesEnum.StockValidated,
          payload: {
            requestId: 'test-request-789',
            isValid: false,
            errors: [
              {
                productId: 'prod-nonexistent',
                productName: 'Unknown Product',
                requested: 1,
                available: 0,
                message: 'Product "Unknown Product" not found',
              },
            ],
          },
        },
        false,
      );
    });

    it('should return multiple errors when multiple products have issues', async () => {
      const payload: StockValidationRequest = {
        requestId: 'test-request-multi',
        items: [
          { productId: 'prod-1', quantity: 20, name: 'Product 1' },
          { productId: 'prod-2', quantity: 5, name: 'Product 2' },
          { productId: 'prod-missing', quantity: 1, name: 'Missing Product' },
        ],
      };

      productsService.findById
        .mockResolvedValueOnce({
          _id: 'prod-1',
          name: 'Product 1',
          stock: 10,
        } as any)
        .mockResolvedValueOnce({
          _id: 'prod-2',
          name: 'Product 2',
          stock: 10,
        } as any)
        .mockResolvedValueOnce(null);

      await consumer.handleStockValidation(payload);

      expect(rabbitClient.send).toHaveBeenCalledWith(
        {
          channel: InventoryMessagesEnum.StockValidated,
          exchange: 'async_events',
        },
        {
          name: InventoryMessagesEnum.StockValidated,
          payload: {
            requestId: 'test-request-multi',
            isValid: false,
            errors: [
              {
                productId: 'prod-1',
                productName: 'Product 1',
                requested: 20,
                available: 10,
                message:
                  'Insufficient stock for "Product 1". Requested: 20, Available: 10',
              },
              {
                productId: 'prod-missing',
                productName: 'Missing Product',
                requested: 1,
                available: 0,
                message: 'Product "Missing Product" not found',
              },
            ],
          },
        },
        false,
      );
    });

    it('should handle edge case with exact stock quantity', async () => {
      const payload: StockValidationRequest = {
        requestId: 'test-exact-stock',
        items: [{ productId: 'prod-1', quantity: 10, name: 'Product 1' }],
      };

      productsService.findById.mockResolvedValueOnce({
        _id: 'prod-1',
        name: 'Product 1',
        stock: 10,
      } as any);

      await consumer.handleStockValidation(payload);

      expect(rabbitClient.send).toHaveBeenCalledWith(
        {
          channel: InventoryMessagesEnum.StockValidated,
          exchange: 'async_events',
        },
        {
          name: InventoryMessagesEnum.StockValidated,
          payload: {
            requestId: 'test-exact-stock',
            isValid: true,
            errors: [],
          },
        },
        false,
      );
    });

    it('should handle service errors gracefully', async () => {
      const payload: StockValidationRequest = {
        requestId: 'test-error',
        items: [{ productId: 'prod-1', quantity: 1 }],
      };

      productsService.findById.mockRejectedValueOnce(
        new Error('Database connection failed'),
      );

      await consumer.handleStockValidation(payload);

      expect(rabbitClient.send).toHaveBeenCalledWith(
        {
          channel: InventoryMessagesEnum.StockValidated,
          exchange: 'async_events',
        },
        {
          name: InventoryMessagesEnum.StockValidated,
          payload: {
            requestId: 'test-error',
            isValid: false,
            errors: [
              {
                productId: '',
                productName: '',
                requested: 0,
                available: 0,
                message: 'Stock validation failed: Database connection failed',
              },
            ],
          },
        },
        false,
      );
    });

    it('should use product name from response if not provided in request', async () => {
      const payload: StockValidationRequest = {
        requestId: 'test-no-name',
        items: [{ productId: 'prod-1', quantity: 1 }], // No name provided
      };

      productsService.findById.mockResolvedValueOnce(null);

      await consumer.handleStockValidation(payload);

      expect(rabbitClient.send).toHaveBeenCalledWith(
        expect.anything(),
        {
          name: InventoryMessagesEnum.StockValidated,
          payload: expect.objectContaining({
            errors: [
              expect.objectContaining({
                productName: 'Unknown Product',
              }),
            ],
          }),
        },
        false,
      );
    });
  });
});
