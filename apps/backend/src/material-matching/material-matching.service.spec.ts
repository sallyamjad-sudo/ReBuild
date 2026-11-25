import { Test, TestingModule } from '@nestjs/testing';
import { MaterialMatchingService } from './material-matching.service.js';

describe('MaterialMatchingService', () => {
  let service: MaterialMatchingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MaterialMatchingService],
    }).compile();

    service = module.get<MaterialMatchingService>(MaterialMatchingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
