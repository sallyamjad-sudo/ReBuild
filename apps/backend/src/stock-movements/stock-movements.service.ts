
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';

type CreateMovementDto = {
  inventoryStockId?: string;
  performedById?: string;
  movementType?: 'RECEIPT' | 'ISSUE';
  quantity?: string | number;
};

@Injectable()
export class StockMovementsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateMovementDto) {
    if (!data || typeof data !== 'object') {
      throw new BadRequestException('Request body is required');
    }

    if (
      data.movementType !== 'RECEIPT' &&
      data.movementType !== 'ISSUE'
    ) {
      throw new BadRequestException(
        'Only RECEIPT and ISSUE are currently supported',
      );
    }

    if (
      typeof data.inventoryStockId !== 'string' ||
      typeof data.performedById !== 'string'
    ) {
      throw new BadRequestException(
        'inventoryStockId and performedById are required',
      );
    }

    const quantityText = String(data.quantity ?? '');

    if (
      !/^\d+(\.\d{1,3})?$/.test(quantityText) ||
      quantityText.length > 20
    ) {
      throw new BadRequestException(
        'Quantity must be a positive number with up to 3 decimal places',
      );
    }

    const quantity = new Prisma.Decimal(quantityText);

    if (quantity.lte(0)) {
      throw new BadRequestException('Quantity must be greater than zero');
    }

    // Retry transactions that encounter a serialization conflict.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const user = await tx.user.findUnique({
              where: { id: data.performedById! },
            });

            if (!user) {
              throw new NotFoundException('User not found');
            }

            const stock = await tx.inventoryStock.findUnique({
              where: { id: data.inventoryStockId! },
              include: {
                location: true,
                batch: { include: { material: true } },
              },
            });

            if (!stock) {
              throw new NotFoundException('Inventory stock not found');
            }

            if (!stock.location.isActive || !stock.batch.material.isActive) {
              throw new BadRequestException(
                'Inventory location or material is inactive',
              );
            }

            if (data.movementType === 'RECEIPT') {
              await tx.inventoryStock.update({
                where: { id: stock.id },
                data: {
                  usableQuantity: { increment: quantity },
                },
              });

              return tx.stockMovement.create({
                data: {
                  batchId: stock.batchId,
                  destinationLocationId: stock.locationId,
                  performedById: data.performedById!,
                  quantity,
                  movementType: 'RECEIPT',
                },
              });
            }

            // Do not issue stock while reservations or
            // allocations need their own consumption workflow.
            const [reservationCount, allocationCount] =
              await Promise.all([
                tx.reservation.count({
                  where: {
                    inventoryStockId: stock.id,
                    status: 'ACTIVE',
                  },
                }),
                tx.projectAllocation.count({
                  where: { inventoryStockId: stock.id },
                }),
              ]);

            if (reservationCount > 0 || allocationCount > 0) {
              throw new ConflictException(
                'Stock has reservations or allocations; use the dedicated fulfillment workflow',
              );
            }

            const result = await tx.inventoryStock.updateMany({
              where: {
                id: stock.id,
                usableQuantity: { gte: quantity },
              },
              data: {
                usableQuantity: { decrement: quantity },
              },
            });

            if (result.count !== 1) {
              throw new ConflictException(
                'Insufficient usable stock quantity',
              );
            }

            return tx.stockMovement.create({
              data: {
                batchId: stock.batchId,
                sourceLocationId: stock.locationId,
                performedById: data.performedById!,
                quantity,
                movementType: 'ISSUE',
              },
            });
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );
      } catch (error: unknown) {
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          error.code === 'P2034'
        ) {
          if (attempt < 2) continue;
          throw new ConflictException(
            'Concurrent stock update. Please retry',
          );
        }

        throw error;
      }
    }

    throw new ConflictException('Could not process stock movement');
  }

  async findAll(batchId?: string) {
    return this.prisma.stockMovement.findMany({
      where: batchId ? { batchId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const movement = await this.prisma.stockMovement.findUnique({
      where: { id },
    });

    if (!movement) {
      throw new NotFoundException('Stock movement not found');
    }

    return movement;
  }
}
