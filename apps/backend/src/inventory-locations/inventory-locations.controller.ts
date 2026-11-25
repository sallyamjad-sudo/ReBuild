
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { InventoryLocationsService } from './inventory-locations.service.js';

@Controller('inventory-locations')
export class InventoryLocationsController {
  constructor(
    private readonly inventoryLocationsService: InventoryLocationsService,
  ) {}

  @Post()
  create(
    @Body() body: Parameters<InventoryLocationsService['create']>[0],
  ) {
    return this.inventoryLocationsService.create(body);
  }

  @Get()
  findAll(@Query('companyId') companyId?: string) {
    return this.inventoryLocationsService.findAll(companyId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryLocationsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Parameters<InventoryLocationsService['update']>[1],
  ) {
    return this.inventoryLocationsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryLocationsService.remove(id);
  }
}
