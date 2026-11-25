
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

type WarehouseType = 'CENTRAL' | 'PROJECT';

type CreateWarehouseDto = {
  companyId?: string;
  projectId?: string;
  name?: string;
  warehouseType?: WarehouseType;
  address?: string;
};

type UpdateWarehouseDto = {
  name?: string;
  address?: string;
  isActive?: boolean;
};

@Injectable()
export class WarehousesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateWarehouseDto) {
    if (!data || typeof data.companyId !== 'string') {
      throw new BadRequestException('companyId is required');
    }

    if (
      typeof data.name !== 'string' ||
      !data.name.trim() ||
      data.name.trim().length > 200
    ) {
      throw new BadRequestException('Invalid warehouse name');
    }

    if (!['CENTRAL', 'PROJECT'].includes(data.warehouseType ?? '')) {
      throw new BadRequestException('Invalid warehouse type');
    }

    if (data.address !== undefined && typeof data.address !== 'string') {
      throw new BadRequestException('Invalid address');
    }

    const company = await this.prisma.company.findUnique({
      where: { id: data.companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (data.warehouseType === 'PROJECT' && !data.projectId) {
      throw new BadRequestException('projectId is required for PROJECT warehouse');
    }

    if (data.warehouseType === 'CENTRAL' && data.projectId) {
      throw new BadRequestException('CENTRAL warehouse cannot have projectId');
    }

    if (data.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: data.projectId },
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      if (project.companyId !== data.companyId) {
        throw new BadRequestException('Project belongs to a different company');
      }
    }

    return this.prisma.warehouse.create({
      data: {
        companyId: data.companyId,
        projectId: data.projectId,
        name: data.name.trim(),
        warehouseType: data.warehouseType!,
        address: data.address,
        isActive: true,
      },
    });
  }

  async findAll(companyId?: string) {
    return this.prisma.warehouse.findMany({
      where: companyId ? { companyId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    return warehouse;
  }

  async update(id: string, data: UpdateWarehouseDto) {
    await this.findOne(id);

    if (!data || Object.keys(data).length === 0) {
      throw new BadRequestException('No fields provided');
    }

    if (data.name !== undefined &&
        (typeof data.name !== 'string' ||
         !data.name.trim() ||
         data.name.trim().length > 200)) {
      throw new BadRequestException('Invalid warehouse name');
    }

    if (data.address !== undefined && typeof data.address !== 'string') {
      throw new BadRequestException('Invalid address');
    }

    if (data.isActive !== undefined && typeof data.isActive !== 'boolean') {
      throw new BadRequestException('isActive must be boolean');
    }

    const updateData = {
      name: data.name?.trim(),
      address: data.address,
      isActive: data.isActive,
    };

    if (Object.values(updateData).every((value) => value === undefined)) {
      throw new BadRequestException('No valid fields provided');
    }

    return this.prisma.warehouse.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    try {
      return await this.prisma.warehouse.delete({
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
          'Cannot delete warehouse with related records',
        );
      }

      throw error;
    }
  }
}
