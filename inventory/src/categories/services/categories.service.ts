import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CATEGORY_MODEL, CategoryDocument } from '../schemas/category.schema';
import { CreateCategoryDto } from '../dtos/create-category.dto';
import { UpdateCategoryDto } from '../dtos/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(CATEGORY_MODEL)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  async findAll(): Promise<CategoryDocument[]> {
    return this.categoryModel.find().lean(false).exec();
  }

  async findOne(id: string): Promise<CategoryDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Category not found');
    }
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async create(payload: CreateCategoryDto): Promise<CategoryDocument> {
    const created = await this.categoryModel.create(payload);
    return created;
  }

  async update(id: string, payload: UpdateCategoryDto): Promise<CategoryDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Category not found');
    }
    const updated = await this.categoryModel.findByIdAndUpdate(id, payload, { new: true }).exec();
    if (!updated) {
      throw new NotFoundException('Category not found');
    }
    return updated;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Category not found');
    }
    const res = await this.categoryModel.findByIdAndDelete(id).exec();
    if (!res) {
      throw new NotFoundException('Category not found');
    }
    return { deleted: true };
  }
}
