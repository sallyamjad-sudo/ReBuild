
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
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { MaterialRequestsService } from './material-requests.service.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

import {
  AuthorizationScopeGuard,
  ScopeResourceType,
} from '../auth/guards/authorization-scope.guard.js';

import { PermissionsGuard } from '../auth/guards/permissions.guard.js';

import { RequirePermissions } from '../auth/permissions/require-permissions.decorator.js';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
    email: string;
  };
};

@UseGuards(JwtAuthGuard)
@Controller('material-requests')
export class MaterialRequestsController {
  constructor(
    private readonly requestsService: MaterialRequestsService,
  ) {}

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() body: Parameters<MaterialRequestsService['create']>[0],
  ) {
    return this.requestsService.create(
      body,
      request.user.id,
    );
  }


@Get()
findAll(
  @Req() request: AuthenticatedRequest,
  @Query('companyId') companyId?: string,
  @Query('projectId') projectId?: string,
  @Query('status') status?: string,
) {
  return this.requestsService.findAll(
    companyId,
    projectId,
    status,
    request.user.id,
  );
}


  @Get(':id')
  @UseGuards(AuthorizationScopeGuard, PermissionsGuard)
  @ScopeResourceType('material-request')
  @RequirePermissions('material_requests.read')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.requestsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthorizationScopeGuard, PermissionsGuard)
  @ScopeResourceType('material-request')
  @RequirePermissions('material_requests.update')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Parameters<MaterialRequestsService['update']>[1],
  ) {
    return this.requestsService.update(id, body);
  }

  @Post(':id/items')
  @UseGuards(AuthorizationScopeGuard, PermissionsGuard)
  @ScopeResourceType('material-request')
  @RequirePermissions('material_requests.update')
  addItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Parameters<MaterialRequestsService['addItem']>[1],
  ) {
    return this.requestsService.addItem(id, body);
  }

  @Patch(':id/items/:itemId')
  @UseGuards(AuthorizationScopeGuard, PermissionsGuard)
  @ScopeResourceType('material-request')
  @RequirePermissions('material_requests.update')
  updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() body: Parameters<MaterialRequestsService['updateItem']>[2],
  ) {
    return this.requestsService.updateItem(
      id,
      itemId,
      body,
    );
  }

  @Delete(':id/items/:itemId')
  @UseGuards(AuthorizationScopeGuard, PermissionsGuard)
  @ScopeResourceType('material-request')
  @RequirePermissions('material_requests.update')
  removeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.requestsService.removeItem(
      id,
      itemId,
    );
  }

  @Post(':id/submit')
  @UseGuards(AuthorizationScopeGuard, PermissionsGuard)
  @ScopeResourceType('material-request')
  @RequirePermissions('material_requests.submit')
  submit(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.requestsService.submit(id);
  }
}
