import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from '../interfaces/user.interface';
import { UpdateUserDto } from '../dtos/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<UserDocument>,
  ) {}

  async findAll(
    limit: number = 10,
    skip: number = 0,
  ): Promise<{ users: UserDocument[]; total: number }> {
    const [users, total] = await Promise.all([
      this.userModel
        .find({ is_active: true })
        .select('-password -salt -reset_password_token')
        .limit(limit)
        .skip(skip)
        .sort({ createdAt: -1 })
        .exec(),
      this.userModel.countDocuments({ is_active: true }),
    ]);

    return { users, total };
  }

  async findById(userId: string): Promise<UserDocument> {
    const user = await this.userModel
      .findById(userId)
      .select('-password -salt -reset_password_token')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async update(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.first_name !== undefined) {
      user.first_name = updateUserDto.first_name;
    }
    if (updateUserDto.last_name !== undefined) {
      user.last_name = updateUserDto.last_name;
    }
    if (updateUserDto.is_active !== undefined) {
      user.is_active = updateUserDto.is_active;
    }

    await user.save();

    return this.findById(userId);
  }

  async delete(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.is_active = false;
    await user.save();
  }

  async hardDelete(userId: string): Promise<void> {
    const result = await this.userModel.deleteOne({ _id: userId });

    if (result.deletedCount === 0) {
      throw new NotFoundException('User not found');
    }
  }
}

