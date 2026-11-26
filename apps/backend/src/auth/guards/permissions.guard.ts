
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { PrismaService } from '../../prisma/prisma.service.js';
import { PERMISSIONS_KEY } from '../permissions/require-permissions.decorator.js';

type AuthorizationScope = {
  companyId: string;
  projectId?: string;
  siteId?: string;
};

type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    email: string;
  };
  authorizationScope?: AuthorizationScope;
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(
        PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      );

    if (!requiredPermissions?.length) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();

    if (!request.user?.id) {
      throw new UnauthorizedException(
        'Authentication required',
      );
    }

    // Must be populated by a trusted scope resolver.
    const scope = request.authorizationScope;

    if (!scope?.companyId) {
      throw new ForbiddenException(
        'Verified authorization scope required',
      );
    }

    const membership =
      await this.prisma.companyMember.findUnique({
        where: {
          companyId_userId: {
            companyId: scope.companyId,
            userId: request.user.id,
          },
        },
        include: {
          company: true,
          roleAssignments: {
            where: {
              isActive: true,
            },
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    if (
      !membership ||
      membership.status !== 'ACTIVE' ||
      membership.company.status !== 'ACTIVE'
    ) {
      throw new ForbiddenException(
        'No active company membership',
      );
    }

    const now = new Date();
    const grantedPermissions = new Set<string>();

    for (const assignment of membership.roleAssignments) {
      if (
        assignment.expiresAt &&
        assignment.expiresAt <= now
      ) {
        continue;
      }

      if (
        !assignment.role.isActive ||
        assignment.role.companyId !== scope.companyId
      ) {
        continue;
      }

      let scopeMatches = false;

      if (assignment.scopeType === 'COMPANY') {
        scopeMatches = true;
      } else if (
        assignment.scopeType === 'PROJECT' &&
        scope.projectId &&
        assignment.projectId === scope.projectId
      ) {
        scopeMatches = true;
      } else if (
        assignment.scopeType === 'SITE' &&
        scope.siteId &&
        assignment.siteId === scope.siteId
      ) {
        scopeMatches = true;
      }

      if (!scopeMatches) {
        continue;
      }

      for (const rolePermission of assignment.role.rolePermissions) {
        if (rolePermission.permission.isActive) {
          grantedPermissions.add(
            rolePermission.permission.code,
          );
        }
      }
    }

    const hasAllPermissions = requiredPermissions.every(
      (permission) => grantedPermissions.has(permission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        'Insufficient permissions',
      );
    }

    return true;
  }
}
