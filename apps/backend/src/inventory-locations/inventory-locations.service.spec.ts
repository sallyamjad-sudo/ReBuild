import { PrismaService } from '../prisma/prisma.service.js';
import { Test, TestingModule } from '@nestjs/testing';
import { InventoryLocationsService } from './inventory-locations.service.js';

describe('InventoryLocationsService', () => {
  let service: InventoryLocationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryLocationsService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<InventoryLocationsService>(InventoryLocationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
