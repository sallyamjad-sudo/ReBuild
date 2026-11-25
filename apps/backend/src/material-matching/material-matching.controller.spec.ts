import { MaterialMatchingService } from './material-matching.service.js';
import { Test, TestingModule } from '@nestjs/testing';
import { MaterialMatchingController } from './material-matching.controller.js';

describe('MaterialMatchingController', () => {
  let controller: MaterialMatchingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MaterialMatchingController],
      providers: [
        { provide: MaterialMatchingService, useValue: {} },
      ],
    }).compile();

    controller = module.get<MaterialMatchingController>(MaterialMatchingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
