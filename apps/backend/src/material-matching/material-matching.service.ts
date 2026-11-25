
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

type Candidate = {
  inventoryStockId: string;
  eligibleQuantity: Prisma.Decimal;
  proposedQuantity: Prisma.Decimal;
  matchScore: number;
  sameSite: boolean;
  sourceType: string;
  batchCode: string;
  expiresAt: Date | null;
  explanation: Record<string, string | number | boolean | null>;
};

@Injectable()
export class MaterialMatchingService {
  private readonly algorithmVersion = '1.0.0';

  constructor(private readonly prisma: PrismaService) {}

  private validateId(id: string): string {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  console.log('UUID DEBUG:', {
    value: JSON.stringify(id),
    type: typeof id,
    length: id?.length,
    isValid: uuidRegex.test(id),
  });

  if (typeof id !== 'string' || !uuidRegex.test(id)) {
    throw new BadRequestException('Invalid UUID');
  }

  return id;
}


private positive(value: Prisma.Decimal): Prisma.Decimal {
  return value.gt(0) ? value : new Prisma.Decimal(0);
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
            'Concurrent inventory change. Please retry',
          );
        }

        throw error;
      }
    }

    throw new ConflictException('Matching could not be completed');
  }

  async runMatching(requestItemId: string) {
    this.validateId(requestItemId);

    return this.transaction(async (tx) => {
      const item = await tx.materialRequestItem.findUnique({
        where: { id: requestItemId },
        include: {
          request: true,
          material: true,
        },
      });

      if (!item) {
        throw new NotFoundException('Material request item not found');
      }

      if (
        item.request.status !== 'SUBMITTED' &&
        item.request.status !== 'PARTIALLY_FULFILLED'
      ) {
        throw new ConflictException(
          'Material request must be submitted before matching',
        );
      }

      if (!item.material.isActive) {
        throw new BadRequestException('Requested material is inactive');
      }

      if (item.unit !== item.material.baseUnit) {
        throw new BadRequestException(
          'Request unit must match the material base unit',
        );
      }

      if (item.technicalRequirements !== null) {
        throw new BadRequestException(
          'Technical requirements need a dedicated validation rule before automatic matching',
        );
      }

      const project = await tx.project.findUnique({
        where: { id: item.request.projectId },
      });

      const site = await tx.site.findUnique({
        where: { id: item.request.siteId },
      });

      if (
        !project ||
        project.companyId !== item.request.companyId ||
        !site ||
        site.projectId !== project.id ||
        site.status !== 'ACTIVE'
      ) {
        throw new BadRequestException(
          'Request project or site is invalid or inactive',
        );
      }

      const previousReservations = await tx.reservation.aggregate({
        where: {
          requestItemId,
          status: { in: ['ACTIVE', 'CONSUMED'] },
        },
        _sum: { quantity: true },
      });

      const alreadyCovered =
        previousReservations._sum.quantity ??
        new Prisma.Decimal(0);

      const remainingDemand = this.positive(
        item.requestedQuantity.minus(alreadyCovered),
      );

      const stocks = await tx.inventoryStock.findMany({
        where: {
          batch: {
            materialId: item.materialId,
            material: { isActive: true },
          },
          location: {
            companyId: item.request.companyId,
            isActive: true,
          },
          usableQuantity: { gt: 0 },
        },
        include: {
          batch: true,
          location: {
            include: {
              site: true,
              warehouse: true,
            },
          },
        },
      });

      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const candidates: Candidate[] = [];

      for (const stock of stocks) {
        if (
          stock.batch.expiresAt &&
          stock.batch.expiresAt.getTime() < today.getTime()
        ) {
          continue;
        }

        if (
          stock.location.site &&
          stock.location.site.status !== 'ACTIVE'
        ) {
          continue;
        }

        if (
          stock.location.warehouse &&
          !stock.location.warehouse.isActive
        ) {
          continue;
        }

        const allocations = await tx.projectAllocation.findMany({
          where: { inventoryStockId: stock.id },
          include: {
            reservations: {
              where: { status: 'ACTIVE' },
            },
          },
        });

        let allocatedTotal = new Prisma.Decimal(0);
        let projectAllocationAvailable = new Prisma.Decimal(0);

        for (const allocation of allocations) {
          allocatedTotal = allocatedTotal.plus(
            allocation.quantity,
          );

          if (allocation.projectId === item.request.projectId) {
            const reserved = allocation.reservations.reduce(
              (sum, reservation) =>
                sum.plus(reservation.quantity),
              new Prisma.Decimal(0),
            );

            projectAllocationAvailable =
              projectAllocationAvailable.plus(
                this.positive(
                  allocation.quantity.minus(reserved),
                ),
              );
          }
        }

        const unallocatedReservations =
          await tx.reservation.aggregate({
            where: {
              inventoryStockId: stock.id,
              projectAllocationId: null,
              status: 'ACTIVE',
            },
            _sum: { quantity: true },
          });

        const unallocatedReserved =
          unallocatedReservations._sum.quantity ??
          new Prisma.Decimal(0);

        const freelyAvailable = this.positive(
          stock.usableQuantity
            .minus(allocatedTotal)
            .minus(unallocatedReserved),
        );

        const allActiveReservations =
          await tx.reservation.aggregate({
            where: {
              inventoryStockId: stock.id,
              status: 'ACTIVE',
            },
            _sum: { quantity: true },
          });

        const activelyReserved =
          allActiveReservations._sum.quantity ??
          new Prisma.Decimal(0);

        const eligibleQuantity = Prisma.Decimal.min(
          this.positive(
            stock.usableQuantity.minus(activelyReserved),
          ),
          freelyAvailable.plus(projectAllocationAvailable),
        );

        if (eligibleQuantity.lte(0)) {
          continue;
        }

        if (item.singleBatchOnly && stock.batchId !== stocks
          .filter((entry) => entry.batchId === stock.batchId)[0]?.batchId) {
          continue;
        }

        const sameSite =
          stock.location.siteId === item.request.siteId;

        const sameProjectWarehouse =
          stock.location.warehouse?.projectId ===
          item.request.projectId;

        // Explainable score (0-100):
        // 50: exact material + valid usable stock
        // 25: same site
        // 15: warehouse assigned to same project
        // 10: enough stock to cover remaining demand
        const score =
          50 +
          (sameSite ? 25 : 0) +
          (sameProjectWarehouse ? 15 : 0) +
          (eligibleQuantity.gte(remainingDemand) ? 10 : 0);

        candidates.push({
          inventoryStockId: stock.id,
          eligibleQuantity,
          proposedQuantity: new Prisma.Decimal(0),
          matchScore: score,
          sameSite,
          sourceType: sameSite
            ? 'SAME_SITE'
            : sameProjectWarehouse
              ? 'PROJECT_WAREHOUSE'
              : 'OTHER_COMPANY_LOCATION',
          batchCode: stock.batch.batchCode,
          expiresAt: stock.batch.expiresAt,
          explanation: {
            materialMatch: 'EXACT',
            locationMatch: sameSite
              ? 'SAME_SITE'
              : sameProjectWarehouse
                ? 'PROJECT_WAREHOUSE'
                : 'OTHER_LOCATION',
            batchCode: stock.batch.batchCode,
            eligibleQuantity: eligibleQuantity.toString(),
            availableWithoutAllocation:
              freelyAvailable.toString(),
            availableFromProjectAllocations:
              projectAllocationAvailable.toString(),
            expiresAt: stock.batch.expiresAt
              ? stock.batch.expiresAt.toISOString()
              : null,
            expiryVerified: stock.batch.expiresAt !== null,
            scoreMaterial: 50,
            scoreSameSite: sameSite ? 25 : 0,
            scoreProjectWarehouse: sameProjectWarehouse ? 15 : 0,
            scoreQuantity:
              eligibleQuantity.gte(remainingDemand) ? 10 : 0,
            technicalRequirementsChecked: false,
            distanceVerified: false,
          },
        });
      }

      candidates.sort((a, b) => {
        if (a.matchScore !== b.matchScore) {
          return b.matchScore - a.matchScore;
        }

        const quantityOrder =
          b.eligibleQuantity.comparedTo(a.eligibleQuantity);

        if (quantityOrder !== 0) {
          return quantityOrder;
        }

        // Earlier expiry first when other factors are equal.
        const expiryA =
          a.expiresAt?.getTime() ?? Number.MAX_SAFE_INTEGER;

        const expiryB =
          b.expiresAt?.getTime() ?? Number.MAX_SAFE_INTEGER;

        if (expiryA !== expiryB) {
          return expiryA - expiryB;
        }

        return a.inventoryStockId.localeCompare(
          b.inventoryStockId,
        );
      });

      let remaining = remainingDemand;
      let selectedBatchId: string | null = null;

      for (const candidate of candidates) {
        if (remaining.lte(0)) break;

        const stock = stocks.find(
          (entry) => entry.id === candidate.inventoryStockId,
        )!;

        if (
          item.singleBatchOnly &&
          selectedBatchId !== null &&
          stock.batchId !== selectedBatchId
        ) {
          continue;
        }

        const proposedQuantity = Prisma.Decimal.min(
          remaining,
          candidate.eligibleQuantity,
        );

        if (proposedQuantity.gt(0)) {
          candidate.proposedQuantity = proposedQuantity;
          remaining = remaining.minus(proposedQuantity);
          selectedBatchId = stock.batchId;
        }
      }

      const proposedCoveredQuantity =
        remainingDemand.minus(remaining);

      const status =
        remainingDemand.eq(0) || remaining.eq(0)
          ? 'FULL_MATCH'
          : proposedCoveredQuantity.gt(0)
            ? 'PARTIAL_MATCH'
            : 'NO_MATCH';

      return tx.matchResult.create({
        data: {
          requestItemId,
          algorithmVersion: this.algorithmVersion,
          status,
          requestedQuantity: remainingDemand,
          proposedCoveredQuantity,
          remainingQuantity: remaining,
          executedAt: new Date(),
          matchCandidates: {
            create: candidates.map((candidate, index) => ({
              inventoryStockId: candidate.inventoryStockId,
              eligibleQuantity: candidate.eligibleQuantity,
              proposedQuantity: candidate.proposedQuantity,
              matchScore: new Prisma.Decimal(candidate.matchScore),
              rank: index + 1,
              explanation: candidate.explanation,
            })),
          },
        },
        include: {
          matchCandidates: {
            include: {
              inventoryStock: {
                include: {
                  batch: { include: { material: true } },
                  location: {
                    include: {
                      site: true,
                      warehouse: true,
                    },
                  },
                },
              },
            },
            orderBy: { rank: 'asc' },
          },
        },
      });
    });
  }

  async findAll(requestItemId: string) {
    this.validateId(requestItemId);

    return this.prisma.matchResult.findMany({
      where: { requestItemId },
      include: {
        matchCandidates: {
          orderBy: { rank: 'asc' },
        },
      },
      orderBy: { executedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    this.validateId(id);

    const result = await this.prisma.matchResult.findUnique({
      where: { id },
      include: {
        requestItem: true,
        matchCandidates: {
          include: {
            inventoryStock: {
              include: {
                batch: { include: { material: true } },
                location: {
                  include: {
                    site: true,
                    warehouse: true,
                  },
                },
              },
            },
          },
          orderBy: { rank: 'asc' },
        },
      },
    });

    if (!result) {
      throw new NotFoundException('Matching result not found');
    }

    return result;
  }
}
