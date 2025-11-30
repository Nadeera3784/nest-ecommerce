import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ReviewsService } from '../services/reviews.service';
import { CreateReviewDto } from '../dtos/create-review.dto';
import { UpdateReviewDto } from '../dtos/update-review.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateReviewDto) {
    const userName = req.user.firstName
      ? `${req.user.firstName} ${req.user.lastName || ''}`.trim()
      : req.user.email.split('@')[0];

    return this.reviewsService.create(req.user.userId, userName, dto);
  }

  @Get('product/:productId')
  async findByProduct(
    @Param('productId') productId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy')
    sortBy?: 'recent' | 'helpful' | 'rating-high' | 'rating-low',
  ) {
    return this.reviewsService.findByProduct(
      productId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      sortBy || 'recent',
    );
  }

  @Get('product/:productId/summary')
  async getProductRatingSummary(@Param('productId') productId: string) {
    return this.reviewsService.getProductRatingSummary(productId);
  }

  @Get('my-reviews')
  @UseGuards(JwtAuthGuard)
  async findMyReviews(@Req() req: AuthenticatedRequest) {
    return this.reviewsService.findByUser(req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.reviewsService.delete(id, req.user.userId);
  }

  @Post(':id/helpful')
  @UseGuards(JwtAuthGuard)
  async markHelpful(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.reviewsService.markHelpful(id, req.user.userId);
  }

  @Delete(':id/helpful')
  @UseGuards(JwtAuthGuard)
  async unmarkHelpful(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.reviewsService.unmarkHelpful(id, req.user.userId);
  }
}
