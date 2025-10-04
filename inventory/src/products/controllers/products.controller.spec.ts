import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from '../services/products.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: { findAll: jest.Mock; findOne: jest.Mock; create: jest.Mock; update: jest.Mock; remove: jest.Mock };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        { provide: ProductsService, useValue: service },
      ],
    }).compile();

    controller = module.get(ProductsController);
  });

  it('findAll delegates to service', async () => {
    service.findAll.mockResolvedValue(['a']);
    expect(await controller.findAll()).toEqual(['a']);
  });

  it('findOne delegates to service', async () => {
    service.findOne.mockResolvedValue({ id: '1' });
    expect(await controller.findOne('1')).toEqual({ id: '1' });
  });

  it('create delegates to service', async () => {
    service.create.mockResolvedValue({ id: '1' });
    expect(await controller.create({ name: 'x' } as any)).toEqual({ id: '1' });
  });

  it('update delegates to service', async () => {
    service.update.mockResolvedValue({ id: '1' });
    expect(await controller.update('1', { name: 'y' } as any)).toEqual({ id: '1' });
  });

  it('remove delegates to service', async () => {
    service.remove.mockResolvedValue({ deleted: true });
    expect(await controller.remove('1')).toEqual({ deleted: true });
  });
});


