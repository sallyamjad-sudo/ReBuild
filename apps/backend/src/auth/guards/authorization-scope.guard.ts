
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { AuthorizationScopeService } from '../scopes/authorization-scope.service.js';

export const SCOPE_RESOURCE_KEY = 'scope_resource';

export type ScopeResource =
  | 'material-request'
  | 'request-item'
  | 'match-result';

export const ScopeResourceType = (resource: ScopeResource) =>
  SetMetadata(SCOPE_RESOURCE_KEY, resource);

type ScopedRequest = Request & {
  authorizationScope?: {
    companyId: string;
    projectId?: string;
    siteId?: string;
  };
};

@Injectable()
export class AuthorizationScopeGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly scopeService: AuthorizationScopeService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const resource =
      this.reflector.getAllAndOverride<ScopeResource>(
        SCOPE_RESOURCE_KEY,
        [context.getHandler(), context.getClass()],
      );

    if (!resource) {
      return true;
    }

    const request =
      context.switchToHttp().getRequest<ScopedRequest>();

    const paramName =
      resource === 'request-item'
        ? 'requestItemId'
        : 'id';

    const rawId = request.params[paramName];

    if (typeof rawId !== 'string' || !rawId) {
      throw new BadRequestException(
        'Resource ID is required',
      );
    }

    if (resource === 'material-request') {
      request.authorizationScope =
        await this.scopeService.resolveMaterialRequest(
          rawId,
        );
    } else if (resource === 'request-item') {
      request.authorizationScope =
        await this.scopeService.resolveRequestItem(
          rawId,
        );
    } else {
      request.authorizationScope =
        await this.scopeService.resolveMatchResult(
          rawId,
        );
    }

    return true;
  }
}
