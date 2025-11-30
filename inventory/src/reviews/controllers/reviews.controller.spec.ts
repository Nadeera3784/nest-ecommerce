import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from '../services/reviews.service';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';

describe('ReviewsController', () => {
  let controller: ReviewsController;
  let reviewsService: jest.Mocked<ReviewsService>;

  const mockReview = {
    _id: 'review-123',
    productId: 'product-123',
    userId: 'user-123',
    userName: 'John Doe',
    rating: 5,
    title: 'Great product',
    comment: 'This is an amazing product!',
    images: [],
    isVerifiedPurchase: false,
    helpfulVotes: 0,
    helpfulVoters: [],
    status: 'approved',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRequest = {
    user: {
      userId: 'user-123',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
    },
  } as AuthenticatedRequest;

  beforeEach(async () => {
    const mockReviewsService = {
      create: jest.fn(),
      findByProduct: jest.fn(),
      findByUser: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      markHelpful: jest.fn(),
      unmarkHelpful: jest.fn(),
      getProductRatingSummary: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewsController],
      providers: [
        {
          provide: ReviewsService,
          useValue: mockReviewsService,
        },
      ],
    }).compile();

    controller = module.get<ReviewsController>(ReviewsController);
    reviewsService = module.get(ReviewsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new review', async () => {
      reviewsService.create.mockResolvedValue(mockReview as any);

      const result = await controller.create(mockRequest, {
        productId: 'product-123',
        rating: 5,
        title: 'Great product',
        comment: 'This is an amazing product!',
      });

      expect(result).toEqual(mockReview);
      expect(reviewsService.create).toHaveBeenCalledWith(
        'user-123',
        'John Doe',
        expect.any(Object),
      );
    });

    it('should use email prefix if no name provided', async () => {
      const requestWithoutName = {
        user: {
          userId: 'user-123',
          email: 'john@example.com',
        },
      } as AuthenticatedRequest;

      reviewsService.create.mockResolvedValue(mockReview as any);

      await controller.create(requestWithoutName, {
        productId: 'product-123',
        rating: 5,
        title: 'Great product',
        comment: 'This is an amazing product!',
      });

      expect(reviewsService.create).toHaveBeenCalledWith(
        'user-123',
        'john',
        expect.any(Object),
      );
    });
  });

  describe('findByProduct', () => {
    it('should return paginated reviews', async () => {
      const paginatedResult = {
        reviews: [mockReview],
        total: 1,
        page: 1,
        totalPages: 1,
      };
      reviewsService.findByProduct.mockResolvedValue(paginatedResult as any);

      const result = await controller.findByProduct(
        'product-123',
        '1',
        '10',
        'recent',
      );

      expect(result).toEqual(paginatedResult);
      expect(reviewsService.findByProduct).toHaveBeenCalledWith(
        'product-123',
        1,
        10,
        'recent',
      );
    });

    it('should use default values when not provided', async () => {
      reviewsService.findByProduct.mockResolvedValue({
        reviews: [],
        total: 0,
        page: 1,
        totalPages: 0,
      } as any);

      await controller.findByProduct('product-123');

      expect(reviewsService.findByProduct).toHaveBeenCalledWith(
        'product-123',
        1,
        10,
        'recent',
      );
    });
  });

  describe('getProductRatingSummary', () => {
    it('should return rating summary', async () => {
      const summary = {
        averageRating: 4.5,
        totalReviews: 10,
        ratingDistribution: { 1: 0, 2: 1, 3: 1, 4: 3, 5: 5 },
      };
      reviewsService.getProductRatingSummary.mockResolvedValue(summary);

      const result = await controller.getProductRatingSummary('product-123');

      expect(result).toEqual(summary);
    });
  });

  describe('findMyReviews', () => {
    it('should return user reviews', async () => {
      reviewsService.findByUser.mockResolvedValue([mockReview] as any);

      const result = await controller.findMyReviews(mockRequest);

      expect(result).toEqual([mockReview]);
      expect(reviewsService.findByUser).toHaveBeenCalledWith('user-123');
    });
  });

  describe('findOne', () => {
    it('should return a single review', async () => {
      reviewsService.findOne.mockResolvedValue(mockReview as any);

      const result = await controller.findOne('review-123');

      expect(result).toEqual(mockReview);
    });
  });

  describe('update', () => {
    it('should update a review', async () => {
      const updatedReview = { ...mockReview, rating: 4 };
      reviewsService.update.mockResolvedValue(updatedReview as any);

      const result = await controller.update('review-123', mockRequest, {
        rating: 4,
      });

      expect(result.rating).toBe(4);
      expect(reviewsService.update).toHaveBeenCalledWith(
        'review-123',
        'user-123',
        { rating: 4 },
      );
    });
  });

  describe('delete', () => {
    it('should delete a review', async () => {
      reviewsService.delete.mockResolvedValue({ deleted: true });

      const result = await controller.delete('review-123', mockRequest);

      expect(result).toEqual({ deleted: true });
    });
  });

  describe('markHelpful', () => {
    it('should mark review as helpful', async () => {
      const updatedReview = { ...mockReview, helpfulVotes: 1 };
      reviewsService.markHelpful.mockResolvedValue(updatedReview as any);

      const result = await controller.markHelpful('review-123', mockRequest);

      expect(result.helpfulVotes).toBe(1);
    });
  });

  describe('unmarkHelpful', () => {
    it('should unmark review as helpful', async () => {
      reviewsService.unmarkHelpful.mockResolvedValue(mockReview as any);

      const result = await controller.unmarkHelpful('review-123', mockRequest);

      expect(result.helpfulVotes).toBe(0);
    });
  });
});
