
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

type CompanyStatus = 'ACTIVE' | 'SUSPENDED';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { name?: string }) {
    const name = data?.name?.trim();

    if (!name || typeof name !== 'string' || name.length > 200) {
      throw new BadRequestException('Valid company name is required');
    }

    return this.prisma.company.create({
      data: {
        name,
        status: 'ACTIVE',
      },
    });
  }

  async findAll() {
    return this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  async update(
    id: string,
    data: { name?: string; status?: CompanyStatus },
  ) {
    await this.findOne(id);

    const updateData: {
      name?: string;
      status?: CompanyStatus;
    } = {};

    if (data?.name !== undefined) {
      if (
        typeof data.name !== 'string' ||
        !data.name.trim() ||
        data.name.trim().length > 200
      ) {
        throw new BadRequestException('Invalid company name');
      }

      updateData.name = data.name.trim();
    }

    if (data?.status !== undefined) {
      if (!['ACTIVE', 'SUSPENDED'].includes(data.status)) {
        throw new BadRequestException('Invalid company status');
      }

      updateData.status = data.status;
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No valid fields provided');
    }

    return this.prisma.company.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    try {
      return await this.prisma.company.delete({
        where: { id },
      });
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          'Cannot delete a company that has related records',
        );
      }

      throw error;
    }
  }
}
