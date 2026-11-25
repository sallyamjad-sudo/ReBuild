import { InventoryLocationsService } from './inventory-locations.service.js';
import { Test, TestingModule } from '@nestjs/testing';
import { InventoryLocationsController } from './inventory-locations.controller.js';

describe('InventoryLocationsController', () => {
  let controller: InventoryLocationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryLocationsController],
      providers: [
        { provide: InventoryLocationsService, useValue: {} },
      ],
    }).compile();

    controller = module.get<InventoryLocationsController>(InventoryLocationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
