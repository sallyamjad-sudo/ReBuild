
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';

type CreateReservationDto = {
  requestItemId?: string;
  inventoryStockId?: string;
  projectAllocationId?: string | null;
  reservedById?: string;
  quantity?: string | number;
  expiresAt?: string | null;
};

type CloseReservationDto = {
  status?: 'RELEASED' | 'CANCELLED';
};

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  private validateId(value: unknown, field: string): string {
    if (
      typeof value !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
    ) {
      throw new BadRequestException(`${field} must be a valid UUID`);
    }

    return value;
  }

  private parseQuantity(value: unknown): Prisma.Decimal {
    const text = String(value ?? '');

    if (!/^\d{1,15}(\.\d{1,3})?$/.test(text)) {
      throw new BadRequestException(
        'Quantity must have up to 15 integer digits and 3 decimal places',
      );
    }

    const quantity = new Prisma.Decimal(text);

    if (quantity.lte(0)) {
      throw new BadRequestException(
        'Quantity must be greater than zero',
      );
    }

    return quantity;
  }

  private parseExpiry(value: unknown): Date | null {
    if (value === undefined || value === null) {
      return null;
    }

    if (
      typeof value !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    ) {
      throw new BadRequestException(
        'expiresAt must be an ISO date with timezone',
      );
    }

    const expiry = new Date(value);

    if (
      Number.isNaN(expiry.getTime()) ||
      expiry.getTime() <= Date.now()
    ) {
      throw new BadRequestException(
        'expiresAt must be a valid future date',
      );
    }

    return expiry;
  }

  private async transaction<T>(
    work: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await this.prisma.$transaction(work, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error: unknown) {
        if (
          error !== null &&
          typeof error === 'object' &&
          'code' in error &&
          error.code === 'P2034'
        ) {
          if (attempt < 2) continue;

          throw new ConflictException(
            'Concurrent reservation update. Please retry',
          );
        }

        throw error;
      }
    }

    throw new ConflictException('Could not process reservation');
  }

  async create(body: CreateReservationDto) {
    if (!body || typeof body !== 'object') {
      throw new BadRequestException('Request body is required');
    }

    const requestItemId = this.validateId(
      body.requestItemId,
      'requestItemId',
    );

    const inventoryStockId = this.validateId(
      body.inventoryStockId,
      'inventoryStockId',
    );

    const reservedById = this.validateId(
      body.reservedById,
      'reservedById',
    );

    const projectAllocationId =
      body.projectAllocationId == null
        ? null
        : this.validateId(
            body.projectAllocationId,
            'projectAllocationId',
          );

    const quantity = this.parseQuantity(body.quantity);
    const expiresAt = this.parseExpiry(body.expiresAt);

    return this.transaction(async (tx) => {
      const [item, stock, user] = await Promise.all([
        tx.materialRequestItem.findUnique({
          where: { id: requestItemId },
          include: {
            request: true,
            material: true,
          },
        }),

        tx.inventoryStock.findUnique({
          where: { id: inventoryStockId },
          include: {
            location: true,
            batch: { include: { material: true } },
          },
        }),

        tx.user.findUnique({
          where: { id: reservedById },
        }),
      ]);

      if (!item) {
        throw new NotFoundException('Material request item not found');
      }

      if (!stock) {
        throw new NotFoundException('Inventory stock not found');
      }

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.status !== 'ACTIVE') {
        throw new BadRequestException('User is not active');
      }

      if (
        item.request.status !== 'SUBMITTED' &&
        item.request.status !== 'PARTIALLY_FULFILLED'
      ) {
        throw new ConflictException(
          'Material request must be submitted before reservation',
        );
      }

      if (!item.material.isActive || !stock.batch.material.isActive) {
        throw new BadRequestException('Material is inactive');
      }

      if (item.materialId !== stock.batch.materialId) {
        throw new BadRequestException(
          'Requested material does not match inventory material',
        );
      }

      if (item.unit !== item.material.baseUnit) {
        throw new BadRequestException(
          'Request unit must match the material base unit',
        );
      }

      if (!stock.location.isActive) {
        throw new BadRequestException(
          'Inventory location is inactive',
        );
      }

      if (item.request.companyId !== stock.location.companyId) {
        throw new BadRequestException(
          'Request and stock belong to different companies',
        );
      }

      const project = await tx.project.findUnique({
        where: { id: item.request.projectId },
      });

      if (
        !project ||
        project.companyId !== item.request.companyId
      ) {
        throw new BadRequestException(
          'Request project is invalid for this company',
        );
      }

      const existingForItem = await tx.reservation.findMany({
        where: {
          requestItemId,
          status: { in: ['ACTIVE', 'CONSUMED'] },
        },
        include: {
          inventoryStock: true,
        },
      });

      const alreadyRequested = existingForItem.reduce(
        (total, reservation) => total.plus(reservation.quantity),
        new Prisma.Decimal(0),
      );

      if (
        alreadyRequested.plus(quantity).gt(item.requestedQuantity)
      ) {
        throw new ConflictException(
          'Reservation exceeds remaining requested quantity',
        );
      }

      if (item.singleBatchOnly) {
        const otherBatch = existingForItem.some(
          (reservation) =>
            reservation.inventoryStock.batchId !== stock.batchId,
        );

        if (otherBatch) {
          throw new ConflictException(
            'This request item must use a single material batch',
          );
        }
      }

      const totalAllocations = await tx.projectAllocation.aggregate({
        where: { inventoryStockId },
        _sum: { quantity: true },
      });

      const totalAllocated =
        totalAllocations._sum.quantity ?? new Prisma.Decimal(0);

      const unallocatedReservations = await tx.reservation.aggregate({
        where: {
          inventoryStockId,
          projectAllocationId: null,
          status: 'ACTIVE',
        },
        _sum: { quantity: true },
      });

      const reservedWithoutAllocation =
        unallocatedReservations._sum.quantity ??
        new Prisma.Decimal(0);

      if (projectAllocationId) {
        const allocation = await tx.projectAllocation.findUnique({
          where: { id: projectAllocationId },
        });

        if (!allocation) {
          throw new NotFoundException(
            'Project allocation not found',
          );
        }

        if (
          allocation.inventoryStockId !== inventoryStockId ||
          allocation.projectId !== item.request.projectId
        ) {
          throw new BadRequestException(
            'Allocation does not match the request project and stock',
          );
        }

        const allocatedReservations = await tx.reservation.aggregate({
          where: {
            projectAllocationId,
            status: 'ACTIVE',
          },
          _sum: { quantity: true },
        });

        const usedAllocation =
          allocatedReservations._sum.quantity ??
          new Prisma.Decimal(0);

        if (usedAllocation.plus(quantity).gt(allocation.quantity)) {
          throw new ConflictException(
            'Insufficient available project allocation',
          );
        }
      } else {
        const availableUnallocated = stock.usableQuantity
          .minus(totalAllocated)
          .minus(reservedWithoutAllocation);

        if (quantity.gt(availableUnallocated)) {
          throw new ConflictException(
            `Insufficient unallocated stock. Available: ${availableUnallocated.toString()}`,
          );
        }
      }

      // Protect against an already inconsistent stock state.
      const activeReservations = await tx.reservation.aggregate({
        where: {
          inventoryStockId,
          status: 'ACTIVE',
        },
        _sum: { quantity: true },
      });

      const activeQuantity =
        activeReservations._sum.quantity ??
        new Prisma.Decimal(0);

      if (activeQuantity.plus(quantity).gt(stock.usableQuantity)) {
        throw new ConflictException(
          'Insufficient usable stock for reservation',
        );
      }

      return tx.reservation.create({
        data: {
          requestItemId,
          inventoryStockId,
          projectAllocationId,
          reservedById,
          quantity,
          status: 'ACTIVE',
          reservedAt: new Date(),
          expiresAt,
        },
      });
    });
  }

  async findAll(
    requestItemId?: string,
    inventoryStockId?: string,
    status?: string,
  ) {
    const validStatuses = [
      'ACTIVE',
      'RELEASED',
      'CONSUMED',
      'EXPIRED',
      'CANCELLED',
    ] as const;

    if (
      status &&
      !validStatuses.some((value) => value === status)
    ) {
      throw new BadRequestException('Invalid reservation status');
    }

    return this.prisma.reservation.findMany({
      where: {
        ...(requestItemId
          ? { requestItemId: this.validateId(requestItemId, 'requestItemId') }
          : {}),
        ...(inventoryStockId
          ? {
              inventoryStockId: this.validateId(
                inventoryStockId,
                'inventoryStockId',
              ),
            }
          : {}),
        ...(status
          ? { status: status as (typeof validStatuses)[number] }
          : {}),
      },
      include: {
        requestItem: true,
        inventoryStock: true,
        projectAllocation: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: {
        id: this.validateId(id, 'id'),
      },
      include: {
        requestItem: true,
        inventoryStock: true,
        projectAllocation: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    return reservation;
  }

  async close(id: string, body: CloseReservationDto) {
    const reservationId = this.validateId(id, 'id');

    if (
      body?.status !== 'RELEASED' &&
      body?.status !== 'CANCELLED'
    ) {
      throw new BadRequestException(
        'Status must be RELEASED or CANCELLED',
      );
    }

    return this.transaction(async (tx) => {
      const result = await tx.reservation.updateMany({
        where: {
          id: reservationId,
          status: 'ACTIVE',
        },
        data: {
          status: body.status,
          releasedAt: new Date(),
        },
      });

      if (result.count !== 1) {
        const existing = await tx.reservation.findUnique({
          where: { id: reservationId },
        });

        if (!existing) {
          throw new NotFoundException('Reservation not found');
        }

        throw new ConflictException(
          'Only active reservations can be released or cancelled',
        );
      }

      return tx.reservation.findUniqueOrThrow({
        where: { id: reservationId },
      });
    });
  }
}
