
import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { MaterialMatchingService } from './material-matching.service.js';
import { MatchConfirmationService } from './match-confirmation.service.js';

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

@Controller('material-matching')
@UseGuards(AuthorizationScopeGuard, PermissionsGuard)
export class MaterialMatchingController {
  constructor(
    private readonly matchingService: MaterialMatchingService,
    private readonly confirmationService: MatchConfirmationService,
  ) {}

  @Post('request-items/:requestItemId/run')
  @ScopeResourceType('request-item')
  @RequirePermissions('material_matching.run')
  runMatching(
    @Param('requestItemId', ParseUUIDPipe)
    requestItemId: string,
  ) {
    return this.matchingService.runMatching(
      requestItemId,
    );
  }

  @Post('results/:id/confirm')
  @ScopeResourceType('match-result')
  @RequirePermissions('material_matching.confirm')
  confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.confirmationService.confirm(id, {
      confirmedById: request.user.id,
    });
  }

  @Get('request-items/:requestItemId/results')
  @ScopeResourceType('request-item')
  @RequirePermissions('material_matching.read')
  findAll(
    @Param('requestItemId', ParseUUIDPipe)
    requestItemId: string,
  ) {
    return this.matchingService.findAll(
      requestItemId,
    );
  }

  @Get('results/:id')
  @ScopeResourceType('match-result')
  @RequirePermissions('material_matching.read')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.matchingService.findOne(id);
  }
}
