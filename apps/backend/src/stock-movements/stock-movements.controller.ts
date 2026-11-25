
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { StockMovementsService } from './stock-movements.service.js';

@Controller('stock-movements')
export class StockMovementsController {
  constructor(
    private readonly movementsService: StockMovementsService,
  ) {}

  @Post()
  create(
    @Body() body: Parameters<StockMovementsService['create']>[0],
  ) {
    return this.movementsService.create(body);
  }

  @Get()
  findAll(@Query('batchId') batchId?: string) {
    return this.movementsService.findAll(batchId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.movementsService.findOne(id);
  }
}
