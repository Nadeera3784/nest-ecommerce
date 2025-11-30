import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { ORDER_MODEL } from "../schemas/order.schema";
import { CartService } from "../../cart/services/cart.service";

describe("OrdersService", () => {
  let service: OrdersService;

  const mockUserId = "user-123";
  const mockOrderId = new Types.ObjectId().toString();

  const mockCartItem = {
    productId: "prod-1",
    name: "Test Product",
    price: 100,
    quantity: 2,
    imageUrl: "http://example.com/image.jpg",
  };

  const mockCart = {
    userId: mockUserId,
    items: [mockCartItem],
    totalAmount: 200,
    itemCount: 2,
  };

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
    items: [mockCartItem],
    shippingAddress: mockShippingAddress,
    subtotal: 200,
    shippingCost: 10,
    tax: 20,
    totalAmount: 230,
    status: "pending",
    paymentStatus: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrderModel = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
  };

  const mockCartService = {
    getCartForCheckout: jest.fn(),
    clearCart: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getModelToken(ORDER_MODEL),
          useValue: mockOrderModel,
        },
        {
          provide: CartService,
          useValue: mockCartService,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createOrder", () => {
    const createOrderDto = {
      shippingAddress: mockShippingAddress,
      shippingCost: 10,
      notes: "Please deliver before 5pm",
    };

    it("should create an order from cart", async () => {
      mockCartService.getCartForCheckout.mockResolvedValue(mockCart);
      mockOrderModel.create.mockResolvedValue(mockOrder);
      mockCartService.clearCart.mockResolvedValue({});

      const result = await service.createOrder(mockUserId, createOrderDto);

      expect(result).toEqual(mockOrder);
      expect(mockCartService.getCartForCheckout).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockOrderModel.create).toHaveBeenCalled();
      expect(mockCartService.clearCart).toHaveBeenCalledWith(mockUserId);
    });

    it("should calculate tax correctly (10%)", async () => {
      mockCartService.getCartForCheckout.mockResolvedValue(mockCart);
      mockOrderModel.create.mockImplementation((data) => Promise.resolve(data));
      mockCartService.clearCart.mockResolvedValue({});

      await service.createOrder(mockUserId, createOrderDto);

      expect(mockOrderModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tax: 20, // 10% of 200
          subtotal: 200,
          shippingCost: 10,
          totalAmount: 230, // 200 + 10 + 20
        }),
      );
    });

    it("should throw BadRequestException if cart is empty", async () => {
      mockCartService.getCartForCheckout.mockRejectedValue(
        new BadRequestException("Cart is empty"),
      );

      await expect(
        service.createOrder(mockUserId, createOrderDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("findAllByUser", () => {
    it("should return all orders for a user", async () => {
      const mockOrders = [mockOrder, { ...mockOrder, _id: "order-2" }];

      mockOrderModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockOrders),
          }),
        }),
      });

      const result = await service.findAllByUser(mockUserId);

      expect(result).toEqual(mockOrders);
      expect(mockOrderModel.find).toHaveBeenCalledWith({ userId: mockUserId });
    });

    it("should return empty array if no orders", async () => {
      mockOrderModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.findAllByUser(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe("findOne", () => {
    it("should return order by id", async () => {
      mockOrderModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockOrder),
      });

      const result = await service.findOne(mockOrderId);

      expect(result).toEqual(mockOrder);
    });

    it("should return order by id with userId filter", async () => {
      mockOrderModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockOrder),
      });

      const result = await service.findOne(mockOrderId, mockUserId);

      expect(result).toEqual(mockOrder);
      expect(mockOrderModel.findOne).toHaveBeenCalledWith({
        _id: mockOrderId,
        userId: mockUserId,
      });
    });

    it("should throw NotFoundException for invalid ObjectId", async () => {
      await expect(service.findOne("invalid-id")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw NotFoundException if order not found", async () => {
      mockOrderModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne(mockOrderId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("findByOrderNumber", () => {
    it("should return order by order number", async () => {
      mockOrderModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockOrder),
      });

      const result = await service.findByOrderNumber("ORD-ABC123-XYZ");

      expect(result).toEqual(mockOrder);
      expect(mockOrderModel.findOne).toHaveBeenCalledWith({
        orderNumber: "ORD-ABC123-XYZ",
      });
    });

    it("should throw NotFoundException if order not found", async () => {
      mockOrderModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findByOrderNumber("NON-EXISTENT")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("updateStatus", () => {
    const updateStatusDto = {
      status: "shipped",
      trackingNumber: "TRACK123",
      estimatedDelivery: "2025-12-01",
      notes: "Shipped via FedEx",
    };

    it("should update order status", async () => {
      const updatedOrder = { ...mockOrder, status: "shipped" };

      mockOrderModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedOrder),
      });

      const result = await service.updateStatus(mockOrderId, updateStatusDto);

      expect(result.status).toBe("shipped");
      expect(mockOrderModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockOrderId,
        expect.objectContaining({
          status: "shipped",
          trackingNumber: "TRACK123",
        }),
        { new: true },
      );
    });

    it("should throw NotFoundException for invalid ObjectId", async () => {
      await expect(
        service.updateStatus("invalid-id", updateStatusDto),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException if order not found", async () => {
      mockOrderModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.updateStatus(mockOrderId, updateStatusDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("updatePaymentStatus", () => {
    it("should update payment status to paid", async () => {
      const updatedOrder = {
        ...mockOrder,
        paymentStatus: "paid",
        status: "confirmed",
      };

      mockOrderModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedOrder),
      });

      const result = await service.updatePaymentStatus(
        mockOrderId,
        "paid",
        "payment-123",
      );

      expect(result.paymentStatus).toBe("paid");
      expect(result.status).toBe("confirmed");
      expect(mockOrderModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockOrderId,
        expect.objectContaining({
          paymentStatus: "paid",
          paymentId: "payment-123",
          status: "confirmed",
        }),
        { new: true },
      );
    });

    it("should update payment status to failed without changing order status", async () => {
      const updatedOrder = { ...mockOrder, paymentStatus: "failed" };

      mockOrderModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedOrder),
      });

      const result = await service.updatePaymentStatus(mockOrderId, "failed");

      expect(result.paymentStatus).toBe("failed");
      expect(mockOrderModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockOrderId,
        { paymentStatus: "failed" },
        { new: true },
      );
    });

    it("should throw NotFoundException if order not found", async () => {
      mockOrderModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.updatePaymentStatus(mockOrderId, "paid"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("cancelOrder", () => {
    it("should cancel a pending order", async () => {
      const pendingOrder = { ...mockOrder, status: "pending" };
      const cancelledOrder = { ...mockOrder, status: "cancelled" };

      mockOrderModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(pendingOrder),
      });
      mockOrderModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(cancelledOrder),
      });

      const result = await service.cancelOrder(mockOrderId, mockUserId);

      expect(result.status).toBe("cancelled");
    });

    it("should throw BadRequestException for shipped order", async () => {
      const shippedOrder = { ...mockOrder, status: "shipped" };

      mockOrderModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(shippedOrder),
      });

      await expect(
        service.cancelOrder(mockOrderId, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException for delivered order", async () => {
      const deliveredOrder = { ...mockOrder, status: "delivered" };

      mockOrderModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(deliveredOrder),
      });

      await expect(
        service.cancelOrder(mockOrderId, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException for already cancelled order", async () => {
      const cancelledOrder = { ...mockOrder, status: "cancelled" };

      mockOrderModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(cancelledOrder),
      });

      await expect(
        service.cancelOrder(mockOrderId, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("getOrderStats", () => {
    it("should return order statistics for a user", async () => {
      mockOrderModel.countDocuments
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(3) // pending
        .mockResolvedValueOnce(5); // completed
      mockOrderModel.aggregate.mockResolvedValue([{ total: 1500 }]);

      const result = await service.getOrderStats(mockUserId);

      expect(result).toEqual({
        totalOrders: 10,
        pendingOrders: 3,
        completedOrders: 5,
        totalRevenue: 1500,
      });
    });

    it("should return 0 revenue if no paid orders", async () => {
      mockOrderModel.countDocuments
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(0);
      mockOrderModel.aggregate.mockResolvedValue([]);

      const result = await service.getOrderStats(mockUserId);

      expect(result.totalRevenue).toBe(0);
    });

    it("should return stats for all users when userId not provided", async () => {
      mockOrderModel.countDocuments
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(60);
      mockOrderModel.aggregate.mockResolvedValue([{ total: 15000 }]);

      const result = await service.getOrderStats();

      expect(result.totalOrders).toBe(100);
      expect(mockOrderModel.countDocuments).toHaveBeenCalledWith({});
    });
  });
});
