
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { InventoryStockService } from './inventory-stock.service.js';

@Controller('inventory-stock')
export class InventoryStockController {
  constructor(
    private readonly stockService: InventoryStockService,
  ) {}

  @Post()
  create(
    @Body() body: Parameters<InventoryStockService['create']>[0],
  ) {
    return this.stockService.create(body);
  }

  @Get()
  findAll(
    @Query('locationId') locationId?: string,
    @Query('batchId') batchId?: string,
  ) {
    return this.stockService.findAll(locationId, batchId);
  }

  @Get('summary')
  getSummary(@Query('locationId') locationId?: string) {
    return this.stockService.getSummary(locationId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.stockService.findOne(id);
  }
}
