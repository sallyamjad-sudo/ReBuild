import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

type ConfirmMatchDto = {
  confirmedById?: string;
};

@Injectable()
export class MatchConfirmationService {
  constructor(private readonly prisma: PrismaService) {}

  private validateId(value: unknown, name: string): string {
    if (
      typeof value !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
    ) {
      throw new BadRequestException(`${name} must be a valid UUID`);
    }
    return value;
  }

  private positive(value: Prisma.Decimal): Prisma.Decimal {
    return value.gt(0) ? value : new Prisma.Decimal(0);
  }

  async confirm(matchResultId: string, body: ConfirmMatchDto) {
    this.validateId(matchResultId, 'matchResultId');
    const confirmedById = this.validateId(body?.confirmedById, 'confirmedById');

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const [result, user] = await Promise.all([
              tx.matchResult.findUnique({
                where: { id: matchResultId },
                include: {
                  requestItem: {
                    include: { request: true, material: true },
                  },
                  matchCandidates: {
                    where: { proposedQuantity: { gt: 0 } },
                    orderBy: { rank: 'asc' },
                  },
                  matchConfirmation: true,
                },
              }),
              tx.user.findUnique({ where: { id: confirmedById } }),
            ]);

            if (!result) throw new NotFoundException('Matching result not found');
            if (!user) throw new NotFoundException('Confirming user not found');
            if (user.status !== 'ACTIVE') {
              throw new BadRequestException('Confirming user is not active');
            }
            if (result.matchConfirmation) {
              throw new ConflictException('Matching result is already confirmed');
            }
            if (result.expiresAt && result.expiresAt.getTime() <= Date.now()) {
              throw new ConflictException('Matching result has expired');
            }

            const item = result.requestItem;
            if (
              item.request.status !== 'SUBMITTED' &&
              item.request.status !== 'PARTIALLY_FULFILLED'
            ) {
              throw new ConflictException('Material request is not open for reservations');
            }
            if (!item.material.isActive || item.unit !== item.material.baseUnit) {
              throw new BadRequestException('Requested material is inactive or unit mismatched');
            }
            if (item.technicalRequirements !== null) {
              throw new BadRequestException('Technical requirements need manual validation');
            }

            const [project, site, covered] = await Promise.all([
              tx.project.findUnique({ where: { id: item.request.projectId } }),
              tx.site.findUnique({ where: { id: item.request.siteId } }),
              tx.reservation.findMany({
                where: {
                  requestItemId: item.id,
                  status: { in: ['ACTIVE', 'CONSUMED'] },
                },
                include: { inventoryStock: true },
              }),
            ]);
            if (
              !project ||
              project.companyId !== item.request.companyId ||
              !site ||
              site.projectId !== project.id ||
              site.status !== 'ACTIVE'
            ) {
              throw new BadRequestException('Request project or site is invalid or inactive');
            }

            const coveredQuantity = covered.reduce(
              (sum, row) => sum.plus(row.quantity),
              new Prisma.Decimal(0),
            );
            const demand = this.positive(item.requestedQuantity.minus(coveredQuantity));
            if (!demand.eq(result.requestedQuantity)) {
              throw new ConflictException('Matching result is stale: remaining demand changed');
            }
            if (result.proposedCoveredQuantity.lte(0) || result.matchCandidates.length === 0) {
              throw new ConflictException('Matching result has no quantities to confirm');
            }

            const proposedTotal = result.matchCandidates.reduce(
              (sum, row) => sum.plus(row.proposedQuantity),
              new Prisma.Decimal(0),
            );
            if (
              !proposedTotal.eq(result.proposedCoveredQuantity) ||
              proposedTotal.gt(demand)
            ) {
              throw new ConflictException('Matching result has inconsistent proposed quantities');
            }

            const existingBatchIds = new Set(covered.map((row) => row.inventoryStock.batchId));
            const confirmedRows: Array<{
              inventoryStockId: string;
              projectAllocationId: string | null;
              quantity: Prisma.Decimal;
            }> = [];
            const selectedBatchIds = new Set<string>();
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);

            for (const candidate of result.matchCandidates) {
              const stock = await tx.inventoryStock.findUnique({
                where: { id: candidate.inventoryStockId },
                include: {
                  batch: { include: { material: true } },
                  location: { include: { site: true, warehouse: true } },
                },
              });
              if (!stock) throw new ConflictException('A proposed stock no longer exists');
              if (
                stock.batch.materialId !== item.materialId ||
                !stock.batch.material.isActive ||
                !stock.location.isActive ||
                stock.location.companyId !== item.request.companyId ||
                (stock.location.site && stock.location.site.status !== 'ACTIVE') ||
                (stock.location.warehouse && !stock.location.warehouse.isActive) ||
                (stock.batch.expiresAt && stock.batch.expiresAt < today)
              ) {
                throw new ConflictException('A proposed stock is no longer eligible');
              }
              selectedBatchIds.add(stock.batchId);

              const allocations = await tx.projectAllocation.findMany({
                where: { inventoryStockId: stock.id },
                orderBy: { id: 'asc' },
                include: {
                  reservations: { where: { status: 'ACTIVE' } },
                },
              });
              const allActive = await tx.reservation.aggregate({
                where: { inventoryStockId: stock.id, status: 'ACTIVE' },
                _sum: { quantity: true },
              });
              const unallocatedActive = await tx.reservation.aggregate({
                where: {
                  inventoryStockId: stock.id,
                  projectAllocationId: null,
                  status: 'ACTIVE',
                },
                _sum: { quantity: true },
              });
              const totalAllocated = allocations.reduce(
                (sum, row) => sum.plus(row.quantity),
                new Prisma.Decimal(0),
              );
              const free = this.positive(
                stock.usableQuantity
                  .minus(totalAllocated)
                  .minus(unallocatedActive._sum.quantity ?? new Prisma.Decimal(0)),
              );
              const ownAvailable = allocations
                .filter((row) => row.projectId === item.request.projectId)
                .reduce((sum, allocation) => {
                  const activeUsed = allocation.reservations.reduce(
                    (total, reservation) => total.plus(reservation.quantity),
                    new Prisma.Decimal(0),
                  );
                  return sum.plus(this.positive(allocation.quantity.minus(activeUsed)));
                }, new Prisma.Decimal(0));
              const physicalAvailable = this.positive(
                stock.usableQuantity.minus(allActive._sum.quantity ?? new Prisma.Decimal(0)),
              );
              const available = Prisma.Decimal.min(physicalAvailable, free.plus(ownAvailable));
              if (candidate.proposedQuantity.gt(available)) {
                throw new ConflictException(`Not enough stock available for ${stock.id}; run matching again`);
              }

              // Reserve from unallocated stock first, then allocations owned by this project.
              let needed = candidate.proposedQuantity;
              const fromFree = Prisma.Decimal.min(free, needed);
              if (fromFree.gt(0)) {
                confirmedRows.push({
                  inventoryStockId: stock.id,
                  projectAllocationId: null,
                  quantity: fromFree,
                });
                needed = needed.minus(fromFree);
              }
              for (const allocation of allocations) {
                if (needed.lte(0)) break;
                if (allocation.projectId !== item.request.projectId) continue;
                const reserved = allocation.reservations.reduce(
                  (sum, row) => sum.plus(row.quantity),
                  new Prisma.Decimal(0),
                );
                const allocationAvailable = this.positive(allocation.quantity.minus(reserved));
                const take = Prisma.Decimal.min(needed, allocationAvailable);
                if (take.gt(0)) {
                  confirmedRows.push({
                    inventoryStockId: stock.id,
                    projectAllocationId: allocation.id,
                    quantity: take,
                  });
                  needed = needed.minus(take);
                }
              }
              if (needed.gt(0)) {
                throw new ConflictException('Unable to distribute proposal across allocations');
              }
            }

            if (item.singleBatchOnly) {
              const allBatchIds = new Set([...existingBatchIds, ...selectedBatchIds]);
              if (allBatchIds.size > 1) {
                throw new ConflictException('Request requires a single material batch');
              }
            }

            const confirmation = await tx.matchConfirmation.create({
              data: { matchResultId, confirmedById },
            });
            for (const row of confirmedRows) {
              await tx.reservation.create({
                data: {
                  requestItemId: item.id,
                  inventoryStockId: row.inventoryStockId,
                  projectAllocationId: row.projectAllocationId,
                  matchConfirmationId: confirmation.id,
                  reservedById: confirmedById,
                  quantity: row.quantity,
                  status: 'ACTIVE',
                  reservedAt: new Date(),
                },
              });
            }
            return tx.matchConfirmation.findUniqueOrThrow({
              where: { id: confirmation.id },
              include: { reservations: true },
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error) {
          if (error.code === 'P2034') {
            if (attempt < 2) continue;
            throw new ConflictException('Concurrent stock change; please retry');
          }
          if (error.code === 'P2002') {
            throw new ConflictException('Matching result is already confirmed');
          }
        }
        throw error;
      }
    }
    throw new ConflictException('Could not confirm matching result');
  }
}
