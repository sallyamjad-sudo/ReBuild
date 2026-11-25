
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

type CreateStockDto = {
  batchId?: string;
  locationId?: string;
};

@Injectable()
export class InventoryStockService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateStockDto) {
    if (
      !data ||
      typeof data.batchId !== 'string' ||
      typeof data.locationId !== 'string'
    ) {
      throw new BadRequestException(
        'batchId and locationId are required',
      );
    }

    const batch = await this.prisma.materialBatch.findUnique({
      where: { id: data.batchId },
      include: { material: true },
    });

    if (!batch) {
      throw new NotFoundException('Material batch not found');
    }

    if (!batch.material.isActive) {
      throw new BadRequestException('Material is inactive');
    }

    const location = await this.prisma.inventoryLocation.findUnique({
      where: { id: data.locationId },
    });

    if (!location) {
      throw new NotFoundException('Inventory location not found');
    }

    if (!location.isActive) {
      throw new BadRequestException('Inventory location is inactive');
    }

    try {
      return await this.prisma.inventoryStock.create({
        data: {
          batchId: data.batchId,
          locationId: data.locationId,
          usableQuantity: 0,
          quarantinedQuantity: 0,
          damagedQuantity: 0,
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
          'Stock record already exists for this batch and location',
        );
      }
      throw error;
    }
  }

  async findAll(locationId?: string, batchId?: string) {
    return this.prisma.inventoryStock.findMany({
      where: {
        ...(locationId ? { locationId } : {}),
        ...(batchId ? { batchId } : {}),
      },
      include: {
        batch: {
          include: {
            material: true,
          },
        },
        location: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const stock = await this.prisma.inventoryStock.findUnique({
      where: { id },
      include: {
        batch: {
          include: {
            material: true,
          },
        },
        location: true,
      },
    });

    if (!stock) {
      throw new NotFoundException('Inventory stock not found');
    }

    return stock;
  }

  async getSummary(locationId?: string) {
    const stocks = await this.prisma.inventoryStock.findMany({
      where: locationId ? { locationId } : undefined,
    });

    let usable = 0;
    let quarantined = 0;
    let damaged = 0;

    for (const stock of stocks) {
      usable += Number(stock.usableQuantity);
      quarantined += Number(stock.quarantinedQuantity);
      damaged += Number(stock.damagedQuantity);
    }

    return {
      stockRecords: stocks.length,
      usableQuantity: usable,
      quarantinedQuantity: quarantined,
      damagedQuantity: damaged,
      totalQuantity: usable + quarantined + damaged,
      note: 'Quantities may use different material units',
    };
  }
}
