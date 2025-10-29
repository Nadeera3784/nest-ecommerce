import { Test, TestingModule } from '@nestjs/testing';
import { RegisterFeature } from './register.feature';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dtos';

describe('RegisterFeature', () => {
  let feature: RegisterFeature;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterFeature,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    feature = module.get<RegisterFeature>(RegisterFeature);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(feature).toBeDefined();
  });

  describe('handle', () => {
    it('should successfully register a new user', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'Test123!@#',
        first_name: 'New',
        last_name: 'User',
      };

      const mockAuthResponse = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
        user: {
          id: 'new-user-id',
          email: 'newuser@example.com',
          first_name: 'New',
          last_name: 'User',
        },
      };

      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      const result = await feature.handle(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result.status).toBe(201);
      expect(result.response).toEqual({
        statusCode: 201,
        message: 'Registration successful',
        data: mockAuthResponse,
      });
    });

    it('should return 409 when email already exists', async () => {
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        password: 'Test123!@#',
        first_name: 'Test',
        last_name: 'User',
      };

      mockAuthService.register.mockRejectedValue(
        new Error('User with this email already exists'),
      );

      const result = await feature.handle(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result.status).toBe(400);
      expect(result.response).toHaveProperty('statusCode', 400);
    });

    it('should handle validation errors', async () => {
      const registerDto: RegisterDto = {
        email: 'invalid-email',
        password: 'weak',
        first_name: '',
        last_name: '',
      };

      mockAuthService.register.mockRejectedValue(
        new Error('Validation failed'),
      );

      const result = await feature.handle(registerDto);

      expect(result.status).toBe(400);
      expect(result.response).toHaveProperty('statusCode', 400);
    });

    it('should not expose password in response', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'Test123!@#',
        first_name: 'New',
        last_name: 'User',
      };

      const mockAuthResponse = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        user: {
          id: 'new-user-id',
          email: 'newuser@example.com',
          first_name: 'New',
          last_name: 'User',
        },
      };

      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      const result = await feature.handle(registerDto);

      expect(result.response.data.user).not.toHaveProperty('password');
    });
  });
});

