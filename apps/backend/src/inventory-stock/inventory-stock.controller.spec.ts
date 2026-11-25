import { InventoryStockService } from './inventory-stock.service.js';
import { Test, TestingModule } from '@nestjs/testing';
import { InventoryStockController } from './inventory-stock.controller.js';

describe('InventoryStockController', () => {
  let controller: InventoryStockController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryStockController],
      providers: [
        { provide: InventoryStockService, useValue: {} },
      ],
    }).compile();

    controller = module.get<InventoryStockController>(InventoryStockController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
