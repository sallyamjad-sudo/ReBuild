import { Test, TestingModule } from '@nestjs/testing';
import { MaterialRequestsController } from './material-requests.controller.js';

describe('MaterialRequestsController', () => {
  let controller: MaterialRequestsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MaterialRequestsController],
    }).compile();

    controller = module.get<MaterialRequestsController>(MaterialRequestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
