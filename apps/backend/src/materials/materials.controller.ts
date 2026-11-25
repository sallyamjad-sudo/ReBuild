
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
import { MaterialsService } from './materials.service.js';

@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post()
  create(@Body() body: Parameters<MaterialsService['create']>[0]) {
    return this.materialsService.create(body);
  }

  @Get()
  findAll(@Query('categoryId') categoryId?: string) {
    return this.materialsService.findAll(categoryId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.materialsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Parameters<MaterialsService['update']>[1],
  ) {
    return this.materialsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.materialsService.remove(id);
  }
}
