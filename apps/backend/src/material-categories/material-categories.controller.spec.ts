import { MaterialCategoriesService } from './material-categories.service.js';
import { Test, TestingModule } from '@nestjs/testing';
import { MaterialCategoriesController } from './material-categories.controller.js';

describe('MaterialCategoriesController', () => {
  let controller: MaterialCategoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MaterialCategoriesController],
      providers: [
        { provide: MaterialCategoriesService, useValue: {} },
      ],
    }).compile();

    controller = module.get<MaterialCategoriesController>(MaterialCategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
