import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  ORDER_MODEL,
  OrderDocument,
  OrderStatus,
} from "../schemas/order.schema";
import { CreateOrderDto } from "../dtos/create-order.dto";
import { UpdateOrderStatusDto } from "../dtos/update-order-status.dto";
import { CartService } from "../../cart/services/cart.service";

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(ORDER_MODEL)
    private readonly orderModel: Model<OrderDocument>,
    private readonly cartService: CartService,
  ) {}

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  private calculateTax(subtotal: number): number {
    return Math.round(subtotal * 0.1 * 100) / 100;
  }

  async createOrder(
    userId: string,
    dto: CreateOrderDto,
  ): Promise<OrderDocument> {
    const cart = await this.cartService.getCartForCheckout(userId);

    const subtotal = cart.totalAmount;
    const shippingCost = dto.shippingCost ?? 0;
    const tax = this.calculateTax(subtotal);
    const totalAmount = subtotal + shippingCost + tax;

    const order = await this.orderModel.create({
      orderNumber: this.generateOrderNumber(),
      userId,
      items: cart.items.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
      })),
      shippingAddress: dto.shippingAddress,
      subtotal,
      shippingCost,
      tax,
      totalAmount,
      status: "pending",
      paymentStatus: "pending",
      notes: dto.notes,
    });

    await this.cartService.clearCart(userId);

    return order;
  }

  async findAllByUser(userId: string): Promise<OrderDocument[]> {
    return this.orderModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .lean(false)
      .exec();
  }

  async findOne(id: string, userId?: string): Promise<OrderDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException("Order not found");
    }

    const query: any = { _id: id };
    if (userId) {
      query.userId = userId;
    }

    const order = await this.orderModel.findOne(query).exec();
    if (!order) {
      throw new NotFoundException("Order not found");
    }

    return order;
  }

  async findByOrderNumber(
    orderNumber: string,
    userId?: string,
  ): Promise<OrderDocument> {
    const query: any = { orderNumber };
    if (userId) {
      query.userId = userId;
    }

    const order = await this.orderModel.findOne(query).exec();
    if (!order) {
      throw new NotFoundException("Order not found");
    }

    return order;
  }

  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
  ): Promise<OrderDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException("Order not found");
    }

    const updateData: any = { status: dto.status };
    if (dto.trackingNumber) {
      updateData.trackingNumber = dto.trackingNumber;
    }
    if (dto.estimatedDelivery) {
      updateData.estimatedDelivery = new Date(dto.estimatedDelivery);
    }
    if (dto.notes) {
      updateData.notes = dto.notes;
    }

    const order = await this.orderModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    return order;
  }

  async updatePaymentStatus(
    orderId: string,
    paymentStatus: "pending" | "paid" | "failed" | "refunded",
    paymentId?: string,
  ): Promise<OrderDocument> {
    const updateData: any = { paymentStatus };
    if (paymentId) {
      updateData.paymentId = paymentId;
    }
    if (paymentStatus === "paid") {
      updateData.status = "confirmed";
    }

    const order = await this.orderModel
      .findByIdAndUpdate(orderId, updateData, { new: true })
      .exec();

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    return order;
  }

  async cancelOrder(id: string, userId: string): Promise<OrderDocument> {
    const order = await this.findOne(id, userId);

    const nonCancellableStatuses: OrderStatus[] = [
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ];
    if (nonCancellableStatuses.includes(order.status)) {
      throw new BadRequestException(
        `Cannot cancel order with status: ${order.status}`,
      );
    }

    const updated = await this.orderModel
      .findByIdAndUpdate(id, { status: "cancelled" }, { new: true })
      .exec();

    return updated!;
  }

  async getOrderStats(userId?: string): Promise<{
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalRevenue: number;
  }> {
    const query = userId ? { userId } : {};

    const [totalOrders, pendingOrders, completedOrders, revenueResult] =
      await Promise.all([
        this.orderModel.countDocuments(query),
        this.orderModel.countDocuments({ ...query, status: "pending" }),
        this.orderModel.countDocuments({ ...query, status: "delivered" }),
        this.orderModel.aggregate([
          { $match: { ...query, paymentStatus: "paid" } },
          { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]),
      ]);

    return {
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue: revenueResult[0]?.total ?? 0,
    };
  }
}
