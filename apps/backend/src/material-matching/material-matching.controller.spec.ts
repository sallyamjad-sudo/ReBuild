
import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';

import { MaterialMatchingController } from './material-matching.controller.js';
import { MaterialMatchingService } from './material-matching.service.js';
import { MatchConfirmationService } from './match-confirmation.service.js';

describe('MaterialMatchingController', () => {
  let controller: MaterialMatchingController;

  const mockMatchingService = {
    runMatching: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
  };

  const mockConfirmationService = {
    confirm: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MaterialMatchingController],
      providers: [
        {
          provide: MaterialMatchingService,
          useValue: mockMatchingService,
        },
        {
          provide: MatchConfirmationService,
          useValue: mockConfirmationService,
        },
      ],
    }).compile();

    controller = module.get<MaterialMatchingController>(
      MaterialMatchingController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should forward confirmation to MatchConfirmationService', async () => {
    const matchResultId = '11111111-1111-4111-8111-111111111111';
    const confirmedById = '22222222-2222-4222-8222-222222222222';

    const expected = {
      id: '33333333-3333-4333-8333-333333333333',
      matchResultId,
    };

    mockConfirmationService.confirm.mockResolvedValue(expected);

    const result = await controller.confirm(matchResultId, {
      confirmedById,
    });

    expect(mockConfirmationService.confirm).toHaveBeenCalledWith(
      matchResultId,
      { confirmedById },
    );
    expect(result).toEqual(expected);
  });
});
