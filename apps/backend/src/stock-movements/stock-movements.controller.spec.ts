import { StockMovementsService } from './stock-movements.service.js';
import { Test, TestingModule } from '@nestjs/testing';
import { StockMovementsController } from './stock-movements.controller.js';

describe('StockMovementsController', () => {
  let controller: StockMovementsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockMovementsController],
      providers: [
        { provide: StockMovementsService, useValue: {} },
      ],
    }).compile();

    controller = module.get<StockMovementsController>(StockMovementsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
