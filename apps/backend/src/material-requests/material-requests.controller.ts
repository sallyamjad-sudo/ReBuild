
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
import { MaterialRequestsService } from './material-requests.service.js';

@Controller('material-requests')
export class MaterialRequestsController {
  constructor(
    private readonly requestsService: MaterialRequestsService,
  ) {}

  @Post()
  create(
    @Body() body: Parameters<MaterialRequestsService['create']>[0],
  ) {
    return this.requestsService.create(body);
  }

  @Get()
  findAll(
    @Query('companyId') companyId?: string,
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
  ) {
    return this.requestsService.findAll(
      companyId,
      projectId,
      status,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.requestsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Parameters<MaterialRequestsService['update']>[1],
  ) {
    return this.requestsService.update(id, body);
  }

  @Post(':id/items')
  addItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Parameters<MaterialRequestsService['addItem']>[1],
  ) {
    return this.requestsService.addItem(id, body);
  }

  @Patch(':id/items/:itemId')
  updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() body: Parameters<MaterialRequestsService['updateItem']>[2],
  ) {
    return this.requestsService.updateItem(id, itemId, body);
  }

  @Delete(':id/items/:itemId')
  removeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.requestsService.removeItem(id, itemId);
  }

  @Post(':id/submit')
  submit(@Param('id', ParseUUIDPipe) id: string) {
    return this.requestsService.submit(id);
  }
}
