import { Test, TestingModule } from '@nestjs/testing';
import { MaterialMatchingController } from './material-matching.controller.js';

describe('MaterialMatchingController', () => {
  let controller: MaterialMatchingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MaterialMatchingController],
    }).compile();

    controller = module.get<MaterialMatchingController>(MaterialMatchingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
