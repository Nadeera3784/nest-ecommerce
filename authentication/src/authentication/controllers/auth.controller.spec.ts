import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import {
  LoginFeature,
  RegisterFeature,
  RefreshTokenFeature,
  LogoutFeature,
  GetProfileFeature,
  RequestPasswordResetFeature,
  ResetPasswordFeature,
} from '../features';
import {
  RegisterDto,
  LoginDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
} from '../dtos';

describe('AuthController', () => {
  let controller: AuthController;
  let loginFeature: LoginFeature;
  let registerFeature: RegisterFeature;
  let refreshTokenFeature: RefreshTokenFeature;
  let logoutFeature: LogoutFeature;
  let getProfileFeature: GetProfileFeature;
  let requestPasswordResetFeature: RequestPasswordResetFeature;
  let resetPasswordFeature: ResetPasswordFeature;

  const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const mockRequest = (overrides = {}) => ({
    headers: { 'user-agent': 'test-agent' },
    user: { userId: 'test-user-id' },
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: LoginFeature,
          useValue: {
            handle: jest.fn(),
          },
        },
        {
          provide: RegisterFeature,
          useValue: {
            handle: jest.fn(),
          },
        },
        {
          provide: RefreshTokenFeature,
          useValue: {
            handle: jest.fn(),
          },
        },
        {
          provide: LogoutFeature,
          useValue: {
            handle: jest.fn(),
          },
        },
        {
          provide: GetProfileFeature,
          useValue: {
            handle: jest.fn(),
          },
        },
        {
          provide: RequestPasswordResetFeature,
          useValue: {
            handle: jest.fn(),
          },
        },
        {
          provide: ResetPasswordFeature,
          useValue: {
            handle: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    loginFeature = module.get<LoginFeature>(LoginFeature);
    registerFeature = module.get<RegisterFeature>(RegisterFeature);
    refreshTokenFeature = module.get<RefreshTokenFeature>(RefreshTokenFeature);
    logoutFeature = module.get<LogoutFeature>(LogoutFeature);
    getProfileFeature = module.get<GetProfileFeature>(GetProfileFeature);
    requestPasswordResetFeature = module.get<RequestPasswordResetFeature>(
      RequestPasswordResetFeature,
    );
    resetPasswordFeature =
      module.get<ResetPasswordFeature>(ResetPasswordFeature);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'Test123!@#',
        first_name: 'Test',
        last_name: 'User',
      };

      const mockResult = {
        status: 201,
        response: {
          statusCode: 201,
          message: 'Registration successful',
          data: {
            access_token: 'test-access-token',
            refresh_token: 'test-refresh-token',
            user: {
              id: 'test-user-id',
              email: 'test@example.com',
              first_name: 'Test',
              last_name: 'User',
            },
          },
        },
      };

      jest.spyOn(registerFeature, 'handle').mockResolvedValue(mockResult);

      const res = mockResponse();
      await controller.register(registerDto, res);

      expect(registerFeature.handle).toHaveBeenCalledWith(registerDto);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockResult.response);
    });

    it('should return error when email already exists', async () => {
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        password: 'Test123!@#',
        first_name: 'Test',
        last_name: 'User',
      };

      const mockResult = {
        status: 409,
        response: {
          statusCode: 409,
          message: 'User with this email already exists',
          data: null,
        },
      };

      jest.spyOn(registerFeature, 'handle').mockResolvedValue(mockResult);

      const res = mockResponse();
      await controller.register(registerDto, res);

      expect(registerFeature.handle).toHaveBeenCalledWith(registerDto);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(mockResult.response);
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'Test123!@#',
      };

      const mockResult = {
        status: 200,
        response: {
          statusCode: 200,
          message: 'Login successful',
          data: {
            access_token: 'test-access-token',
            refresh_token: 'test-refresh-token',
            user: {
              id: 'test-user-id',
              email: 'test@example.com',
            },
          },
        },
      };

      jest.spyOn(loginFeature, 'handle').mockResolvedValue(mockResult);

      const req = mockRequest();
      const res = mockResponse();
      await controller.login(loginDto, req, res);

      expect(loginFeature.handle).toHaveBeenCalledWith(loginDto, 'test-agent');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult.response);
    });

    it('should return error for invalid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      const mockResult = {
        status: 401,
        response: {
          statusCode: 401,
          message: 'Invalid credentials',
          data: null,
        },
      };

      jest.spyOn(loginFeature, 'handle').mockResolvedValue(mockResult);

      const req = mockRequest();
      const res = mockResponse();
      await controller.login(loginDto, req, res);

      expect(loginFeature.handle).toHaveBeenCalledWith(loginDto, 'test-agent');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(mockResult.response);
    });
  });

  describe('refresh', () => {
    it('should refresh access token successfully', async () => {
      const refreshToken = 'valid-refresh-token';

      const mockResult = {
        status: 200,
        response: {
          statusCode: 200,
          message: 'Token refreshed successfully',
          data: {
            access_token: 'new-access-token',
            refresh_token: 'new-refresh-token',
          },
        },
      };

      jest.spyOn(refreshTokenFeature, 'handle').mockResolvedValue(mockResult);

      const req = mockRequest();
      const res = mockResponse();
      await controller.refresh(refreshToken, req, res);

      expect(refreshTokenFeature.handle).toHaveBeenCalledWith(
        refreshToken,
        'test-agent',
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult.response);
    });

    it('should return error for invalid refresh token', async () => {
      const refreshToken = 'invalid-refresh-token';

      const mockResult = {
        status: 401,
        response: {
          statusCode: 401,
          message: 'Invalid refresh token',
          data: null,
        },
      };

      jest.spyOn(refreshTokenFeature, 'handle').mockResolvedValue(mockResult);

      const req = mockRequest();
      const res = mockResponse();
      await controller.refresh(refreshToken, req, res);

      expect(refreshTokenFeature.handle).toHaveBeenCalledWith(
        refreshToken,
        'test-agent',
      );
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(mockResult.response);
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const refreshToken = 'valid-refresh-token';

      const mockResult = {
        status: 200,
        response: {
          statusCode: 200,
          message: 'Logout successful',
          data: null,
        },
      };

      jest.spyOn(logoutFeature, 'handle').mockResolvedValue(mockResult);

      const res = mockResponse();
      await controller.logout(refreshToken, res);

      expect(logoutFeature.handle).toHaveBeenCalledWith(refreshToken);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult.response);
    });
  });

  describe('getProfile', () => {
    it('should get user profile successfully', async () => {
      const mockResult = {
        status: 200,
        response: {
          statusCode: 200,
          message: 'Profile retrieved successfully',
          data: {
            id: 'test-user-id',
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
          },
        },
      };

      jest.spyOn(getProfileFeature, 'handle').mockResolvedValue(mockResult);

      const req = mockRequest();
      const res = mockResponse();
      await controller.getProfile(req, res);

      expect(getProfileFeature.handle).toHaveBeenCalledWith('test-user-id');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult.response);
    });
  });

  describe('requestPasswordReset', () => {
    it('should request password reset successfully', async () => {
      const requestPasswordResetDto: RequestPasswordResetDto = {
        email: 'test@example.com',
      };

      const mockResult = {
        status: 200,
        response: {
          statusCode: 200,
          message: 'Password reset email sent',
          data: null,
        },
      };

      jest
        .spyOn(requestPasswordResetFeature, 'handle')
        .mockResolvedValue(mockResult);

      const res = mockResponse();
      await controller.requestPasswordReset(requestPasswordResetDto, res);

      expect(requestPasswordResetFeature.handle).toHaveBeenCalledWith(
        requestPasswordResetDto,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult.response);
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const resetPasswordDto: ResetPasswordDto = {
        token: 'valid-reset-token',
        new_password: 'NewPassword123!@#',
      };

      const mockResult = {
        status: 200,
        response: {
          statusCode: 200,
          message: 'Password reset successful',
          data: null,
        },
      };

      jest.spyOn(resetPasswordFeature, 'handle').mockResolvedValue(mockResult);

      const res = mockResponse();
      await controller.resetPassword(resetPasswordDto, res);

      expect(resetPasswordFeature.handle).toHaveBeenCalledWith(
        resetPasswordDto,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult.response);
    });
  });

  describe('health', () => {
    it('should return health status', () => {
      const result = controller.health();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('service', 'authentication');
      expect(result).toHaveProperty('timestamp');
    });
  });
});
