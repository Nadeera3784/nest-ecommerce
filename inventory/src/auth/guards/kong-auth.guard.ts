import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class KongAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Kong has already validated the JWT, so we just need to decode it
    // Kong doesn't automatically forward claims as headers in all configurations
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('User authentication required');
    }

    try {
      // Decode JWT payload (Kong already validated it, so it's safe)
      const token = authHeader.substring(7);
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString(),
      );

      // Set user info in request for easy access via decorator
      request.user = {
        userId: payload.userId,
        email: payload.email,
        tokenId: payload.tokenId,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token format');
    }
  }
}
