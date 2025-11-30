import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CART_MODEL, CartDocument, CartItem } from "../schemas/cart.schema";
import { AddToCartDto } from "../dtos/add-to-cart.dto";
import { UpdateCartItemDto } from "../dtos/update-cart-item.dto";

@Injectable()
export class CartService {
  constructor(
    @InjectModel(CART_MODEL)
    private readonly cartModel: Model<CartDocument>,
  ) {}

  async getCart(userId: string): Promise<CartDocument> {
    let cart = await this.cartModel.findOne({ userId }).exec();

    if (!cart) {
      cart = await this.cartModel.create({
        userId,
        items: [],
        totalAmount: 0,
        itemCount: 0,
      });
    }

    return cart;
  }

  async addToCart(userId: string, dto: AddToCartDto): Promise<CartDocument> {
    let cart = await this.cartModel.findOne({ userId }).exec();

    if (!cart) {
      cart = new this.cartModel({
        userId,
        items: [],
      });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId === dto.productId,
    );

    if (existingItemIndex > -1) {
      // Update quantity if item exists
      cart.items[existingItemIndex].quantity += dto.quantity;
      cart.items[existingItemIndex].price = dto.price; // Update price in case it changed
    } else {
      // Add new item
      const newItem: CartItem = {
        productId: dto.productId,
        name: dto.name,
        price: dto.price,
        quantity: dto.quantity,
        imageUrl: dto.imageUrl,
      };
      cart.items.push(newItem);
    }

    await cart.save();
    return cart;
  }

  async updateCartItem(
    userId: string,
    productId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartDocument> {
    const cart = await this.cartModel.findOne({ userId }).exec();

    if (!cart) {
      throw new NotFoundException("Cart not found");
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId === productId,
    );

    if (itemIndex === -1) {
      throw new NotFoundException("Item not found in cart");
    }

    cart.items[itemIndex].quantity = dto.quantity;
    await cart.save();

    return cart;
  }

  async removeFromCart(
    userId: string,
    productId: string,
  ): Promise<CartDocument> {
    const cart = await this.cartModel.findOne({ userId }).exec();

    if (!cart) {
      throw new NotFoundException("Cart not found");
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId === productId,
    );

    if (itemIndex === -1) {
      throw new NotFoundException("Item not found in cart");
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    return cart;
  }

  async clearCart(userId: string): Promise<CartDocument> {
    const cart = await this.cartModel.findOne({ userId }).exec();

    if (!cart) {
      throw new NotFoundException("Cart not found");
    }

    cart.items = [];
    await cart.save();

    return cart;
  }

  async getCartForCheckout(userId: string): Promise<CartDocument> {
    const cart = await this.getCart(userId);

    if (cart.items.length === 0) {
      throw new BadRequestException("Cart is empty");
    }

    return cart;
  }
}
