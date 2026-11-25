
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

type CreateLocationDto = {
  companyId?: string;
  siteId?: string;
  warehouseId?: string;
};

type UpdateLocationDto = {
  isActive?: boolean;
};

@Injectable()
export class InventoryLocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateLocationDto) {
    if (!data || typeof data.companyId !== 'string') {
      throw new BadRequestException('companyId is required');
    }

    if (!!data.siteId === !!data.warehouseId) {
      throw new BadRequestException(
        'Provide exactly one of siteId or warehouseId',
      );
    }

    const company = await this.prisma.company.findUnique({
      where: { id: data.companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (data.siteId) {
      const site = await this.prisma.site.findUnique({
        where: { id: data.siteId },
        include: { project: true },
      });

      if (!site) {
        throw new NotFoundException('Site not found');
      }

      if (site.project.companyId !== data.companyId) {
        throw new BadRequestException(
          'Site belongs to a different company',
        );
      }
    }

    if (data.warehouseId) {
      const warehouse = await this.prisma.warehouse.findUnique({
        where: { id: data.warehouseId },
      });

      if (!warehouse) {
        throw new NotFoundException('Warehouse not found');
      }

      if (warehouse.companyId !== data.companyId) {
        throw new BadRequestException(
          'Warehouse belongs to a different company',
        );
      }
    }

    try {
      return await this.prisma.inventoryLocation.create({
        data: {
          companyId: data.companyId,
          siteId: data.siteId,
          warehouseId: data.warehouseId,
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
        throw new ConflictException(
          'Inventory location already exists for this site or warehouse',
        );
      }
      throw error;
    }
  }

  async findAll(companyId?: string) {
    return this.prisma.inventoryLocation.findMany({
      where: companyId ? { companyId } : undefined,
      include: {
        site: true,
        warehouse: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const location = await this.prisma.inventoryLocation.findUnique({
      where: { id },
      include: {
        site: true,
        warehouse: true,
      },
    });

    if (!location) {
      throw new NotFoundException('Inventory location not found');
    }

    return location;
  }

  async update(id: string, data: UpdateLocationDto) {
    await this.findOne(id);

    if (!data || typeof data.isActive !== 'boolean') {
      throw new BadRequestException('isActive must be a boolean');
    }

    return this.prisma.inventoryLocation.update({
      where: { id },
      data: { isActive: data.isActive },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    try {
      return await this.prisma.inventoryLocation.delete({
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
          'Cannot delete inventory location with related records',
        );
      }
      throw error;
    }
  }
}
