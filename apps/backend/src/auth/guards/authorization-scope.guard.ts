
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

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const resource = this.reflector.getAllAndOverride<ScopeResource>(
      SCOPE_RESOURCE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!resource) {
      return true;
    }

    const request = context.switchToHttp().getRequest<ScopedRequest>();


const rawId = request.params['id'];

const resourceId =
  typeof rawId === 'string' ? rawId : undefined;


    if (!resourceId) {
      throw new BadRequestException('Resource ID is required');
    }

    if (resource === 'material-request') {
      request.authorizationScope =
        await this.scopeService.resolveMaterialRequest(resourceId);
    } else if (resource === 'match-result') {
      request.authorizationScope =
        await this.scopeService.resolveMatchResult(resourceId);
    }

    return true;
  }
}
