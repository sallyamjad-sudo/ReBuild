
import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health/db')
  async checkDatabase() {
    const companyCount = await this.prisma.company.count();

    return {
      status: 'ok',
      database: 'connected',
      companies: companyCount,
    };
  }
}
