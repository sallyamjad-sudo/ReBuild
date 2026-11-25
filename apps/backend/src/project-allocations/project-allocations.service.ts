
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';

type CreateAllocationDto = {
  inventoryStockId?: string;
  projectId?: string;
  quantity?: string | number;
};

type UpdateAllocationDto = {
  quantity?: string | number;
};

@Injectable()
export class ProjectAllocationsService {
  constructor(private readonly prisma: PrismaService) {}

  private parseQuantity(value: unknown): Prisma.Decimal {
    const text = String(value ?? '');

    if (!/^\d{1,15}(\.\d{1,3})?$/.test(text)) {
      throw new BadRequestException(
        'Quantity must be positive with up to 3 decimal places',
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

  private async runTransaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await this.prisma.$transaction(callback, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error: unknown) {
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          error.code === 'P2034'
        ) {
          if (attempt < 2) continue;

          throw new ConflictException(
            'Concurrent allocation update. Please retry',
          );
        }

        throw error;
      }
    }

    throw new ConflictException('Could not process allocation');
  }

  private async validateStockAndProject(
    tx: Prisma.TransactionClient,
    inventoryStockId: string,
    projectId: string,
  ) {
    const stock = await tx.inventoryStock.findUnique({
      where: { id: inventoryStockId },
      include: { location: true },
    });

    if (!stock) {
      throw new NotFoundException('Inventory stock not found');
    }

    if (!stock.location.isActive) {
      throw new BadRequestException(
        'Inventory location is inactive',
      );
    }

    const project = await tx.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.companyId !== stock.location.companyId) {
      throw new BadRequestException(
        'Project and stock must belong to the same company',
      );
    }

    return stock;
  }

  private async checkAvailableQuantity(
    tx: Prisma.TransactionClient,
    inventoryStockId: string,
    requestedQuantity: Prisma.Decimal,
    excludeAllocationId?: string,
  ) {
    const stock = await tx.inventoryStock.findUnique({
      where: { id: inventoryStockId },
    });

    if (!stock) {
      throw new NotFoundException('Inventory stock not found');
    }

    const allocations = await tx.projectAllocation.aggregate({
      where: {
        inventoryStockId,
        ...(excludeAllocationId
          ? { id: { not: excludeAllocationId } }
          : {}),
      },
      _sum: { quantity: true },
    });

    // Active reservations not attached to a project allocation
    // also occupy the shared available stock.
    const unallocatedReservations = await tx.reservation.aggregate({
      where: {
        inventoryStockId,
        projectAllocationId: null,
        status: 'ACTIVE',
      },
      _sum: { quantity: true },
    });

    const allocated = allocations._sum.quantity ??
      new Prisma.Decimal(0);

    const reservedOutsideAllocations =
      unallocatedReservations._sum.quantity ??
      new Prisma.Decimal(0);

    const freeQuantity = stock.usableQuantity
      .minus(allocated)
      .minus(reservedOutsideAllocations);

    if (requestedQuantity.gt(freeQuantity)) {
      throw new ConflictException(
        `Insufficient unallocated stock. Available: ${freeQuantity.toString()}`,
      );
    }
  }

  async create(data: CreateAllocationDto) {
    if (
      !data ||
      typeof data.inventoryStockId !== 'string' ||
      typeof data.projectId !== 'string'
    ) {
      throw new BadRequestException(
        'inventoryStockId and projectId are required',
      );
    }

    const quantity = this.parseQuantity(data.quantity);

    return this.runTransaction(async (tx) => {
      await this.validateStockAndProject(
        tx,
        data.inventoryStockId!,
        data.projectId!,
      );

      await this.checkAvailableQuantity(
        tx,
        data.inventoryStockId!,
        quantity,
      );

      return tx.projectAllocation.create({
        data: {
          inventoryStockId: data.inventoryStockId!,
          projectId: data.projectId!,
          quantity,
        },
      });
    });
  }

  async findAll(projectId?: string, inventoryStockId?: string) {
    return this.prisma.projectAllocation.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        ...(inventoryStockId ? { inventoryStockId } : {}),
      },
      include: {
        project: true,
        inventoryStock: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const allocation = await this.prisma.projectAllocation.findUnique({
      where: { id },
      include: {
        project: true,
        inventoryStock: true,
      },
    });

    if (!allocation) {
      throw new NotFoundException('Project allocation not found');
    }

    return allocation;
  }

  async update(id: string, data: UpdateAllocationDto) {
    const quantity = this.parseQuantity(data?.quantity);

    return this.runTransaction(async (tx) => {
      const allocation = await tx.projectAllocation.findUnique({
        where: { id },
      });

      if (!allocation) {
        throw new NotFoundException('Project allocation not found');
      }

      await this.checkAvailableQuantity(
        tx,
        allocation.inventoryStockId,
        quantity,
        allocation.id,
      );

      const reservations = await tx.reservation.aggregate({
        where: {
          projectAllocationId: id,
          status: 'ACTIVE',
        },
        _sum: { quantity: true },
      });

      const reservedQuantity =
        reservations._sum.quantity ?? new Prisma.Decimal(0);

      if (quantity.lt(reservedQuantity)) {
        throw new ConflictException(
          'Allocation cannot be smaller than its active reservations',
        );
      }

      return tx.projectAllocation.update({
        where: { id },
        data: { quantity },
      });
    });
  }

  async remove(id: string) {
    return this.runTransaction(async (tx) => {
      const allocation = await tx.projectAllocation.findUnique({
        where: { id },
      });

      if (!allocation) {
        throw new NotFoundException('Project allocation not found');
      }

      const reservationCount = await tx.reservation.count({
        where: { projectAllocationId: id },
      });

      if (reservationCount > 0) {
        throw new ConflictException(
          'Cannot delete allocation with reservation history',
        );
      }

      return tx.projectAllocation.delete({
        where: { id },
      });
    });
  }
}
