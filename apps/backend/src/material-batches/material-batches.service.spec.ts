import { Test, TestingModule } from '@nestjs/testing';
import { MaterialBatchesService } from './material-batches.service.js';

describe('MaterialBatchesService', () => {
  let service: MaterialBatchesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MaterialBatchesService],
    }).compile();

    service = module.get<MaterialBatchesService>(MaterialBatchesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
