import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Req,
  UseGuards,
} from "@nestjs/common";
import { OrdersService } from "../services/orders.service";
import { CreateOrderDto } from "../dtos/create-order.dto";
import { UpdateOrderStatusDto } from "../dtos/update-order-status.dto";
import { AuthenticatedRequest } from "../../common/interfaces";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";

@Controller("orders")
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post("checkout")
  async checkout(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(req.user.userId, dto);
  }

  @Get()
  async getOrders(@Req() req: AuthenticatedRequest) {
    return this.ordersService.findAllByUser(req.user.userId);
  }

  @Get("stats")
  async getStats(@Req() req: AuthenticatedRequest) {
    return this.ordersService.getOrderStats(req.user.userId);
  }

  @Get(":id")
  async getOrder(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.ordersService.findOne(id, req.user.userId);
  }

  @Get("number/:orderNumber")
  async getOrderByNumber(
    @Req() req: AuthenticatedRequest,
    @Param("orderNumber") orderNumber: string,
  ) {
    return this.ordersService.findByOrderNumber(orderNumber, req.user.userId);
  }

  @Put(":id/status")
  async updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    // Note: In production, add admin role guard here
    return this.ordersService.updateStatus(id, dto);
  }

  @Post(":id/cancel")
  async cancelOrder(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.ordersService.cancelOrder(id, req.user.userId);
  }
}
