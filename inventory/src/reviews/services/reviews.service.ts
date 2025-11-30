import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { REVIEW_MODEL, ReviewDocument } from '../schemas/review.schema';
import { ProductRatingSummary } from '../interfaces/review.interface';
import { CreateReviewDto } from '../dtos/create-review.dto';
import { UpdateReviewDto } from '../dtos/update-review.dto';
import { ProductsService } from '../../products/services/products.service';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    @InjectModel(REVIEW_MODEL)
    private readonly reviewModel: Model<ReviewDocument>,
    private readonly productsService: ProductsService,
  ) {}

  async create(
    userId: string,
    userName: string,
    dto: CreateReviewDto,
  ): Promise<ReviewDocument> {
    const product = await this.productsService.findById(dto.productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existingReview = await this.reviewModel.findOne({
      productId: dto.productId,
      userId,
    });

    if (existingReview) {
      throw new ConflictException('You have already reviewed this product');
    }

    const review = await this.reviewModel.create({
      ...dto,
      userId,
      userName,
      isVerifiedPurchase: false,
      status: 'approved',
    });

    await this.updateProductRating(dto.productId);

    this.logger.log(
      `Review created for product ${dto.productId} by user ${userId}`,
    );

    return review;
  }

  async findByProduct(
    productId: string,
    page = 1,
    limit = 10,
    sortBy: 'recent' | 'helpful' | 'rating-high' | 'rating-low' = 'recent',
  ): Promise<{
    reviews: ReviewDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    switch (sortBy) {
      case 'helpful':
        sortOption = { helpfulVotes: -1, createdAt: -1 };
        break;
      case 'rating-high':
        sortOption = { rating: -1, createdAt: -1 };
        break;
      case 'rating-low':
        sortOption = { rating: 1, createdAt: -1 };
        break;
    }

    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find({ productId, status: 'approved' })
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(false)
        .exec(),
      this.reviewModel.countDocuments({ productId, status: 'approved' }),
    ]);

    return {
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByUser(userId: string): Promise<ReviewDocument[]> {
    return this.reviewModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .lean(false)
      .exec();
  }

  async findOne(id: string): Promise<ReviewDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Review not found');
    }

    const review = await this.reviewModel.findById(id).exec();
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateReviewDto,
  ): Promise<ReviewDocument> {
    const review = await this.findOne(id);

    if (review.userId !== userId) {
      throw new BadRequestException('You can only update your own reviews');
    }

    const updated = await this.reviewModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();

    if (dto.rating !== undefined) {
      await this.updateProductRating(review.productId);
    }

    return updated!;
  }

  async delete(id: string, userId: string): Promise<{ deleted: boolean }> {
    const review = await this.findOne(id);

    if (review.userId !== userId) {
      throw new BadRequestException('You can only delete your own reviews');
    }

    await this.reviewModel.findByIdAndDelete(id).exec();
    await this.updateProductRating(review.productId);

    return { deleted: true };
  }

  async markHelpful(reviewId: string, userId: string): Promise<ReviewDocument> {
    const review = await this.findOne(reviewId);

    if (review.userId === userId) {
      throw new BadRequestException(
        'You cannot mark your own review as helpful',
      );
    }

    if (review.helpfulVoters.includes(userId)) {
      throw new BadRequestException(
        'You have already marked this review as helpful',
      );
    }

    const updated = await this.reviewModel
      .findByIdAndUpdate(
        reviewId,
        {
          $inc: { helpfulVotes: 1 },
          $push: { helpfulVoters: userId },
        },
        { new: true },
      )
      .exec();

    return updated!;
  }

  async unmarkHelpful(
    reviewId: string,
    userId: string,
  ): Promise<ReviewDocument> {
    const review = await this.findOne(reviewId);

    if (!review.helpfulVoters.includes(userId)) {
      throw new BadRequestException(
        'You have not marked this review as helpful',
      );
    }

    const updated = await this.reviewModel
      .findByIdAndUpdate(
        reviewId,
        {
          $inc: { helpfulVotes: -1 },
          $pull: { helpfulVoters: userId },
        },
        { new: true },
      )
      .exec();

    return updated!;
  }

  async getProductRatingSummary(
    productId: string,
  ): Promise<ProductRatingSummary> {
    const result = await this.reviewModel.aggregate([
      { $match: { productId, status: 'approved' } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          rating1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
          rating2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          rating3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          rating4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          rating5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
        },
      },
    ]);

    if (result.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const data = result[0];
    return {
      averageRating: Math.round(data.averageRating * 10) / 10,
      totalReviews: data.totalReviews,
      ratingDistribution: {
        1: data.rating1,
        2: data.rating2,
        3: data.rating3,
        4: data.rating4,
        5: data.rating5,
      },
    };
  }

  private async updateProductRating(productId: string): Promise<void> {
    const summary = await this.getProductRatingSummary(productId);

    await this.productsService.updateRating(
      productId,
      summary.averageRating,
      summary.totalReviews,
    );
  }
}
