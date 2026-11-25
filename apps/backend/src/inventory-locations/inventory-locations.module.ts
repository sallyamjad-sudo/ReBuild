import { Module } from '@nestjs/common';
import { InventoryLocationsController } from './inventory-locations.controller.js';
import { InventoryLocationsService } from './inventory-locations.service.js';

@Module({
  controllers: [InventoryLocationsController],
  providers: [InventoryLocationsService]
})
export class InventoryLocationsModule {}
