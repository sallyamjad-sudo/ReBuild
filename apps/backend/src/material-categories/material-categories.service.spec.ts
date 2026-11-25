import { PrismaService } from '../prisma/prisma.service.js';
import { Test, TestingModule } from '@nestjs/testing';
import { MaterialCategoriesService } from './material-categories.service.js';

describe('MaterialCategoriesService', () => {
  let service: MaterialCategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaterialCategoriesService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<MaterialCategoriesService>(MaterialCategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
