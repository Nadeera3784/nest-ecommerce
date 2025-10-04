import { Test, TestingModule } from '@nestjs/testing';
import { GatewayController } from './gateway.controller';
import { GatewayService } from '../services/gateway.service';

describe('GatewayController', () => {
  let controller: GatewayController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GatewayController],
      providers: [
        {
          provide: GatewayService,
          useValue: {
            getHealthStatus: jest.fn().mockReturnValue({ status: 'healthy', service: 'gateway', timestamp: 'x' }),
            getServiceRoutes: jest.fn().mockReturnValue({ authentication: '/auth', inventory: '/inventory', payment: '/payment' }),
          },
        },
      ],
    }).compile();

    controller = module.get(GatewayController);
  });

  it('health returns service health', () => {
    const res = controller.getHealth();
    expect(res.status).toBeDefined();
  });

  it('routes returns mapping', () => {
    const res = controller.getRoutes();
    expect(res.authentication).toBe('/auth');
  });
});


