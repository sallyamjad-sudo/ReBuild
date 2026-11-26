
import { randomUUID } from 'node:crypto';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: databaseUrl,
  }),
});

const permissions = [
  {
    code: 'material_requests.read',
    resource: 'material_requests',
    action: 'read',
    description: 'View material requests',
  },
  {
    code: 'material_requests.create',
    resource: 'material_requests',
    action: 'create',
    description: 'Create material requests',
  },
  {
    code: 'material_requests.update',
    resource: 'material_requests',
    action: 'update',
    description: 'Update material requests and items',
  },
  {
    code: 'material_requests.submit',
    resource: 'material_requests',
    action: 'submit',
    description: 'Submit material requests',
  },
  {
    code: 'material_matching.read',
    resource: 'material_matching',
    action: 'read',
    description: 'View material matching results',
  },
  {
    code: 'material_matching.run',
    resource: 'material_matching',
    action: 'run',
    description: 'Run intelligent material matching',
  },
  {
    code: 'material_matching.confirm',
    resource: 'material_matching',
    action: 'confirm',
    description: 'Confirm material matches and create reservations',
  },
];

async function main() {
  console.log('Starting ReBuild database seed...');

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: {
        code: permission.code,
      },
      update: {
        resource: permission.resource,
        action: permission.action,
        description: permission.description,
        isActive: true,
      },
      create: {
        id: randomUUID(),
        ...permission,
        isActive: true,
      },
    });
  }

  console.log(
    `Successfully seeded ${permissions.length} permissions.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error('Database seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
