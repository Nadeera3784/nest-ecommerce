import { Test, TestingModule } from '@nestjs/testing';
import { LoginFeature } from './login.feature';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dtos';

describe('LoginFeature', () => {
  let feature: LoginFeature;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginFeature,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    feature = module.get<LoginFeature>(LoginFeature);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(feature).toBeDefined();
  });

  describe('handle', () => {
    it('should successfully login user', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'Test123!@#',
      };

      const mockAuthResponse = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
        },
      };

      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await feature.handle(loginDto, 'test-agent');

      expect(authService.login).toHaveBeenCalledWith(loginDto, 'test-agent');
      expect(result.status).toBe(200);
      expect(result.response).toEqual({
        statusCode: 200,
        message: 'Login successful',
        data: mockAuthResponse,
      });
    });

    it('should return 401 for invalid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

      const result = await feature.handle(loginDto, 'test-agent');

      expect(authService.login).toHaveBeenCalledWith(loginDto, 'test-agent');
      expect(result.status).toBe(401);
      expect(result.response).toHaveProperty('statusCode', 401);
      expect(result.response).toHaveProperty('message', 'Invalid credentials');
    });

    it('should handle service errors gracefully', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'Test123!@#',
      };

      mockAuthService.login.mockRejectedValue(
        new Error('Database connection error'),
      );

      const result = await feature.handle(loginDto, 'test-agent');

      expect(result.status).toBe(401);
      expect(result.response).toHaveProperty('statusCode', 401);
    });

    it('should pass user agent to auth service', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'Test123!@#',
      };

      const userAgent = 'Mozilla/5.0 Test Browser';

      mockAuthService.login.mockResolvedValue({
        access_token: 'token',
        refresh_token: 'refresh',
        user: {},
      });

      await feature.handle(loginDto, userAgent);

      expect(authService.login).toHaveBeenCalledWith(loginDto, userAgent);
    });
  });
});

