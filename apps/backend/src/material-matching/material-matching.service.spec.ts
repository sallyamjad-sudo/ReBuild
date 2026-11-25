import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { MaterialMatchingService } from './material-matching.service.js';

const D = (value: number | string) => new Prisma.Decimal(value);
const requestItemId = 'e1c02942-92f5-40de-8a3c-95047a190fbb';
const projectId = '554967ee-95e9-4ffe-8efc-3c96ce271d2e';
const siteId = '9c8fa6b7-dd29-4b2a-b276-a9c7b590c1cd';
const companyId = '613b56b1-e554-4b32-a9b4-223466442362';
const materialId = '3832c28d-5111-43bf-9770-82bf4bc55e55';
const batch1 = 'f78e365a-d8d9-432d-bad6-d3d931f46313';
const batch2 = '4ceb61cb-575b-43cd-9730-40dddd8521d2';

function stock(id: string, batchId: string, quantity: number, options: {
  sameSite?: boolean;
  expiresAt?: Date | null;
} = {}) {
  return {
    id,
    batchId,
    usableQuantity: D(quantity),
    batch: {
      batchCode: batchId === batch1 ? 'BATCH-001' : 'BATCH-002',
      expiresAt: options.expiresAt ?? null,
    },
    location: {
      siteId: options.sameSite === false ? 'f35ae95c-1f8f-4d2b-a492-b16d2df07f7f' : siteId,
      site: { status: 'ACTIVE' },
      warehouse: null,
    },
  };
}

describe('MaterialMatchingService', () => {
  let service: MaterialMatchingService;
  let tx: any;
  let prisma: any;

  beforeEach(() => {
    tx = {
      materialRequestItem: {
        findUnique: vi.fn().mockResolvedValue({
          id: requestItemId,
          materialId,
          requestedQuantity: D(100),
          unit: 'm3',
          singleBatchOnly: false,
          technicalRequirements: null,
          material: { isActive: true, baseUnit: 'm3' },
          request: {
            status: 'SUBMITTED', projectId, siteId, companyId,
          },
        }),
      },
      project: { findUnique: vi.fn().mockResolvedValue({ id: projectId, companyId }) },
      site: { findUnique: vi.fn().mockResolvedValue({ id: siteId, projectId, status: 'ACTIVE' }) },
      inventoryStock: { findMany: vi.fn().mockResolvedValue([]) },
      projectAllocation: { findMany: vi.fn().mockResolvedValue([]) },
      reservation: {
        aggregate: vi.fn().mockResolvedValue({ _sum: { quantity: null } }),
      },
      matchResult: {
        create: vi.fn().mockImplementation(async ({ data }: any) => data),
      },
    };
    prisma = {
      $transaction: vi.fn().mockImplementation((callback: any) => callback(tx)),
    };
    service = new MaterialMatchingService(prisma as PrismaService);
  });

  const run = async () => (await service.runMatching(requestItemId)) as any;
  const proposed = (result: any) => result.matchCandidates.create.map((c: any) =>
    ({ stockId: c.inventoryStockId, qty: c.proposedQuantity.toString() }));

  it('FULL_MATCH: covers the full demand', async () => {
    tx.inventoryStock.findMany.mockResolvedValue([stock('s1', batch1, 110)]);
    const result = await run();
    expect(result.status).toBe('FULL_MATCH');
    expect(result.proposedCoveredQuantity.toString()).toBe('100');
    expect(result.remainingQuantity.toString()).toBe('0');
    expect(proposed(result)).toEqual([{ stockId: 's1', qty: '100' }]);
  });

  it('PARTIAL_MATCH: reports the remaining demand', async () => {
    tx.inventoryStock.findMany.mockResolvedValue([stock('s1', batch1, 70)]);
    const result = await run();
    expect(result.status).toBe('PARTIAL_MATCH');
    expect(result.proposedCoveredQuantity.toString()).toBe('70');
    expect(result.remainingQuantity.toString()).toBe('30');
  });

  it('NO_MATCH: returns no candidates when there is no stock', async () => {
    const result = await run();
    expect(result.status).toBe('NO_MATCH');
    expect(result.proposedCoveredQuantity.toString()).toBe('0');
    expect(result.matchCandidates.create).toEqual([]);
  });

  it('singleBatchOnly: combines the same batch across sites', async () => {
    const item = await tx.materialRequestItem.findUnique();
    tx.materialRequestItem.findUnique.mockResolvedValue({ ...item, singleBatchOnly: true });
    tx.inventoryStock.findMany.mockResolvedValue([
      stock('s1', batch1, 70),
      stock('s2', batch2, 90),
      stock('s3', batch2, 20, { sameSite: false }),
    ]);
    const result = await run();
    expect(result.status).toBe('FULL_MATCH');
    expect(proposed(result)).toEqual([
      { stockId: 's2', qty: '90' },
      { stockId: 's1', qty: '0' },
      { stockId: 's3', qty: '10' },
    ]);
  });

  it('deducts ACTIVE reservations from eligible stock', async () => {
    tx.inventoryStock.findMany.mockResolvedValue([stock('s1', batch1, 90)]);
    tx.reservation.aggregate.mockImplementation(async ({ where }: any) => ({
      _sum: { quantity: where.inventoryStockId === 's1' ? D(30) : null },
    }));
    const result = await run();
    expect(result.status).toBe('PARTIAL_MATCH');
    expect(result.proposedCoveredQuantity.toString()).toBe('60');
    expect(result.matchCandidates.create[0].eligibleQuantity.toString()).toBe('60');
  });

  it('makes own project allocations available but excludes other project allocations', async () => {
    tx.inventoryStock.findMany.mockResolvedValue([stock('s1', batch1, 90)]);
    tx.projectAllocation.findMany.mockResolvedValue([
      { projectId, quantity: D(40), reservations: [] },
      { projectId: 'ac1f4350-7ec1-472c-b607-e25744551ace', quantity: D(30), reservations: [] },
    ]);
    const result = await run();
    expect(result.proposedCoveredQuantity.toString()).toBe('60');
    expect(result.matchCandidates.create[0].explanation.availableWithoutAllocation).toBe('20');
    expect(result.matchCandidates.create[0].explanation.availableFromProjectAllocations).toBe('40');
  });

  it('excludes expired batches, even with large quantities', async () => {
    tx.inventoryStock.findMany.mockResolvedValue([
      stock('expired', batch1, 200, { expiresAt: new Date('2025-01-01T00:00:00.000Z') }),
      stock('valid', batch2, 70),
    ]);
    const result = await run();
    expect(result.status).toBe('PARTIAL_MATCH');
    expect(proposed(result)).toEqual([{ stockId: 'valid', qty: '70' }]);
  });

  it('subtracts reservations on this request from remaining demand', async () => {
    tx.inventoryStock.findMany.mockResolvedValue([stock('s1', batch1, 70)]);
    tx.reservation.aggregate.mockImplementation(async ({ where }: any) => ({
      _sum: { quantity: where.requestItemId === requestItemId ? D(25) : null },
    }));
    const result = await run();
    expect(result.requestedQuantity.toString()).toBe('75');
    expect(result.remainingQuantity.toString()).toBe('5');
  });

  it('rejects invalid UUIDs before querying Prisma', async () => {
    await expect(service.runMatching('invalid')).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects requests that are not submitted', async () => {
    const item = await tx.materialRequestItem.findUnique();
    tx.materialRequestItem.findUnique.mockResolvedValue({
      ...item, request: { ...item.request, status: 'DRAFT' },
    });
    await expect(run()).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws NotFoundException when the item does not exist', async () => {
    tx.materialRequestItem.findUnique.mockResolvedValue(null);
    await expect(run()).rejects.toBeInstanceOf(NotFoundException);
  });

  it('uses Serializable isolation for matching transactions', async () => {
    await run();
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  });
});
