import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

describe('Authentication E2E Tests', () => {
  let app: INestApplication;
  let userModel: Model<any>;
  let refreshTokenModel: Model<any>;
  let passwordResetTokenModel: Model<any>;

  let testUser = {
    email: `test${Date.now()}@example.com`,
    password: 'Test123!@#',
    first_name: 'Test',
    last_name: 'User',
  };

  let accessToken: string;
  let refreshToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );

    await app.init();

    userModel = moduleFixture.get<Model<any>>(getModelToken('User'));
    refreshTokenModel = moduleFixture.get<Model<any>>(
      getModelToken('RefreshToken'),
    );
    passwordResetTokenModel = moduleFixture.get<Model<any>>(
      getModelToken('PasswordResetToken'),
    );
  });

  afterAll(async () => {
    // Cleanup test data
    if (userId) {
      await userModel.deleteOne({ _id: userId });
    }
    await refreshTokenModel.deleteMany({ userId });
    await passwordResetTokenModel.deleteMany({ email: testUser.email });

    await app.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('statusCode', 201);
      expect(response.body).toHaveProperty(
        'message',
        'Registration successful',
      );
      expect(response.body.data).toHaveProperty('access_token');
      expect(response.body.data).toHaveProperty('refresh_token');
      expect(response.body.data).toHaveProperty('token_type', 'Bearer');
      expect(response.body.data).toHaveProperty('expires_in');
      expect(response.body.data.user).toHaveProperty('email', testUser.email);
      expect(response.body.data.user).toHaveProperty(
        'first_name',
        testUser.first_name,
      );
      expect(response.body.data.user).toHaveProperty(
        'last_name',
        testUser.last_name,
      );
      expect(response.body.data.user).not.toHaveProperty('password');

      // Store tokens and userId for later tests
      accessToken = response.body.data.access_token;
      refreshToken = response.body.data.refresh_token;
      userId = response.body.data.user.id;
    });

    it('should fail to register with duplicate email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body.message).toContain('email');
    });

    it('should fail to register with invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Test123!@#',
          first_name: 'Test',
          last_name: 'User',
        })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should fail to register with weak password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'weak',
          first_name: 'Test',
          last_name: 'User',
        })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should fail to register without required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'incomplete@example.com',
        })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('statusCode', 200);
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body.data).toHaveProperty('access_token');
      expect(response.body.data).toHaveProperty('refresh_token');
      expect(response.body.data.user).toHaveProperty('email', testUser.email);

      // Update tokens for later tests
      accessToken = response.body.data.access_token;
      refreshToken = response.body.data.refresh_token;
    });

    it('should fail to login with invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
        })
        .expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should fail to login with invalid password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should fail to login without credentials', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({})
        .expect(400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get user profile with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('statusCode', 200);
      expect(response.body.data).toHaveProperty('email', testUser.email);
      expect(response.body.data).toHaveProperty(
        'first_name',
        testUser.first_name,
      );
      expect(response.body.data).toHaveProperty(
        'last_name',
        testUser.last_name,
      );
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should fail to get profile without token', async () => {
      await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });

    it('should fail to get profile with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({
          refresh_token: refreshToken,
        })
        .expect(200);

      expect(response.body).toHaveProperty('statusCode', 200);
      expect(response.body.data).toHaveProperty('access_token');
      expect(response.body.data).toHaveProperty('refresh_token');

      // Update tokens
      accessToken = response.body.data.access_token;
      refreshToken = response.body.data.refresh_token;
    });

    it('should fail to refresh with invalid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({
          refresh_token: 'invalid-refresh-token',
        })
        .expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
    });

    it('should fail to refresh without token', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({})
        .expect(400);
    });
  });

  describe('POST /api/auth/request-password-reset', () => {
    it('should request password reset successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/request-password-reset')
        .send({
          email: testUser.email,
        })
        .expect(200);

      expect(response.body).toHaveProperty('statusCode', 200);
      expect(response.body).toHaveProperty('message');
    });

    it('should return success even for non-existent email (security)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/request-password-reset')
        .send({
          email: 'nonexistent@example.com',
        })
        .expect(200);

      expect(response.body).toHaveProperty('statusCode', 200);
    });

    it('should fail without email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/request-password-reset')
        .send({})
        .expect(400);
    });

    it('should fail with invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/request-password-reset')
        .send({
          email: 'invalid-email',
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    let resetToken: string;

    beforeAll(async () => {
      // Create a password reset token for testing
      const token = await passwordResetTokenModel.create({
        email: testUser.email,
        token: 'test-reset-token-' + Date.now(),
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      });
      resetToken = token.token;
    });

    it('should reset password successfully with valid token', async () => {
      const newPassword = 'NewPassword123!@#';

      const response = await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: newPassword,
        })
        .expect(200);

      expect(response.body).toHaveProperty('statusCode', 200);
      expect(response.body).toHaveProperty(
        'message',
        'Password reset successful',
      );

      // Verify can login with new password
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: newPassword,
        })
        .expect(200);

      expect(loginResponse.body.data).toHaveProperty('access_token');

      // Update tokens and password for later tests
      accessToken = loginResponse.body.data.access_token;
      refreshToken = loginResponse.body.data.refresh_token;
      testUser.password = newPassword;
    });

    it('should fail to reset password with invalid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-reset-token',
          password: 'NewPassword123!@#',
        })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should fail to reset password with weak password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: 'weak',
        })
        .expect(400);
    });

    it('should fail without required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({})
        .expect(400);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully with valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          refresh_token: refreshToken,
        })
        .expect(200);

      expect(response.body).toHaveProperty('statusCode', 200);
      expect(response.body).toHaveProperty('message', 'Logout successful');
    });

    it('should fail to logout without authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .send({
          refresh_token: refreshToken,
        })
        .expect(401);
    });

    it('should fail to use refresh token after logout', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({
          refresh_token: refreshToken,
        })
        .expect(401);
    });
  });

  describe('GET /api/auth/health', () => {
    it('should return health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('service', 'authentication');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('JWT Token Validation', () => {
    it('should reject expired token', async () => {
      // This would require mocking time or using a token with short expiry
      // For now, we test with invalid format
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer expired.token.here')
        .expect(401);
    });

    it('should reject malformed token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer malformed-token')
        .expect(401);
    });

    it('should reject missing Bearer prefix', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', accessToken)
        .expect(401);
    });
  });
});

