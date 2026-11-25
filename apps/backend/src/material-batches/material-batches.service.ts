
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

type CreateBatchDto = {
  materialId?: string;
  batchCode?: string;
  supplierId?: string;
  receivedAt?: string;
  manufacturedAt?: string;
  expiresAt?: string;
};

type UpdateBatchDto = {
  batchCode?: string;
  receivedAt?: string | null;
  manufacturedAt?: string | null;
  expiresAt?: string | null;
};

@Injectable()
export class MaterialBatchesService {
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

  private parseDate(value: unknown, field: string): Date | undefined {
    if (value === undefined || value === null) return undefined;

    if (typeof value !== 'string') {
      throw new BadRequestException(`Invalid ${field}`);
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`Invalid ${field}`);
    }

    return date;
  }

  private async ensureMaterial(id: string) {
    const material = await this.prisma.material.findUnique({
      where: { id },
    });

    if (!material) {
      throw new NotFoundException('Material not found');
    }
  }

  async create(data: CreateBatchDto) {
    if (!data || typeof data.materialId !== 'string') {
      throw new BadRequestException('materialId is required');
    }

    await this.ensureMaterial(data.materialId);

    const batchCode = this.requiredText(data.batchCode, 'batchCode', 100);

    if (data.supplierId !== undefined) {
      if (typeof data.supplierId !== 'string') {
        throw new BadRequestException('Invalid supplierId');
      }

      const supplier = await this.prisma.supplier.findUnique({
        where: { id: data.supplierId },
      });

      if (!supplier) {
        throw new NotFoundException('Supplier not found');
      }
    }

    const manufacturedAt = this.parseDate(
      data.manufacturedAt,
      'manufacturedAt',
    );
    const expiresAt = this.parseDate(data.expiresAt, 'expiresAt');

    if (manufacturedAt && expiresAt && expiresAt < manufacturedAt) {
      throw new BadRequestException(
        'expiresAt cannot precede manufacturedAt',
      );
    }

    try {
      return await this.prisma.materialBatch.create({
        data: {
          materialId: data.materialId,
          batchCode,
          supplierId: data.supplierId,
          receivedAt: this.parseDate(data.receivedAt, 'receivedAt'),
          manufacturedAt,
          expiresAt,
        },
      });
    } catch (error: unknown) {
      this.handleDatabaseError(error);
    }
  }

  async findAll(materialId?: string) {
    return this.prisma.materialBatch.findMany({
      where: materialId ? { materialId } : undefined,
      include: { material: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const batch = await this.prisma.materialBatch.findUnique({
      where: { id },
      include: { material: true },
    });

    if (!batch) {
      throw new NotFoundException('Material batch not found');
    }

    return batch;
  }

  async update(id: string, data: UpdateBatchDto) {
    const existing = await this.findOne(id);

    if (!data || Object.keys(data).length === 0) {
      throw new BadRequestException('No fields provided');
    }

    const batchCode =
      data.batchCode === undefined
        ? undefined
        : this.requiredText(data.batchCode, 'batchCode', 100);

    const receivedAt =
      data.receivedAt === null
        ? null
        : this.parseDate(data.receivedAt, 'receivedAt');

    const manufacturedAt =
      data.manufacturedAt === null
        ? null
        : this.parseDate(data.manufacturedAt, 'manufacturedAt');

    const expiresAt =
      data.expiresAt === null
        ? null
        : this.parseDate(data.expiresAt, 'expiresAt');

    const finalManufacturedAt =
      manufacturedAt === undefined
        ? existing.manufacturedAt
        : manufacturedAt;

    const finalExpiresAt =
      expiresAt === undefined ? existing.expiresAt : expiresAt;

    if (
      finalManufacturedAt &&
      finalExpiresAt &&
      finalExpiresAt < finalManufacturedAt
    ) {
      throw new BadRequestException(
        'expiresAt cannot precede manufacturedAt',
      );
    }

    const updateData = {
      batchCode,
      receivedAt,
      manufacturedAt,
      expiresAt,
    };

    if (Object.values(updateData).every((value) => value === undefined)) {
      throw new BadRequestException('No valid fields provided');
    }

    try {
      return await this.prisma.materialBatch.update({
        where: { id },
        data: updateData,
      });
    } catch (error: unknown) {
      this.handleDatabaseError(error);
    }
  }

  async remove(id: string) {
    await this.findOne(id);

    try {
      return await this.prisma.materialBatch.delete({
        where: { id },
      });
    } catch (error: unknown) {
      this.handleDatabaseError(error);
    }
  }

  private handleDatabaseError(error: unknown): never {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Batch code already exists');
      }
      if (error.code === 'P2003') {
        throw new ConflictException(
          'Cannot delete or modify a batch with related records',
        );
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('Material batch not found');
      }
    }
    throw error;
  }
}
