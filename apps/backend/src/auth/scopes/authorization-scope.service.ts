
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service.js';

export type AuthorizationScope = {
  companyId: string;
  projectId?: string;
  siteId?: string;
};

@Injectable()
export class AuthorizationScopeService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async resolveMaterialRequest(
    requestId: string,
  ): Promise<AuthorizationScope> {
    const materialRequest =
      await this.prisma.materialRequest.findUnique({
        where: { id: requestId },
        include: {
          project: true,
          site: true,
        },
      });

    if (!materialRequest) {
      throw new NotFoundException(
        'Material request not found',
      );
    }

    if (
      materialRequest.project.companyId !==
        materialRequest.companyId ||
      materialRequest.site.projectId !==
        materialRequest.projectId
    ) {
      throw new ForbiddenException(
        'Invalid material request scope',
      );
    }

    return {
      companyId: materialRequest.companyId,
      projectId: materialRequest.projectId,
      siteId: materialRequest.siteId,
    };
  }

  async resolveRequestItem(
    requestItemId: string,
  ): Promise<AuthorizationScope> {
    const item =
      await this.prisma.materialRequestItem.findUnique({
        where: { id: requestItemId },
        select: {
          requestId: true,
        },
      });

    if (!item) {
      throw new NotFoundException(
        'Material request item not found',
      );
    }

    return this.resolveMaterialRequest(
      item.requestId,
    );
  }

  async resolveMatchResult(
    matchResultId: string,
  ): Promise<AuthorizationScope> {
    const matchResult =
      await this.prisma.matchResult.findUnique({
        where: { id: matchResultId },
        select: {
          requestItem: {
            select: {
              requestId: true,
            },
          },
        },
      });

    if (!matchResult) {
      throw new NotFoundException(
        'Matching result not found',
      );
    }

    return this.resolveMaterialRequest(
      matchResult.requestItem.requestId,
    );
  }
}
