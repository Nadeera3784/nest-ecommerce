import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProductsService } from './products.service';
import { PRODUCT_MODEL, ProductDocument } from '../schemas/product.schema';
import { NotFoundException } from '@nestjs/common';

describe('ProductsService', () => {
  let service: ProductsService;
  let model: jest.Mocked<Partial<Model<ProductDocument>>>;

  beforeEach(async () => {
    model = {
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      create: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getModelToken(PRODUCT_MODEL), useValue: model },
      ],
    }).compile();

    service = module.get(ProductsService);
  });

  it('findAll returns list', async () => {
    const exec = jest.fn().mockResolvedValue(['a']);
    (model.find as any).mockReturnValue({ lean: () => ({ exec }) });
    expect(await service.findAll()).toEqual(['a']);
  });

  it('findOne throws for invalid id', async () => {
    await expect(service.findOne('bad')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('findOne returns doc', async () => {
    const exec = jest.fn().mockResolvedValue({ id: '1' });
    (model.findById as any).mockReturnValue({ exec });
    expect(await service.findOne(new Types.ObjectId().toString())).toEqual({
      id: '1',
    } as any);
  });

  it('create stores doc', async () => {
    (model.create as any).mockResolvedValue({ id: '1' });
    expect(await service.create({ name: 'x' } as any)).toEqual({
      id: '1',
    } as any);
  });

  it('update updates doc', async () => {
    const exec = jest.fn().mockResolvedValue({ id: '1' });
    (model.findByIdAndUpdate as any).mockReturnValue({ exec });
    expect(
      await service.update(new Types.ObjectId().toString(), {
        name: 'y',
      } as any),
    ).toEqual({ id: '1' } as any);
  });

  it('remove deletes doc', async () => {
    const exec = jest.fn().mockResolvedValue({ id: '1' });
    (model.findByIdAndDelete as any).mockReturnValue({ exec });
    expect(await service.remove(new Types.ObjectId().toString())).toEqual({
      deleted: true,
    });
  });
});
