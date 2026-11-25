import { Test, TestingModule } from '@nestjs/testing';
import { InventoryStockController } from './inventory-stock.controller.js';

describe('InventoryStockController', () => {
  let controller: InventoryStockController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryStockController],
    }).compile();

    controller = module.get<InventoryStockController>(InventoryStockController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
