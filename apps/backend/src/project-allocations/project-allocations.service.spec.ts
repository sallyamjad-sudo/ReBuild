import { Test, TestingModule } from '@nestjs/testing';
import { ProjectAllocationsService } from './project-allocations.service.js';

describe('ProjectAllocationsService', () => {
  let service: ProjectAllocationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectAllocationsService],
    }).compile();

    service = module.get<ProjectAllocationsService>(ProjectAllocationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
