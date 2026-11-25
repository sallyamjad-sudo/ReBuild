import { Test, TestingModule } from '@nestjs/testing';
import { MaterialCategoriesService } from './material-categories.service.js';

describe('MaterialCategoriesService', () => {
  let service: MaterialCategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MaterialCategoriesService],
    }).compile();

    service = module.get<MaterialCategoriesService>(MaterialCategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
