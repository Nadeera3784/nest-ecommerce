import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { TransactionsService } from '../services/transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  async findAll() {
    return this.transactionsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  @Post()
  async create(@Body() createTransactionDto: any) {
    return this.transactionsService.create(createTransactionDto);
  }

  @Get('user/:userId')
  async findByUser(@Param('userId') userId: string) {
    return this.transactionsService.findByUser(userId);
  }

  @Get('payment/:paymentId')
  async findByPayment(@Param('paymentId') paymentId: string) {
    return this.transactionsService.findByPayment(paymentId);
  }
}
