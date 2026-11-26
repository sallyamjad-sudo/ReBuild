/**
 * PostgreSQL integration tests for MatchConfirmationService.
 * Run ONLY against the dedicated rebuild_test_db database:
 * RUN_DB_INTEGRATION=1 DATABASE_URL='postgresql://.../rebuild_test_db?schema=public' \
 *   npx vitest run src/material-matching/match-confirmation.integration.spec.ts
 *
 * Never point these tests at rebuild_db; the URL guard rejects it.
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { MatchConfirmationService } from './match-confirmation.service.js';

const enabled = process.env.RUN_DB_INTEGRATION === '1';
const integration = enabled ? describe : describe.skip;
const TRIGGER = 'rebuild_test_fail_second_reservation';
const FN = 'rebuild_test_fail_second_reservation_fn';

const made = {
  company: [] as string[], user: [] as string[], category: [] as string[],
  material: [] as string[], project: [] as string[], site: [] as string[],
  location: [] as string[], batch: [] as string[], stock: [] as string[],
  request: [] as string[], item: [] as string[], result: [] as string[],
};
const track = (kind: keyof typeof made, id: string) => { made[kind].push(id); return id; };
const resetTracking = () => { for (const keys of Object.values(made)) keys.length = 0; };

let db: PrismaClient;
let service: MatchConfirmationService;

// This helper deliberately avoids modifying the ordinary development database.
function requireTestUrl(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error('DATABASE_URL is required');
  const url = new URL(raw);
  if (url.pathname !== '/rebuild_test_db' ||
      !['localhost', '127.0.0.1'].includes(url.hostname) ||
      url.port !== '15433') {
    throw new Error('SAFETY STOP: integration tests require localhost:15433/rebuild_test_db');
  }
  return raw;
}

async function removeFailureTrigger() {
  await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS ${TRIGGER} ON "Reservation"`);
  await db.$executeRawUnsafe(`DROP FUNCTION IF EXISTS ${FN}()`);
}

async function cleanFixture() {
  // Delete in foreign-key dependency order, scoped to IDs made by this test.
  if (made.item.length) await db.reservation.deleteMany({ where: { requestItemId: { in: made.item } } });
  if (made.result.length) {
    await db.matchConfirmation.deleteMany({ where: { matchResultId: { in: made.result } } });
    await db.matchCandidate.deleteMany({ where: { matchResultId: { in: made.result } } });
    await db.matchResult.deleteMany({ where: { id: { in: made.result } } });
  }
  if (made.item.length) await db.materialRequestItem.deleteMany({ where: { id: { in: made.item } } });
  if (made.request.length) await db.materialRequest.deleteMany({ where: { id: { in: made.request } } });
  if (made.stock.length) await db.inventoryStock.deleteMany({ where: { id: { in: made.stock } } });
  if (made.batch.length) await db.materialBatch.deleteMany({ where: { id: { in: made.batch } } });
  if (made.location.length) await db.inventoryLocation.deleteMany({ where: { id: { in: made.location } } });
  if (made.site.length) await db.site.deleteMany({ where: { id: { in: made.site } } });
  if (made.project.length) await db.project.deleteMany({ where: { id: { in: made.project } } });
  if (made.material.length) await db.material.deleteMany({ where: { id: { in: made.material } } });
  if (made.category.length) await db.materialCategory.deleteMany({ where: { id: { in: made.category } } });
  if (made.user.length) await db.user.deleteMany({ where: { id: { in: made.user } } });
  if (made.company.length) await db.company.deleteMany({ where: { id: { in: made.company } } });
  resetTracking();
}

/** Create only the minimal real relational fixture required by confirm(). */
async function fixture(quantities: number[], requests: number) {
  const suffix = randomUUID().slice(0, 12);
  const company = await db.company.create({ data: { name: `IT ${suffix}`, status: 'ACTIVE' } });
  track('company', company.id);
  const user = await db.user.create({ data: {
    email: `it-${suffix}@example.invalid`, passwordHash: 'integration-test-only',
    firstName: 'Integration', lastName: 'Tester', status: 'ACTIVE',
  } });
  track('user', user.id);
  const project = await db.project.create({ data: {
    companyId: company.id, code: `IT-${suffix}`, name: 'Integration project', status: 'ACTIVE',
  } });
  track('project', project.id);
  const site = await db.site.create({ data: {
    projectId: project.id, name: 'Integration site', status: 'ACTIVE',
  } });
  track('site', site.id);
  const location = await db.inventoryLocation.create({ data: {
    companyId: company.id, siteId: site.id, isActive: true,
  } });
  track('location', location.id);
  const category = await db.materialCategory.create({ data: {
    name: 'Integration material category', code: `IT-${suffix}`, isActive: true,
  } });
  track('category', category.id);
  const material = await db.material.create({ data: {
    categoryId: category.id, code: `IT-${suffix}`, name: 'Integration concrete',
    baseUnit: 'm3', isActive: true,
  } });
  track('material', material.id);

  const stocks: string[] = [];
  for (let index = 0; index < quantities.length; index++) {
    const batch = await db.materialBatch.create({ data: {
      materialId: material.id, batchCode: `IT-${suffix}-${index}`,
    } });
    track('batch', batch.id);
    const stock = await db.inventoryStock.create({ data: {
      batchId: batch.id, locationId: location.id, usableQuantity: quantities[index],
    } });
    track('stock', stock.id);
    stocks.push(stock.id);
  }

  const ids: { item: string; result: string }[] = [];
  const total = quantities.reduce((sum, n) => sum + n, 0);
  for (let n = 0; n < requests; n++) {
    const request = await db.materialRequest.create({ data: {
      companyId: company.id, projectId: project.id, siteId: site.id,
      requestedById: user.id, status: 'SUBMITTED', priority: 'NORMAL',
    } });
    track('request', request.id);
    const item = await db.materialRequestItem.create({ data: {
      requestId: request.id, materialId: material.id,
      requestedQuantity: total, unit: 'm3', singleBatchOnly: false,
    } });
    track('item', item.id);
    const result = await db.matchResult.create({ data: {
      requestItemId: item.id, algorithmVersion: 'integration-test',
      status: 'FULL_MATCH', requestedQuantity: total,
      proposedCoveredQuantity: total, remainingQuantity: 0, executedAt: new Date(),
    } });
    track('result', result.id);
    for (let index = 0; index < stocks.length; index++) {
      await db.matchCandidate.create({ data: {
        matchResultId: result.id, inventoryStockId: stocks[index],
        eligibleQuantity: quantities[index], proposedQuantity: quantities[index],
        matchScore: 100, rank: index + 1,
      } });
    }
    ids.push({ item: item.id, result: result.id });
  }
  return { userId: user.id, items: ids, stocks };
}

integration('Match confirmation — real PostgreSQL integration', () => {
  beforeAll(async () => {
    const url = requireTestUrl();
    db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
    await db.$connect();
    const actual = await db.$queryRawUnsafe<Array<{ database_name: string }>>(
      'SELECT current_database() AS database_name',
    );
    if (actual[0]?.database_name !== 'rebuild_test_db') {
      await db.$disconnect();
      throw new Error('SAFETY STOP: connected to the wrong database');
    }
    service = new MatchConfirmationService(db as unknown as PrismaService);
  });

  afterEach(async () => {
    if (!db) return;
    try { await removeFailureTrigger(); } finally { await cleanFixture(); }
  });
  afterAll(async () => { if (db) await db.$disconnect(); });

  it('rolls back the confirmation AND first reservation when the second insert fails', async () => {
    const data = await fixture([6, 4], 1);
    const target = data.items[0];

    // Test-only DB trigger: the first reservation (6) succeeds; second (4) throws.
    await db.$executeRawUnsafe(`
      CREATE FUNCTION ${FN}() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        IF NEW."quantity" = 4 THEN
          RAISE EXCEPTION 'intentional integration test failure';
        END IF;
        RETURN NEW;
      END;
      $$
    `);
    await db.$executeRawUnsafe(`
      CREATE TRIGGER ${TRIGGER}
      BEFORE INSERT ON "Reservation"
      FOR EACH ROW EXECUTE FUNCTION ${FN}()
    `);

    await expect(service.confirm(target.result, { confirmedById: data.userId }))
      .rejects.toThrow();

    expect(await db.matchConfirmation.count({ where: { matchResultId: target.result } })).toBe(0);
    expect(await db.reservation.count({ where: { requestItemId: target.item } })).toBe(0);
  });

  it('prevents overbooking when two results compete for the same 10 units', async () => {
    const data = await fixture([10], 2);
    const attempts = await Promise.allSettled(data.items.map((entry) =>
      service.confirm(entry.result, { confirmedById: data.userId }),
    ));
    const succeeded = attempts.filter((outcome) => outcome.status === 'fulfilled');
    const failed = attempts.filter((outcome) => outcome.status === 'rejected');

    const reservations = await db.reservation.findMany({
      where: { inventoryStockId: data.stocks[0], status: 'ACTIVE' },
    });
    const sum = reservations.reduce((n, r) => n + Number(r.quantity), 0);
    const confirmations = await db.matchConfirmation.count({
      where: { matchResultId: { in: data.items.map((entry) => entry.result) } },
    });

    expect(succeeded).toHaveLength(1);
    expect(failed).toHaveLength(1);
    expect(sum).toBe(10);
    expect(confirmations).toBe(1);
  });
});
