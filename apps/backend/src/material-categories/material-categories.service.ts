
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

type CreateCategoryDto = {
  name?: string;
  code?: string;
  description?: string;
};

type UpdateCategoryDto = {
  name?: string;
  description?: string;
  isActive?: boolean;
};

@Injectable()
export class MaterialCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  private requiredText(value: unknown, field: string, max: number): string {
    if (
      typeof value !== 'string' ||
      !value.trim() ||
      value.trim().length > max
    ) {
      throw new BadRequestException(`Invalid ${field}`);
    }
    return value.trim();
  }

  async create(data: CreateCategoryDto) {
    const name = this.requiredText(data?.name, 'name', 150);
    const code = this.requiredText(data?.code, 'code', 50);

    if (
      data.description !== undefined &&
      typeof data.description !== 'string'
    ) {
      throw new BadRequestException('Invalid description');
    }

    try {
      return await this.prisma.materialCategory.create({
        data: {
          name,
          code,
          description: data.description,
          isActive: true,
        },
      });
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Category code already exists');
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.materialCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.materialCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Material category not found');
    }

    return category;
  }

  async update(id: string, data: UpdateCategoryDto) {
    await this.findOne(id);

    if (!data || Object.keys(data).length === 0) {
      throw new BadRequestException('No fields provided');
    }

    if (data.name !== undefined) {
      this.requiredText(data.name, 'name', 150);
    }

    if (
      data.description !== undefined &&
      typeof data.description !== 'string'
    ) {
      throw new BadRequestException('Invalid description');
    }

    if (
      data.isActive !== undefined &&
      typeof data.isActive !== 'boolean'
    ) {
      throw new BadRequestException('isActive must be boolean');
    }

    const updateData = {
      name: data.name?.trim(),
      description: data.description,
      isActive: data.isActive,
    };

    if (Object.values(updateData).every((value) => value === undefined)) {
      throw new BadRequestException('No valid fields provided');
    }

    return this.prisma.materialCategory.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    try {
      return await this.prisma.materialCategory.delete({
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
          'Cannot delete category with related materials',
        );
      }
      throw error;
    }
  }
}
