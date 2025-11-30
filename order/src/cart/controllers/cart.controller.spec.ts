import { Test, TestingModule } from "@nestjs/testing";
import { CartController } from "./cart.controller";
import { CartService } from "../services/cart.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";

describe("CartController", () => {
  let controller: CartController;

  const mockUserId = "user-123";

  const mockRequest = {
    user: {
      userId: mockUserId,
      email: "test@example.com",
    },
  } as any;

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
  };

  const mockCartService = {
    getCart: jest.fn(),
    addToCart: jest.fn(),
    updateCartItem: jest.fn(),
    removeFromCart: jest.fn(),
    clearCart: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [
        {
          provide: CartService,
          useValue: mockCartService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CartController>(CartController);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getCart", () => {
    it("should return the user cart", async () => {
      mockCartService.getCart.mockResolvedValue(mockCart);

      const result = await controller.getCart(mockRequest);

      expect(result).toEqual(mockCart);
      expect(mockCartService.getCart).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe("addToCart", () => {
    const addToCartDto = {
      productId: "prod-2",
      name: "New Product",
      price: 19.99,
      quantity: 1,
    };

    it("should add item to cart", async () => {
      const updatedCart = {
        ...mockCart,
        items: [...mockCart.items, addToCartDto],
      };
      mockCartService.addToCart.mockResolvedValue(updatedCart);

      const result = await controller.addToCart(mockRequest, addToCartDto);

      expect(result).toEqual(updatedCart);
      expect(mockCartService.addToCart).toHaveBeenCalledWith(
        mockUserId,
        addToCartDto,
      );
    });
  });

  describe("updateCartItem", () => {
    const updateDto = { quantity: 5 };
    const productId = "prod-1";

    it("should update item quantity", async () => {
      const updatedCart = {
        ...mockCart,
        items: [{ ...mockCartItem, quantity: 5 }],
      };
      mockCartService.updateCartItem.mockResolvedValue(updatedCart);

      const result = await controller.updateCartItem(
        mockRequest,
        productId,
        updateDto,
      );

      expect(result).toEqual(updatedCart);
      expect(mockCartService.updateCartItem).toHaveBeenCalledWith(
        mockUserId,
        productId,
        updateDto,
      );
    });
  });

  describe("removeFromCart", () => {
    const productId = "prod-1";

    it("should remove item from cart", async () => {
      const updatedCart = { ...mockCart, items: [] };
      mockCartService.removeFromCart.mockResolvedValue(updatedCart);

      const result = await controller.removeFromCart(mockRequest, productId);

      expect(result).toEqual(updatedCart);
      expect(mockCartService.removeFromCart).toHaveBeenCalledWith(
        mockUserId,
        productId,
      );
    });
  });

  describe("clearCart", () => {
    it("should clear all items from cart", async () => {
      const clearedCart = {
        ...mockCart,
        items: [],
        totalAmount: 0,
        itemCount: 0,
      };
      mockCartService.clearCart.mockResolvedValue(clearedCart);

      const result = await controller.clearCart(mockRequest);

      expect(result).toEqual(clearedCart);
      expect(mockCartService.clearCart).toHaveBeenCalledWith(mockUserId);
    });
  });
});
