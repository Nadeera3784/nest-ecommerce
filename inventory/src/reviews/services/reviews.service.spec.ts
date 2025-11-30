import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ReviewsService } from './reviews.service';
import { REVIEW_MODEL } from '../schemas/review.schema';
import { ProductsService } from '../../products/services/products.service';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let reviewModel: any;
  let productsService: jest.Mocked<ProductsService>;

  const mockReview = {
    _id: 'review-123',
    productId: 'product-123',
    userId: 'user-123',
    userName: 'John Doe',
    rating: 5,
    title: 'Great product',
    comment: 'This is an amazing product, highly recommend!',
    images: [],
    isVerifiedPurchase: false,
    helpfulVotes: 0,
    helpfulVoters: [],
    status: 'approved',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProduct = {
    _id: 'product-123',
    name: 'Test Product',
    price: 99.99,
    stock: 10,
  };

  beforeEach(async () => {
    const mockReviewModel = {
      create: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      countDocuments: jest.fn(),
      aggregate: jest.fn(),
    };

    const mockProductsService = {
      findById: jest.fn(),
      updateRating: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: getModelToken(REVIEW_MODEL),
          useValue: mockReviewModel,
        },
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    reviewModel = module.get(getModelToken(REVIEW_MODEL));
    productsService = module.get(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new review', async () => {
      productsService.findById.mockResolvedValue(mockProduct as any);
      reviewModel.findOne.mockResolvedValue(null);
      reviewModel.create.mockResolvedValue(mockReview);
      reviewModel.aggregate.mockResolvedValue([
        {
          averageRating: 5,
          totalReviews: 1,
          rating1: 0,
          rating2: 0,
          rating3: 0,
          rating4: 0,
          rating5: 1,
        },
      ]);
      productsService.updateRating.mockResolvedValue(undefined);

      const result = await service.create('user-123', 'John Doe', {
        productId: 'product-123',
        rating: 5,
        title: 'Great product',
        comment: 'This is an amazing product, highly recommend!',
      });

      expect(result).toEqual(mockReview);
      expect(productsService.findById).toHaveBeenCalledWith('product-123');
      expect(reviewModel.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if product not found', async () => {
      productsService.findById.mockResolvedValue(null);

      await expect(
        service.create('user-123', 'John Doe', {
          productId: 'invalid-product',
          rating: 5,
          title: 'Great product',
          comment: 'This is an amazing product, highly recommend!',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if user already reviewed', async () => {
      productsService.findById.mockResolvedValue(mockProduct as any);
      reviewModel.findOne.mockResolvedValue(mockReview);

      await expect(
        service.create('user-123', 'John Doe', {
          productId: 'product-123',
          rating: 5,
          title: 'Another review',
          comment: 'Trying to review again...',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findByProduct', () => {
    it('should return paginated reviews for a product', async () => {
      const reviews = [mockReview];
      reviewModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(reviews),
      });
      reviewModel.countDocuments.mockResolvedValue(1);

      const result = await service.findByProduct(
        'product-123',
        1,
        10,
        'recent',
      );

      expect(result).toEqual({
        reviews,
        total: 1,
        page: 1,
        totalPages: 1,
      });
    });

    it('should sort by helpful votes', async () => {
      reviewModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });
      reviewModel.countDocuments.mockResolvedValue(0);

      await service.findByProduct('product-123', 1, 10, 'helpful');

      expect(reviewModel.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a review by id', async () => {
      reviewModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockReview),
      });

      const result = await service.findOne('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockReview);
    });

    it('should throw NotFoundException for invalid id', async () => {
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if review not found', async () => {
      reviewModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('507f1f77bcf86cd799439011')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update own review', async () => {
      const updatedReview = { ...mockReview, rating: 4 };
      reviewModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockReview),
      });
      reviewModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedReview),
      });
      reviewModel.aggregate.mockResolvedValue([
        {
          averageRating: 4,
          totalReviews: 1,
          rating1: 0,
          rating2: 0,
          rating3: 0,
          rating4: 1,
          rating5: 0,
        },
      ]);
      productsService.updateRating.mockResolvedValue(undefined);

      const result = await service.update(
        '507f1f77bcf86cd799439011',
        'user-123',
        { rating: 4 },
      );

      expect(result.rating).toBe(4);
    });

    it('should throw BadRequestException when updating other user review', async () => {
      reviewModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockReview),
      });

      await expect(
        service.update('507f1f77bcf86cd799439011', 'other-user', { rating: 1 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('should delete own review', async () => {
      reviewModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockReview),
      });
      reviewModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockReview),
      });
      reviewModel.aggregate.mockResolvedValue([]);
      productsService.updateRating.mockResolvedValue(undefined);

      const result = await service.delete(
        '507f1f77bcf86cd799439011',
        'user-123',
      );

      expect(result).toEqual({ deleted: true });
    });

    it('should throw BadRequestException when deleting other user review', async () => {
      reviewModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockReview),
      });

      await expect(
        service.delete('507f1f77bcf86cd799439011', 'other-user'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('markHelpful', () => {
    it('should mark review as helpful', async () => {
      const updatedReview = {
        ...mockReview,
        helpfulVotes: 1,
        helpfulVoters: ['voter-123'],
      };
      reviewModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockReview),
      });
      reviewModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedReview),
      });

      const result = await service.markHelpful(
        '507f1f77bcf86cd799439011',
        'voter-123',
      );

      expect(result.helpfulVotes).toBe(1);
    });

    it('should throw BadRequestException when marking own review', async () => {
      reviewModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockReview),
      });

      await expect(
        service.markHelpful('507f1f77bcf86cd799439011', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when already voted', async () => {
      const reviewWithVote = {
        ...mockReview,
        helpfulVoters: ['voter-123'],
      };
      reviewModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(reviewWithVote),
      });

      await expect(
        service.markHelpful('507f1f77bcf86cd799439011', 'voter-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getProductRatingSummary', () => {
    it('should return rating summary', async () => {
      reviewModel.aggregate.mockResolvedValue([
        {
          averageRating: 4.5,
          totalReviews: 10,
          rating1: 0,
          rating2: 1,
          rating3: 1,
          rating4: 3,
          rating5: 5,
        },
      ]);

      const result = await service.getProductRatingSummary('product-123');

      expect(result).toEqual({
        averageRating: 4.5,
        totalReviews: 10,
        ratingDistribution: { 1: 0, 2: 1, 3: 1, 4: 3, 5: 5 },
      });
    });

    it('should return empty summary for product with no reviews', async () => {
      reviewModel.aggregate.mockResolvedValue([]);

      const result = await service.getProductRatingSummary('product-123');

      expect(result).toEqual({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      });
    });
  });
});
