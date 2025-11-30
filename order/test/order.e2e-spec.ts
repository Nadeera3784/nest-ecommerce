import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { getModelToken } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ApplicationModule } from "../src/app.module";
import { CART_MODEL } from "../src/cart/schemas/cart.schema";
import { ORDER_MODEL } from "../src/orders/schemas/order.schema";
import { JwtAuthGuard } from "../src/auth/guards/jwt-auth.guard";

describe("Order Module (e2e)", () => {
  let app: INestApplication;
  let cartModel: Model<any>;
  let orderModel: Model<any>;

  const mockUserId = "test-user-123";

  // Mock JWT Guard to always authenticate
  const mockJwtAuthGuard = {
    canActivate: (context) => {
      const request = context.switchToHttp().getRequest();
      request.user = { userId: mockUserId, email: "test@example.com" };
      return true;
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ApplicationModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    cartModel = moduleFixture.get<Model<any>>(getModelToken(CART_MODEL));
    orderModel = moduleFixture.get<Model<any>>(getModelToken(ORDER_MODEL));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up before each test
    if (cartModel) await cartModel.deleteMany({});
    if (orderModel) await orderModel.deleteMany({});
  });

  describe("Health Check", () => {
    it("/ (GET) - should return health status", () => {
      return request(app.getHttpServer())
        .get("/")
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe("ok");
          expect(res.body.service).toBe("order");
        });
    });
  });

  describe("Cart Endpoints", () => {
    describe("GET /cart", () => {
      it("should return empty cart for new user", () => {
        return request(app.getHttpServer())
          .get("/cart")
          .expect(200)
          .expect((res) => {
            expect(res.body.items).toEqual([]);
            expect(res.body.userId).toBe(mockUserId);
          });
      });
    });

    describe("POST /cart/add", () => {
      it("should add item to cart", () => {
        const addToCartDto = {
          productId: "prod-123",
          name: "Test Product",
          price: 29.99,
          quantity: 2,
        };

        return request(app.getHttpServer())
          .post("/cart/add")
          .send(addToCartDto)
          .expect(201)
          .expect((res) => {
            expect(res.body.items).toHaveLength(1);
            expect(res.body.items[0].productId).toBe(addToCartDto.productId);
            expect(res.body.items[0].quantity).toBe(addToCartDto.quantity);
          });
      });

      it("should validate required fields", () => {
        return request(app.getHttpServer())
          .post("/cart/add")
          .send({})
          .expect(400);
      });

      it("should validate price is non-negative", () => {
        return request(app.getHttpServer())
          .post("/cart/add")
          .send({
            productId: "prod-123",
            name: "Test",
            price: -10,
            quantity: 1,
          })
          .expect(400);
      });

      it("should validate quantity is at least 1", () => {
        return request(app.getHttpServer())
          .post("/cart/add")
          .send({
            productId: "prod-123",
            name: "Test",
            price: 10,
            quantity: 0,
          })
          .expect(400);
      });
    });

    describe("PUT /cart/:productId", () => {
      it("should update item quantity", async () => {
        // First add an item
        await request(app.getHttpServer()).post("/cart/add").send({
          productId: "prod-123",
          name: "Test Product",
          price: 29.99,
          quantity: 2,
        });

        // Then update its quantity
        return request(app.getHttpServer())
          .put("/cart/prod-123")
          .send({ quantity: 5 })
          .expect(200)
          .expect((res) => {
            expect(res.body.items[0].quantity).toBe(5);
          });
      });

      it("should return 404 for non-existent item", () => {
        return request(app.getHttpServer())
          .put("/cart/non-existent")
          .send({ quantity: 5 })
          .expect(404);
      });
    });

    describe("DELETE /cart/:productId", () => {
      it("should remove item from cart", async () => {
        // First add an item
        await request(app.getHttpServer()).post("/cart/add").send({
          productId: "prod-123",
          name: "Test Product",
          price: 29.99,
          quantity: 2,
        });

        // Then remove it
        return request(app.getHttpServer())
          .delete("/cart/prod-123")
          .expect(200)
          .expect((res) => {
            expect(res.body.items).toHaveLength(0);
          });
      });
    });

    describe("DELETE /cart", () => {
      it("should clear all items from cart", async () => {
        // Add multiple items
        await request(app.getHttpServer()).post("/cart/add").send({
          productId: "prod-1",
          name: "Product 1",
          price: 10,
          quantity: 1,
        });
        await request(app.getHttpServer()).post("/cart/add").send({
          productId: "prod-2",
          name: "Product 2",
          price: 20,
          quantity: 2,
        });

        // Clear cart
        return request(app.getHttpServer())
          .delete("/cart")
          .expect(200)
          .expect((res) => {
            expect(res.body.items).toHaveLength(0);
          });
      });
    });
  });

  describe("Orders Endpoints", () => {
    const shippingAddress = {
      fullName: "John Doe",
      addressLine1: "123 Main St",
      city: "New York",
      state: "NY",
      postalCode: "10001",
      country: "USA",
      phone: "+1234567890",
    };

    describe("POST /orders/checkout", () => {
      it("should create order from cart", async () => {
        // Add items to cart first
        await request(app.getHttpServer()).post("/cart/add").send({
          productId: "prod-123",
          name: "Test Product",
          price: 100,
          quantity: 2,
        });

        return request(app.getHttpServer())
          .post("/orders/checkout")
          .send({
            shippingAddress,
            shippingCost: 10,
          })
          .expect(201)
          .expect((res) => {
            expect(res.body.orderNumber).toMatch(/^ORD-/);
            expect(res.body.status).toBe("pending");
            expect(res.body.paymentStatus).toBe("pending");
            expect(res.body.subtotal).toBe(200);
            expect(res.body.tax).toBe(20); // 10% of 200
            expect(res.body.totalAmount).toBe(230); // 200 + 10 + 20
          });
      });

      it("should return 400 for empty cart", () => {
        return request(app.getHttpServer())
          .post("/orders/checkout")
          .send({ shippingAddress })
          .expect(400);
      });

      it("should validate shipping address", () => {
        return request(app.getHttpServer())
          .post("/orders/checkout")
          .send({
            shippingAddress: { fullName: "John" }, // Missing required fields
          })
          .expect(400);
      });
    });

    describe("GET /orders", () => {
      it("should return user orders", async () => {
        // Create an order first
        await request(app.getHttpServer()).post("/cart/add").send({
          productId: "prod-123",
          name: "Test Product",
          price: 100,
          quantity: 1,
        });
        await request(app.getHttpServer())
          .post("/orders/checkout")
          .send({ shippingAddress });

        return request(app.getHttpServer())
          .get("/orders")
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
          });
      });
    });

    describe("GET /orders/stats", () => {
      it("should return order statistics", () => {
        return request(app.getHttpServer())
          .get("/orders/stats")
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty("totalOrders");
            expect(res.body).toHaveProperty("pendingOrders");
            expect(res.body).toHaveProperty("completedOrders");
            expect(res.body).toHaveProperty("totalRevenue");
          });
      });
    });

    describe("POST /orders/:id/cancel", () => {
      it("should cancel a pending order", async () => {
        // Create an order
        await request(app.getHttpServer()).post("/cart/add").send({
          productId: "prod-123",
          name: "Test Product",
          price: 100,
          quantity: 1,
        });
        const orderRes = await request(app.getHttpServer())
          .post("/orders/checkout")
          .send({ shippingAddress });

        const orderId = orderRes.body._id;

        return request(app.getHttpServer())
          .post(`/orders/${orderId}/cancel`)
          .expect(201)
          .expect((res) => {
            expect(res.body.status).toBe("cancelled");
          });
      });
    });
  });
});
