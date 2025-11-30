import { Schema } from 'mongoose';
import { ReviewDocument, ReviewStatus } from '../interfaces/review.interface';

export { ReviewDocument, ReviewStatus };

export const REVIEW_MODEL = 'Review';

export const ReviewSchema = new Schema<ReviewDocument>(
  {
    productId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    comment: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    images: {
      type: [String],
      default: [],
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    helpfulVotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    helpfulVoters: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
    },
  },
  {
    timestamps: true,
  },
);

ReviewSchema.index({ productId: 1, userId: 1 }, { unique: true });
ReviewSchema.index({ productId: 1, status: 1, createdAt: -1 });
ReviewSchema.index({ userId: 1, createdAt: -1 });
