import { Document } from 'mongoose';

export interface ReviewDocument extends Document {
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  helpfulVotes: number;
  helpfulVoters: string[];
  status: ReviewStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface ProductRatingSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}
