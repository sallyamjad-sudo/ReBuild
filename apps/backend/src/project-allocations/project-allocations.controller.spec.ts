import { ProjectAllocationsService } from './project-allocations.service.js';
import { Test, TestingModule } from '@nestjs/testing';
import { ProjectAllocationsController } from './project-allocations.controller.js';

describe('ProjectAllocationsController', () => {
  let controller: ProjectAllocationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectAllocationsController],
      providers: [
        { provide: ProjectAllocationsService, useValue: {} },
      ],
    }).compile();

    controller = module.get<ProjectAllocationsController>(ProjectAllocationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
