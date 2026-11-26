import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { MatchConfirmationService } from './match-confirmation.service.js';

const MATCH_ID = '11111111-1111-4111-8111-111111111111';
const USER_ID = '22222222-2222-4222-8222-222222222222';
const ITEM_ID = '33333333-3333-4333-8333-333333333333';
const PROJECT_ID = '44444444-4444-4444-8444-444444444444';
const SITE_ID = '55555555-5555-4555-8555-555555555555';
const COMPANY_ID = '66666666-6666-4666-8666-666666666666';
const STOCK_ID = '77777777-7777-4777-8777-777777777777';
const BATCH_ID = '88888888-8888-4888-8888-888888888888';
const OTHER_BATCH_ID = '99999999-9999-4999-8999-999999999999';
const ALLOCATION_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OTHER_ALLOCATION_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const CONFIRMATION_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const dec = (amount: number | string) => new Prisma.Decimal(amount);

// These tests use an in-memory Prisma mock; no PostgreSQL connection is made.
describe('MatchConfirmationService', () => {
  let service: MatchConfirmationService;
  let tx: any;
  let prisma: any;
  let match: any;
  let stock: any;
  let allocations: any[];
  let covered: any[];

  beforeEach(() => {
    match = {
      id: MATCH_ID,
      confirmation: null,
      expiresAt: null,
      requestedQuantity: dec(70),
      proposedCoveredQuantity: dec(70),
      requestItem: {
        id: ITEM_ID,
        materialId: 'material-1',
        requestedQuantity: dec(70),
        singleBatchOnly: true,
        unit: 'm3',
        technicalRequirements: null,
        material: { isActive: true, baseUnit: 'm3' },
        request: {
          companyId: COMPANY_ID,
          projectId: PROJECT_ID,
          siteId: SITE_ID,
          status: 'SUBMITTED',
        },
      },
      matchCandidates: [
        { inventoryStockId: STOCK_ID, proposedQuantity: dec(70) },
      ],
    };
    stock = {
      id: STOCK_ID,
      batchId: BATCH_ID,
      usableQuantity: dec(100),
      batch: {
        materialId: 'material-1',
        material: { isActive: true },
        expiresAt: null,
      },
      location: {
        isActive: true,
        companyId: COMPANY_ID,
        site: { status: 'ACTIVE' },
        warehouse: null,
      },
    };
    allocations = [
      { id: ALLOCATION_ID, projectId: PROJECT_ID, quantity: dec(40), reservations: [] },
      { id: OTHER_ALLOCATION_ID, projectId: 'another-project', quantity: dec(20), reservations: [] },
    ];
    covered = [];

    tx = {
      matchResult: { findUnique: vi.fn(async () => match) },
      user: { findUnique: vi.fn(async () => ({ id: USER_ID, status: 'ACTIVE' })) },
      project: { findUnique: vi.fn(async () => ({ id: PROJECT_ID, companyId: COMPANY_ID })) },
      site: { findUnique: vi.fn(async () => ({ id: SITE_ID, projectId: PROJECT_ID, status: 'ACTIVE' })) },
      inventoryStock: { findUnique: vi.fn(async () => stock) },
      projectAllocation: { findMany: vi.fn(async () => allocations) },
      reservation: {
        findMany: vi.fn(async () => covered),
        aggregate: vi.fn(async () => ({ _sum: { quantity: dec(0) } })),
        create: vi.fn(async ({ data }: any) => ({ id: 'reservation-id', ...data })),
      },
      matchConfirmation: {
        create: vi.fn(async () => ({ id: CONFIRMATION_ID, matchResultId: MATCH_ID })),
        findUniqueOrThrow: vi.fn(async () => ({ id: CONFIRMATION_ID, matchResultId: MATCH_ID, reservations: [] })),
      },
    };
    prisma = {
      $transaction: vi.fn(async (callback: any) => callback(tx)),
    };
    service = new MatchConfirmationService(prisma as PrismaService);
  });

  it('atomically creates a confirmation and splits reservations between free stock and own allocation', async () => {
    const result = await service.confirm(MATCH_ID, { confirmedById: USER_ID });
    expect(result.id).toBe(CONFIRMATION_ID);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction.mock.calls[0][1]).toEqual({
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    expect(tx.matchConfirmation.create).toHaveBeenCalledWith({
      data: { matchResultId: MATCH_ID, confirmedById: USER_ID },
    });
    expect(tx.reservation.create).toHaveBeenCalledTimes(2);
    const created = tx.reservation.create.mock.calls.map(([arg]: any[]) => arg.data);
    expect(created.map((row: any) => ({
      stock: row.inventoryStockId,
      allocation: row.projectAllocationId,
      quantity: row.quantity.toString(),
      confirmation: row.matchConfirmationId,
    }))).toEqual([
      { stock: STOCK_ID, allocation: null, quantity: '40', confirmation: CONFIRMATION_ID },
      { stock: STOCK_ID, allocation: ALLOCATION_ID, quantity: '30', confirmation: CONFIRMATION_ID },
    ]);
    expect(created.every((row: any) => row.status === 'ACTIVE' && row.reservedById === USER_ID)).toBe(true);
  });

  it('refuses to confirm the same matching result twice', async () => {
    match.matchConfirmation = { id: CONFIRMATION_ID };
    await expect(service.confirm(MATCH_ID, { confirmedById: USER_ID })).rejects.toThrow(
      'Matching result is already confirmed',
    );
    expect(tx.matchConfirmation.create).not.toHaveBeenCalled();
  });

  it('refuses stale results when reservations changed the remaining demand', async () => {
    covered = [{ quantity: dec(10), inventoryStock: { batchId: BATCH_ID } }];
    await expect(service.confirm(MATCH_ID, { confirmedById: USER_ID })).rejects.toThrow(
      'Matching result is stale',
    );
    expect(tx.reservation.create).not.toHaveBeenCalled();
  });

  it('refuses a proposal that exceeds currently available stock', async () => {
    stock.usableQuantity = dec(30);
    await expect(service.confirm(MATCH_ID, { confirmedById: USER_ID })).rejects.toThrow(
      'Not enough stock available',
    );
    expect(tx.matchConfirmation.create).not.toHaveBeenCalled();
  });

  it('refuses an expired material batch even if the proposal was created earlier', async () => {
    stock.batch.expiresAt = new Date('2020-01-01T00:00:00Z');
    await expect(service.confirm(MATCH_ID, { confirmedById: USER_ID })).rejects.toThrow(
      'A proposed stock is no longer eligible',
    );
  });

  it('rejects an already expired matching result', async () => {
    match.expiresAt = new Date('2020-01-01T00:00:00Z');
    await expect(service.confirm(MATCH_ID, { confirmedById: USER_ID })).rejects.toThrow(
      'Matching result has expired',
    );
  });

  it('rejects a single-batch request that already has a reservation from another batch', async () => {
    covered = [{ quantity: dec(10), inventoryStock: { batchId: OTHER_BATCH_ID } }];
    match.requestedQuantity = dec(60);
    match.proposedCoveredQuantity = dec(60);
    match.matchCandidates[0].proposedQuantity = dec(60);
    await expect(service.confirm(MATCH_ID, { confirmedById: USER_ID })).rejects.toThrow(
      'Request requires a single material batch',
    );
    expect(tx.matchConfirmation.create).not.toHaveBeenCalled();
  });

  it('rejects a zero-quantity proposal', async () => {
    match.proposedCoveredQuantity = dec(0);
    match.matchCandidates = [];
    await expect(service.confirm(MATCH_ID, { confirmedById: USER_ID })).rejects.toThrow(
      'Matching result has no quantities to confirm',
    );
  });

  it('validates both IDs before opening a transaction', async () => {
    await expect(service.confirm('invalid', { confirmedById: USER_ID })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.confirm(MATCH_ID, { confirmedById: 'invalid' })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('reports missing match results', async () => {
    match = null;
    await expect(service.confirm(MATCH_ID, { confirmedById: USER_ID })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('retries a Prisma serialization conflict (P2034)', async () => {
    prisma.$transaction.mockRejectedValueOnce({ code: 'P2034' });
    await expect(service.confirm(MATCH_ID, { confirmedById: USER_ID })).resolves.toMatchObject({ id: CONFIRMATION_ID });
    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
  });

  it('converts a confirmation unique-key conflict (P2002) to HTTP Conflict', async () => {
    tx.matchConfirmation.create.mockRejectedValueOnce({ code: 'P2002' });
    await expect(service.confirm(MATCH_ID, { confirmedById: USER_ID })).rejects.toBeInstanceOf(ConflictException);
    expect(tx.reservation.create).not.toHaveBeenCalled();
  });

  it('does not issue subsequent reservations when creating a reservation fails', async () => {
    tx.reservation.create.mockRejectedValueOnce(new Error('simulated insert failure'));
    await expect(service.confirm(MATCH_ID, { confirmedById: USER_ID })).rejects.toThrow('simulated insert failure');
    expect(tx.reservation.create).toHaveBeenCalledTimes(1);
    // True database rollback requires a separate PostgreSQL integration test.
  });
});
