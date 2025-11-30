import { Test, TestingModule } from "@nestjs/testing";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "../services/orders.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Types } from "mongoose";

describe("OrdersController", () => {
  let controller: OrdersController;

  const mockUserId = "user-123";
  const mockOrderId = new Types.ObjectId().toString();

  const mockRequest = {
    user: {
      userId: mockUserId,
      email: "test@example.com",
    },
  } as any;

  const mockShippingAddress = {
    fullName: "John Doe",
    addressLine1: "123 Main St",
    city: "New York",
    state: "NY",
    postalCode: "10001",
    country: "USA",
    phone: "+1234567890",
  };

  const mockOrder = {
    _id: mockOrderId,
    orderNumber: "ORD-ABC123-XYZ",
    userId: mockUserId,
    items: [
      {
        productId: "prod-1",
        name: "Test Product",
        price: 100,
        quantity: 2,
      },
    ],
    shippingAddress: mockShippingAddress,
    subtotal: 200,
    shippingCost: 10,
    tax: 20,
    totalAmount: 230,
    status: "pending",
    paymentStatus: "pending",
  };

  const mockOrdersService = {
    createOrder: jest.fn(),
    findAllByUser: jest.fn(),
    findOne: jest.fn(),
    findByOrderNumber: jest.fn(),
    updateStatus: jest.fn(),
    cancelOrder: jest.fn(),
    getOrderStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<OrdersController>(OrdersController);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("checkout", () => {
    const createOrderDto = {
      shippingAddress: mockShippingAddress,
      shippingCost: 10,
      notes: "Please deliver before 5pm",
    };

    it("should create an order from cart", async () => {
      mockOrdersService.createOrder.mockResolvedValue(mockOrder);

      const result = await controller.checkout(mockRequest, createOrderDto);

      expect(result).toEqual(mockOrder);
      expect(mockOrdersService.createOrder).toHaveBeenCalledWith(
        mockUserId,
        createOrderDto,
      );
    });
  });

  describe("getOrders", () => {
    it("should return all orders for the user", async () => {
      const mockOrders = [mockOrder, { ...mockOrder, _id: "order-2" }];
      mockOrdersService.findAllByUser.mockResolvedValue(mockOrders);

      const result = await controller.getOrders(mockRequest);

      expect(result).toEqual(mockOrders);
      expect(mockOrdersService.findAllByUser).toHaveBeenCalledWith(mockUserId);
    });

    it("should return empty array if no orders", async () => {
      mockOrdersService.findAllByUser.mockResolvedValue([]);

      const result = await controller.getOrders(mockRequest);

      expect(result).toEqual([]);
    });
  });

  describe("getStats", () => {
    it("should return order statistics", async () => {
      const mockStats = {
        totalOrders: 10,
        pendingOrders: 3,
        completedOrders: 5,
        totalRevenue: 1500,
      };
      mockOrdersService.getOrderStats.mockResolvedValue(mockStats);

      const result = await controller.getStats(mockRequest);

      expect(result).toEqual(mockStats);
      expect(mockOrdersService.getOrderStats).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe("getOrder", () => {
    it("should return a specific order", async () => {
      mockOrdersService.findOne.mockResolvedValue(mockOrder);

      const result = await controller.getOrder(mockRequest, mockOrderId);

      expect(result).toEqual(mockOrder);
      expect(mockOrdersService.findOne).toHaveBeenCalledWith(
        mockOrderId,
        mockUserId,
      );
    });
  });

  describe("getOrderByNumber", () => {
    it("should return order by order number", async () => {
      mockOrdersService.findByOrderNumber.mockResolvedValue(mockOrder);

      const result = await controller.getOrderByNumber(
        mockRequest,
        "ORD-ABC123-XYZ",
      );

      expect(result).toEqual(mockOrder);
      expect(mockOrdersService.findByOrderNumber).toHaveBeenCalledWith(
        "ORD-ABC123-XYZ",
        mockUserId,
      );
    });
  });

  describe("updateStatus", () => {
    const updateStatusDto = {
      status: "shipped",
      trackingNumber: "TRACK123",
    };

    it("should update order status", async () => {
      const updatedOrder = { ...mockOrder, status: "shipped" };
      mockOrdersService.updateStatus.mockResolvedValue(updatedOrder);

      const result = await controller.updateStatus(
        mockOrderId,
        updateStatusDto,
      );

      expect(result).toEqual(updatedOrder);
      expect(mockOrdersService.updateStatus).toHaveBeenCalledWith(
        mockOrderId,
        updateStatusDto,
      );
    });
  });

  describe("cancelOrder", () => {
    it("should cancel an order", async () => {
      const cancelledOrder = { ...mockOrder, status: "cancelled" };
      mockOrdersService.cancelOrder.mockResolvedValue(cancelledOrder);

      const result = await controller.cancelOrder(mockRequest, mockOrderId);

      expect(result).toEqual(cancelledOrder);
      expect(mockOrdersService.cancelOrder).toHaveBeenCalledWith(
        mockOrderId,
        mockUserId,
      );
    });
  });
});
