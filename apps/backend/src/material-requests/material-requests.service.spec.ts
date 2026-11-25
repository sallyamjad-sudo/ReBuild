import { PrismaService } from '../prisma/prisma.service.js';
import { Test, TestingModule } from '@nestjs/testing';
import { MaterialRequestsService } from './material-requests.service.js';

describe('MaterialRequestsService', () => {
  let service: MaterialRequestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaterialRequestsService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<MaterialRequestsService>(MaterialRequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
