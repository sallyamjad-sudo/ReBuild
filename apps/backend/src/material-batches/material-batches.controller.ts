
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
import { MaterialBatchesService } from './material-batches.service.js';

@Controller('material-batches')
export class MaterialBatchesController {
  constructor(
    private readonly batchesService: MaterialBatchesService,
  ) {}

  @Post()
  create(@Body() body: Parameters<MaterialBatchesService['create']>[0]) {
    return this.batchesService.create(body);
  }

  @Get()
  findAll(@Query('materialId') materialId?: string) {
    return this.batchesService.findAll(materialId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.batchesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Parameters<MaterialBatchesService['update']>[1],
  ) {
    return this.batchesService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.batchesService.remove(id);
  }
}
