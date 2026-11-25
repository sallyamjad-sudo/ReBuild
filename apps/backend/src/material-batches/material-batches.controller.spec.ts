import { Test, TestingModule } from '@nestjs/testing';
import { MaterialBatchesController } from './material-batches.controller.js';

describe('MaterialBatchesController', () => {
  let controller: MaterialBatchesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MaterialBatchesController],
    }).compile();

    controller = module.get<MaterialBatchesController>(MaterialBatchesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
