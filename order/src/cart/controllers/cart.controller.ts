import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from "@nestjs/common";
import { CartService } from "../services/cart.service";
import { AddToCartDto } from "../dtos/add-to-cart.dto";
import { UpdateCartItemDto } from "../dtos/update-cart-item.dto";
import { AuthenticatedRequest } from "../../common/interfaces";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";

@Controller("cart")
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@Req() req: AuthenticatedRequest) {
    return this.cartService.getCart(req.user.userId);
  }

  @Post("add")
  async addToCart(@Req() req: AuthenticatedRequest, @Body() dto: AddToCartDto) {
    return this.cartService.addToCart(req.user.userId, dto);
  }

  @Put(":productId")
  async updateCartItem(
    @Req() req: AuthenticatedRequest,
    @Param("productId") productId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateCartItem(req.user.userId, productId, dto);
  }

  @Delete(":productId")
  async removeFromCart(
    @Req() req: AuthenticatedRequest,
    @Param("productId") productId: string,
  ) {
    return this.cartService.removeFromCart(req.user.userId, productId);
  }

  @Delete()
  async clearCart(@Req() req: AuthenticatedRequest) {
    return this.cartService.clearCart(req.user.userId);
  }
}
