import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PRODUCT_MODEL, ProductDocument } from '../schemas/product.schema';
import { CreateProductDto } from '../dtos/create-product.dto';
import { UpdateProductDto } from '../dtos/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(PRODUCT_MODEL)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async findAll(): Promise<ProductDocument[]> {
    return this.productModel.find().lean(false).exec();
  }

  async findOne(id: string): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Product not found');
    }
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async findById(id: string): Promise<ProductDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.productModel.findById(id).exec();
  }

  async create(payload: CreateProductDto): Promise<ProductDocument> {
    const created = await this.productModel.create(payload);
    return created;
  }

  async update(
    id: string,
    payload: UpdateProductDto,
  ): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Product not found');
    }
    const updated = await this.productModel
      .findByIdAndUpdate(id, payload, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException('Product not found');
    }
    return updated;
  }

  async decrementStock(productId: string, by: number): Promise<void> {
    if (!Types.ObjectId.isValid(productId)) return;
    await this.productModel
      .findByIdAndUpdate(productId, { $inc: { stock: -Math.abs(by) } })
      .exec();
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Product not found');
    }
    const res = await this.productModel.findByIdAndDelete(id).exec();
    if (!res) {
      throw new NotFoundException('Product not found');
    }
    return { deleted: true };
  }
}
