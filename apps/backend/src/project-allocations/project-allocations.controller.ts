
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
import { ProjectAllocationsService } from './project-allocations.service.js';

@Controller('project-allocations')
export class ProjectAllocationsController {
  constructor(
    private readonly allocationsService: ProjectAllocationsService,
  ) {}

  @Post()
  create(
    @Body() body: Parameters<ProjectAllocationsService['create']>[0],
  ) {
    return this.allocationsService.create(body);
  }

  @Get()
  findAll(
    @Query('projectId') projectId?: string,
    @Query('inventoryStockId') inventoryStockId?: string,
  ) {
    return this.allocationsService.findAll(
      projectId,
      inventoryStockId,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.allocationsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Parameters<ProjectAllocationsService['update']>[1],
  ) {
    return this.allocationsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.allocationsService.remove(id);
  }
}
