import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { CartService } from "./cart.service";
import { CART_MODEL, CartDocument } from "../schemas/cart.schema";

describe("CartService", () => {
  let service: CartService;
  let cartModel: Model<CartDocument>;

  const mockUserId = "user-123";

  const mockCartItem = {
    productId: "prod-1",
    name: "Test Product",
    price: 29.99,
    quantity: 2,
    imageUrl: "http://example.com/image.jpg",
  };

  const mockCart = {
    _id: "cart-123",
    userId: mockUserId,
    items: [mockCartItem],
    totalAmount: 59.98,
    itemCount: 2,
    save: jest.fn().mockResolvedValue(this),
  };

  const mockCartModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    new: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: getModelToken(CART_MODEL),
          useValue: mockCartModel,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    cartModel = module.get<Model<CartDocument>>(getModelToken(CART_MODEL));

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getCart", () => {
    it("should return existing cart for user", async () => {
      mockCartModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCart),
      });

      const result = await service.getCart(mockUserId);

      expect(result).toEqual(mockCart);
      expect(mockCartModel.findOne).toHaveBeenCalledWith({
        userId: mockUserId,
      });
    });

    it("should create new cart if none exists", async () => {
      const newCart = {
        userId: mockUserId,
        items: [],
        totalAmount: 0,
        itemCount: 0,
      };

      mockCartModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      mockCartModel.create.mockResolvedValue(newCart);

      const result = await service.getCart(mockUserId);

      expect(result).toEqual(newCart);
      expect(mockCartModel.create).toHaveBeenCalledWith({
        userId: mockUserId,
        items: [],
        totalAmount: 0,
        itemCount: 0,
      });
    });
  });

  describe("addToCart", () => {
    const addToCartDto = {
      productId: "prod-2",
      name: "New Product",
      price: 19.99,
      quantity: 1,
      imageUrl: "http://example.com/new.jpg",
    };

    it("should add new item to existing cart", async () => {
      const existingCart = {
        ...mockCart,
        items: [...mockCart.items],
        save: jest.fn().mockResolvedValue({
          ...mockCart,
          items: [...mockCart.items, addToCartDto],
        }),
      };

      mockCartModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingCart),
      });

      await service.addToCart(mockUserId, addToCartDto);

      expect(existingCart.items).toContainEqual(
        expect.objectContaining({
          productId: addToCartDto.productId,
        }),
      );
      expect(existingCart.save).toHaveBeenCalled();
    });

    it("should update quantity if item already exists in cart", async () => {
      const existingItemDto = {
        productId: "prod-1",
        name: "Test Product",
        price: 29.99,
        quantity: 3,
      };

      const existingCart = {
        ...mockCart,
        items: [{ ...mockCartItem }],
        save: jest.fn().mockResolvedValue(mockCart),
      };

      mockCartModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingCart),
      });

      await service.addToCart(mockUserId, existingItemDto);

      expect(existingCart.items[0].quantity).toBe(5); // 2 + 3
      expect(existingCart.save).toHaveBeenCalled();
    });

    it("should create new cart if none exists and add item", async () => {
      const newCart = {
        userId: mockUserId,
        items: [],
        save: jest.fn().mockResolvedValue(mockCart),
      };

      mockCartModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Mock the constructor behavior
      jest
        .spyOn(cartModel as any, "constructor")
        .mockImplementation(() => newCart);
      (cartModel as any).prototype = newCart;

      // For this test, we need to mock the model instantiation differently
      const MockCartModel = function (data: any) {
        return {
          ...data,
          items: [],
          save: jest.fn().mockResolvedValue(mockCart),
        };
      } as any;
      MockCartModel.findOne = mockCartModel.findOne;

      const testModule = await Test.createTestingModule({
        providers: [
          CartService,
          {
            provide: getModelToken(CART_MODEL),
            useValue: MockCartModel,
          },
        ],
      }).compile();

      const testService = testModule.get<CartService>(CartService);

      MockCartModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        testService.addToCart(mockUserId, addToCartDto),
      ).resolves.toBeDefined();
    });
  });

  describe("updateCartItem", () => {
    const updateDto = { quantity: 5 };

    it("should update item quantity in cart", async () => {
      const existingCart = {
        ...mockCart,
        items: [{ ...mockCartItem }],
        save: jest.fn().mockResolvedValue(mockCart),
      };

      mockCartModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingCart),
      });

      await service.updateCartItem(mockUserId, "prod-1", updateDto);

      expect(existingCart.items[0].quantity).toBe(5);
      expect(existingCart.save).toHaveBeenCalled();
    });

    it("should throw NotFoundException if cart not found", async () => {
      mockCartModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.updateCartItem(mockUserId, "prod-1", updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException if item not in cart", async () => {
      const existingCart = {
        ...mockCart,
        items: [{ ...mockCartItem }],
      };

      mockCartModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingCart),
      });

      await expect(
        service.updateCartItem(mockUserId, "non-existent-product", updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("removeFromCart", () => {
    it("should remove item from cart", async () => {
      const existingCart = {
        ...mockCart,
        items: [{ ...mockCartItem }],
        save: jest.fn().mockResolvedValue({ ...mockCart, items: [] }),
      };

      mockCartModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingCart),
      });

      await service.removeFromCart(mockUserId, "prod-1");

      expect(existingCart.items).toHaveLength(0);
      expect(existingCart.save).toHaveBeenCalled();
    });

    it("should throw NotFoundException if cart not found", async () => {
      mockCartModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.removeFromCart(mockUserId, "prod-1"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException if item not in cart", async () => {
      const existingCart = {
        ...mockCart,
        items: [{ ...mockCartItem }],
      };

      mockCartModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingCart),
      });

      await expect(
        service.removeFromCart(mockUserId, "non-existent-product"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("clearCart", () => {
    it("should clear all items from cart", async () => {
      const existingCart = {
        ...mockCart,
        items: [{ ...mockCartItem }],
        save: jest.fn().mockResolvedValue({ ...mockCart, items: [] }),
      };

      mockCartModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingCart),
      });

      await service.clearCart(mockUserId);

      expect(existingCart.items).toHaveLength(0);
      expect(existingCart.save).toHaveBeenCalled();
    });

    it("should throw NotFoundException if cart not found", async () => {
      mockCartModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.clearCart(mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("getCartForCheckout", () => {
    it("should return cart with items for checkout", async () => {
      mockCartModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCart),
      });

      const result = await service.getCartForCheckout(mockUserId);

      expect(result).toEqual(mockCart);
      expect(result.items.length).toBeGreaterThan(0);
    });

    it("should throw BadRequestException if cart is empty", async () => {
      const emptyCart = {
        ...mockCart,
        items: [],
      };

      mockCartModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(emptyCart),
      });

      await expect(service.getCartForCheckout(mockUserId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException if cart does not exist (creates empty)", async () => {
      mockCartModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      mockCartModel.create.mockResolvedValue({
        userId: mockUserId,
        items: [],
        totalAmount: 0,
        itemCount: 0,
      });

      await expect(service.getCartForCheckout(mockUserId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
