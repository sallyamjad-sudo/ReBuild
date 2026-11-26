
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid token');
    }

    const token = authorization.substring(7);

    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
      }>(token);

      if (
        !payload?.sub ||
        typeof payload.sub !== 'string'
      ) {
        throw new UnauthorizedException('Invalid token payload');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          status: true,
        },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException('User is not active');
      }

      const authenticatedRequest = request as Request & {
  user: {
    id: string;
    email: string;
  };
};

authenticatedRequest.user = {
  id: user.id,
  email: user.email,
};

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
