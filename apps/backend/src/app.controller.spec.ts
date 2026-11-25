
import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { AppController } from './app.controller.js';
import { PrismaService } from './prisma/prisma.service.js';

describe('AppController', () => {
  let controller: AppController;

  const mockPrismaService = {
    company: {
      count: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return database health status', async () => {
    mockPrismaService.company.count.mockResolvedValue(5);

    const result = await controller.checkDatabase();

    expect(result).toEqual({
      status: 'ok',
      database: 'connected',
      companies: 5,
    });

    expect(mockPrismaService.company.count).toHaveBeenCalledTimes(1);
  });
});
