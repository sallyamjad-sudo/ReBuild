
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

type CreateMaterialDto = {
  categoryId?: string;
  code?: string;
  name?: string;
  baseUnit?: string;
  description?: string;
};

type UpdateMaterialDto = {
  name?: string;
  description?: string;
  isActive?: boolean;
};

@Injectable()
export class MaterialsService {
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

  async create(data: CreateMaterialDto) {
    if (!data || typeof data.categoryId !== 'string') {
      throw new BadRequestException('categoryId is required');
    }

    const category = await this.prisma.materialCategory.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Material category not found');
    }

    try {
      return await this.prisma.material.create({
        data: {
          categoryId: data.categoryId,
          code: this.requiredText(data.code, 'code', 100),
          name: this.requiredText(data.name, 'name', 200),
          baseUnit: this.requiredText(data.baseUnit, 'baseUnit', 30),
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
        throw new ConflictException('Material code already exists');
      }
      throw error;
    }
  }

  async findAll(categoryId?: string) {
    return this.prisma.material.findMany({
      where: categoryId ? { categoryId } : undefined,
      include: { category: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const material = await this.prisma.material.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    return material;
  }

  async update(id: string, data: UpdateMaterialDto) {
    await this.findOne(id);

    if (!data || Object.keys(data).length === 0) {
      throw new BadRequestException('No fields provided');
    }

    if (data.name !== undefined) {
      this.requiredText(data.name, 'name', 200);
    }

    if (data.description !== undefined &&
        typeof data.description !== 'string') {
      throw new BadRequestException('Invalid description');
    }

    if (data.isActive !== undefined &&
        typeof data.isActive !== 'boolean') {
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

    return this.prisma.material.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    try {
      return await this.prisma.material.delete({
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
          'Cannot delete material with related records',
        );
      }
      throw error;
    }
  }
}
