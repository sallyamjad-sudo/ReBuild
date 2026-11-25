
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service.js';

@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
  ) {}

  @Post()
  create(
    @Body() body: Parameters<ReservationsService['create']>[0],
  ) {
    return this.reservationsService.create(body);
  }

  @Get()
  findAll(
    @Query('requestItemId') requestItemId?: string,
    @Query('inventoryStockId') inventoryStockId?: string,
    @Query('status') status?: string,
  ) {
    return this.reservationsService.findAll(
      requestItemId,
      inventoryStockId,
      status,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.reservationsService.findOne(id);
  }

  @Patch(':id/close')
  close(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Parameters<ReservationsService['close']>[1],
  ) {
    return this.reservationsService.close(id, body);
  }
}
