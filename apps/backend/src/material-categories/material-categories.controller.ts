
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { MaterialCategoriesService } from './material-categories.service.js';

@Controller('material-categories')
export class MaterialCategoriesController {
  constructor(
    private readonly categoriesService: MaterialCategoriesService,
  ) {}

  @Post()
  create(
    @Body() body: Parameters<MaterialCategoriesService['create']>[0],
  ) {
    return this.categoriesService.create(body);
  }

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Parameters<MaterialCategoriesService['update']>[1],
  ) {
    return this.categoriesService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.remove(id);
  }
}
