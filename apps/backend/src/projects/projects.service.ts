
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

type ProjectStatus =
  | 'PLANNING'
  | 'ACTIVE'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ARCHIVED';

type CreateProjectDto = {
  companyId?: string;
  code?: string;
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
};

type UpdateProjectDto = Partial<CreateProjectDto> & {
  status?: ProjectStatus;
};

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  private parseDate(value: string | undefined, field: string) {
    if (value === undefined) return undefined;

    if (
      typeof value !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
      throw new BadRequestException(`${field} must be YYYY-MM-DD`);
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    if (Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== value) {
      throw new BadRequestException(`Invalid ${field}`);
    }

    return date;
  }

  private requiredText(value: unknown, field: string, max: number) {
    if (
      typeof value !== 'string' ||
      !value.trim() ||
      value.trim().length > max
    ) {
      throw new BadRequestException(`Invalid ${field}`);
    }

    return value.trim();
  }

  async create(data: CreateProjectDto) {
    if (!data || typeof data.companyId !== 'string') {
      throw new BadRequestException('companyId is required');
    }

    const company = await this.prisma.company.findUnique({
      where: { id: data.companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const startDate = this.parseDate(data.startDate, 'startDate');
    const endDate = this.parseDate(data.endDate, 'endDate');

    if (startDate && endDate && endDate < startDate) {
      throw new BadRequestException('endDate cannot precede startDate');
    }

    try {
      return await this.prisma.project.create({
        data: {
          companyId: data.companyId,
          code: this.requiredText(data.code, 'code', 50),
          name: this.requiredText(data.name, 'name', 200),
          description: data.description,
          status: 'PLANNING',
          startDate,
          endDate,
        },
      });
    } catch (error: unknown) {
      this.handleDatabaseError(error);
    }
  }

  async findAll(companyId?: string) {
    return this.prisma.project.findMany({
      where: companyId ? { companyId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(id: string, data: UpdateProjectDto) {
    const existing = await this.findOne(id);

    if (!data || Object.keys(data).length === 0) {
      throw new BadRequestException('No fields provided');
    }

    if (data.companyId !== undefined &&
        data.companyId !== existing.companyId) {
      throw new BadRequestException('Cannot change project company');
    }

    const code = data.code === undefined
      ? undefined
      : this.requiredText(data.code, 'code', 50);

    const name = data.name === undefined
      ? undefined
      : this.requiredText(data.name, 'name', 200);

    if (
      data.status !== undefined &&
      !['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED',
        'CANCELLED', 'ARCHIVED'].includes(data.status)
    ) {
      throw new BadRequestException('Invalid project status');
    }

    const startDate = this.parseDate(data.startDate, 'startDate');
    const endDate = this.parseDate(data.endDate, 'endDate');

    const finalStart = startDate ?? existing.startDate;
    const finalEnd = endDate ?? existing.endDate;

    if (finalStart && finalEnd && finalEnd < finalStart) {
      throw new BadRequestException('endDate cannot precede startDate');
    }

    try {
      return await this.prisma.project.update({
        where: { id },
        data: {
          code,
          name,
          description: data.description,
          status: data.status,
          startDate,
          endDate,
        },
      });
    } catch (error: unknown) {
      this.handleDatabaseError(error);
    }
  }

  async remove(id: string) {
    await this.findOne(id);

    try {
      return await this.prisma.project.delete({
        where: { id },
      });
    } catch (error: unknown) {
      this.handleDatabaseError(error);
    }
  }

  private handleDatabaseError(error: unknown): never {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Project code already exists in this company');
      }

      if (error.code === 'P2003') {
        throw new ConflictException(
          'Cannot delete or modify a project with related records',
        );
      }

      if (error.code === 'P2025') {
        throw new NotFoundException('Project not found');
      }
    }

    throw error;
  }
}
