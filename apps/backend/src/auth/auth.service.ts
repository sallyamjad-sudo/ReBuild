
import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

import { PrismaService } from '../prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        companyMembers: {
          where: { status: 'ACTIVE' },
          include: { company: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await argon2
      .verify(user.passwordHash, dto.password)
      .catch(() => false);

    if (!passwordValid || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid credentials');
    }

    const activeCompanies = user.companyMembers.filter(
      (member) => member.company.status === 'ACTIVE',
    );

    if (activeCompanies.length === 0) {
      throw new UnauthorizedException('No active company membership');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 900,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }
}
