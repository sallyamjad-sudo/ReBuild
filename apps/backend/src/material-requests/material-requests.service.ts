
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';

type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

type MaterialItemDto = {
  materialId?: string;
  requestedQuantity?: string | number;
  unit?: string;
  singleBatchOnly?: boolean;
  notes?: string | null;
};

type CreateRequestDto = {
  companyId?: string;
  projectId?: string;
  siteId?: string;
  requestedById?: string;
  priority?: Priority;
  requiredByDate?: string | null;
  notes?: string | null;
  items?: MaterialItemDto[];
};

type UpdateRequestDto = {
  priority?: Priority;
  requiredByDate?: string | null;
  notes?: string | null;
};

type UpdateItemDto = {
  requestedQuantity?: string | number;
  unit?: string;
  singleBatchOnly?: boolean;
  notes?: string | null;
};

@Injectable()
export class MaterialRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  private validateId(value: unknown, field: string): string {
    if (
      typeof value !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value,
      )
    ) {
      throw new BadRequestException(
        `${field} must be a valid UUID`,
      );
    }

    return value;
  }

  private parseQuantity(value: unknown): Prisma.Decimal {
    const text = String(value ?? '');

    if (!/^\d{1,15}(\.\d{1,3})?$/.test(text)) {
      throw new BadRequestException(
        'Quantity must have up to 15 integer digits and 3 decimal places',
      );
    }

    const quantity = new Prisma.Decimal(text);

    if (quantity.lte(0)) {
      throw new BadRequestException(
        'Quantity must be greater than zero',
      );
    }

    return quantity;
  }

  private parsePriority(value: unknown): Priority {
    const allowed: Priority[] = [
      'LOW',
      'NORMAL',
      'HIGH',
      'URGENT',
    ];

    if (!allowed.includes(value as Priority)) {
      throw new BadRequestException(
        'Invalid request priority',
      );
    }

    return value as Priority;
  }

  private parseDate(value: unknown): Date | null {
    if (value === null) return null;

    if (
      typeof value !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
      throw new BadRequestException(
        'requiredByDate must use YYYY-MM-DD',
      );
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value
    ) {
      throw new BadRequestException(
        'Invalid requiredByDate',
      );
    }

    return date;
  }

  private parseNotes(value: unknown): string | null {
    if (value === null) return null;

    if (typeof value !== 'string') {
      throw new BadRequestException(
        'notes must be a string',
      );
    }

    return value;
  }

  private async transaction<T>(
    work: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await this.prisma.$transaction(work, {
          isolationLevel:
            Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error: unknown) {
        if (
          error !== null &&
          typeof error === 'object' &&
          'code' in error &&
          error.code === 'P2034'
        ) {
          if (attempt < 2) continue;

          throw new ConflictException(
            'Concurrent request update. Please retry',
          );
        }

        throw error;
      }
    }

    throw new ConflictException(
      'Could not process material request',
    );
  }

  private async requireDraft(
    tx: Prisma.TransactionClient,
    requestId: string,
  ) {
    const request = await tx.materialRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException(
        'Material request not found',
      );
    }

    if (request.status !== 'DRAFT') {
      throw new ConflictException(
        'Only DRAFT material requests can be modified',
      );
    }

    return request;
  }

  private async prepareItem(
    tx: Prisma.TransactionClient,
    input: MaterialItemDto,
  ) {
    if (!input || typeof input !== 'object') {
      throw new BadRequestException(
        'Invalid material request item',
      );
    }

    const materialId = this.validateId(
      input.materialId,
      'materialId',
    );

    const requestedQuantity = this.parseQuantity(
      input.requestedQuantity,
    );

    const material = await tx.material.findUnique({
      where: { id: materialId },
    });

    if (!material) {
      throw new NotFoundException(
        'Material not found',
      );
    }

    if (!material.isActive) {
      throw new BadRequestException(
        'Material is inactive',
      );
    }

    const unit = input.unit ?? material.baseUnit;

    if (
      typeof unit !== 'string' ||
      unit !== material.baseUnit
    ) {
      throw new BadRequestException(
        `Material unit must be ${material.baseUnit}`,
      );
    }

    if (
      input.singleBatchOnly !== undefined &&
      typeof input.singleBatchOnly !== 'boolean'
    ) {
      throw new BadRequestException(
        'singleBatchOnly must be a boolean',
      );
    }

    return {
      materialId,
      requestedQuantity,
      unit,
      singleBatchOnly: input.singleBatchOnly ?? false,
      notes:
        input.notes === undefined
          ? null
          : this.parseNotes(input.notes),
    };
  }

  private async requireCreatePermission(
    tx: Prisma.TransactionClient,
    userId: string,
    companyId: string,
    projectId: string,
    siteId: string,
  ): Promise<void> {
    const membership = await tx.companyMember.findUnique({
      where: {
        companyId_userId: {
          companyId,
          userId,
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

    for (const assignment of membership.roleAssignments) {
      if (
        assignment.expiresAt &&
        assignment.expiresAt <= now
      ) {
        continue;
      }

      if (
        !assignment.role.isActive ||
        assignment.role.companyId !== companyId
      ) {
        continue;
      }

      const scopeMatches =
        assignment.scopeType === 'COMPANY' ||
        (
          assignment.scopeType === 'PROJECT' &&
          assignment.projectId === projectId
        ) ||
        (
          assignment.scopeType === 'SITE' &&
          assignment.siteId === siteId
        );

      if (!scopeMatches) {
        continue;
      }

      const hasPermission =
        assignment.role.rolePermissions.some(
          (rolePermission) =>
            rolePermission.permission.isActive &&
            rolePermission.permission.code ===
              'material_requests.create',
        );

      if (hasPermission) {
        return;
      }
    }

    throw new ForbiddenException(
      'Insufficient permissions',
    );
  }

  async create(
    body: CreateRequestDto,
    authenticatedUserId?: string,
  ) {
    if (!authenticatedUserId) {
      throw new UnauthorizedException(
        'Authentication required',
      );
    }

    const requestedById = this.validateId(
      authenticatedUserId,
      'authenticatedUserId',
    );

    if (!body || typeof body !== 'object') {
      throw new BadRequestException(
        'Request body is required',
      );
    }

    if (
      body.requestedById !== undefined &&
      body.requestedById !== requestedById
    ) {
      throw new ForbiddenException(
        'Cannot create a request for another user',
      );
    }

    const companyId = this.validateId(
      body.companyId,
      'companyId',
    );

    const projectId = this.validateId(
      body.projectId,
      'projectId',
    );

    const siteId = this.validateId(
      body.siteId,
      'siteId',
    );

    const priority = this.parsePriority(
      body.priority ?? 'NORMAL',
    );

    const requiredByDate =
      body.requiredByDate === undefined
        ? null
        : this.parseDate(body.requiredByDate);

    const notes =
      body.notes === undefined
        ? null
        : this.parseNotes(body.notes);

    if (
      body.items !== undefined &&
      !Array.isArray(body.items)
    ) {
      throw new BadRequestException(
        'items must be an array',
      );
    }

    if ((body.items?.length ?? 0) > 100) {
      throw new BadRequestException(
        'A request can contain at most 100 items',
      );
    }

    return this.transaction(async (tx) => {
      const [company, project, site, user] =
        await Promise.all([
          tx.company.findUnique({
            where: { id: companyId },
          }),
          tx.project.findUnique({
            where: { id: projectId },
          }),
          tx.site.findUnique({
            where: { id: siteId },
          }),
          tx.user.findUnique({
            where: { id: requestedById },
          }),
        ]);

      if (!company) {
        throw new NotFoundException(
          'Company not found',
        );
      }

      if (
        !project ||
        project.companyId !== companyId
      ) {
        throw new BadRequestException(
          'Project does not belong to this company',
        );
      }

      if (
        !site ||
        site.projectId !== projectId
      ) {
        throw new BadRequestException(
          'Site does not belong to this project',
        );
      }

      if (
        !user ||
        user.status !== 'ACTIVE'
      ) {
        throw new BadRequestException(
          'Requester must be an active user',
        );
      }

      await this.requireCreatePermission(
        tx,
        requestedById,
        companyId,
        projectId,
        siteId,
      );

      const preparedItems = [];

      for (const item of body.items ?? []) {
        preparedItems.push(
          await this.prepareItem(tx, item),
        );
      }

      return tx.materialRequest.create({
        data: {
          companyId,
          projectId,
          siteId,
          requestedById,
          status: 'DRAFT',
          priority,
          requiredByDate,
          notes,
          materialRequestItems: {
            create: preparedItems,
          },
        },
        include: {
          materialRequestItems: {
            include: {
              material: true,
            },
          },
        },
      });
    });
  }


async findAll(
  companyId?: string,
  projectId?: string,
  status?: string,
  authenticatedUserId?: string,
) {
  if (!authenticatedUserId) {
    throw new UnauthorizedException(
      'Authentication required',
    );
  }

  const userId = this.validateId(
    authenticatedUserId,
    'authenticatedUserId',
  );

  const allowed = [
    'DRAFT',
    'SUBMITTED',
    'PARTIALLY_FULFILLED',
    'FULFILLED',
    'CANCELLED',
  ] as const;

  if (status && !allowed.some((value) => value === status)) {
    throw new BadRequestException(
      'Invalid request status',
    );
  }

  const validCompanyId = companyId
    ? this.validateId(companyId, 'companyId')
    : undefined;

  const validProjectId = projectId
    ? this.validateId(projectId, 'projectId')
    : undefined;

  const memberships = await this.prisma.companyMember.findMany({
    where: {
      userId,
      status: 'ACTIVE',
      company: {
        status: 'ACTIVE',
      },
    },
    include: {
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

  const now = new Date();

  const accessibleScopes: Prisma.MaterialRequestWhereInput[] = [];

  for (const membership of memberships) {
    if (
      validCompanyId &&
      membership.companyId !== validCompanyId
    ) {
      continue;
    }

    for (const assignment of membership.roleAssignments) {
      if (
        assignment.expiresAt &&
        assignment.expiresAt <= now
      ) {
        continue;
      }

      if (
        !assignment.role.isActive ||
        assignment.role.companyId !== membership.companyId
      ) {
        continue;
      }

      const canRead = assignment.role.rolePermissions.some(
        (rolePermission) =>
          rolePermission.permission.isActive &&
          rolePermission.permission.code ===
            'material_requests.read',
      );

      if (!canRead) {
        continue;
      }

      if (assignment.scopeType === 'COMPANY') {
        accessibleScopes.push({
          companyId: membership.companyId,
        });
      } else if (
        assignment.scopeType === 'PROJECT' &&
        assignment.projectId
      ) {
        accessibleScopes.push({
          companyId: membership.companyId,
          projectId: assignment.projectId,
        });
      } else if (
        assignment.scopeType === 'SITE' &&
        assignment.siteId
      ) {
        accessibleScopes.push({
          companyId: membership.companyId,
          siteId: assignment.siteId,
        });
      }
    }
  }

  if (accessibleScopes.length === 0) {
    return [];
  }

  return this.prisma.materialRequest.findMany({
    where: {
      AND: [
        {
          OR: accessibleScopes,
        },
        ...(validCompanyId
          ? [{ companyId: validCompanyId }]
          : []),
        ...(validProjectId
          ? [{ projectId: validProjectId }]
          : []),
        ...(status
          ? [{ status: status as (typeof allowed)[number] }]
          : []),
      ],
    },
    include: {
      project: true,
      site: true,
      materialRequestItems: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

  async findOne(id: string) {
    const request =
      await this.prisma.materialRequest.findUnique({
        where: {
          id: this.validateId(id, 'id'),
        },
        include: {
          company: true,
          project: true,
          site: true,
          materialRequestItems: {
            include: {
              material: true,
              reservations: true,
            },
          },
        },
      });

    if (!request) {
      throw new NotFoundException(
        'Material request not found',
      );
    }

    return request;
  }

  async update(
    id: string,
    body: UpdateRequestDto,
  ) {
    const requestId = this.validateId(
      id,
      'id',
    );

    if (!body || typeof body !== 'object') {
      throw new BadRequestException(
        'Request body is required',
      );
    }

    const data: {
      priority?: Priority;
      requiredByDate?: Date | null;
      notes?: string | null;
    } = {};

    if (body.priority !== undefined) {
      data.priority = this.parsePriority(
        body.priority,
      );
    }

    if (body.requiredByDate !== undefined) {
      data.requiredByDate = this.parseDate(
        body.requiredByDate,
      );
    }

    if (body.notes !== undefined) {
      data.notes = this.parseNotes(
        body.notes,
      );
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException(
        'No fields to update',
      );
    }

    return this.transaction(async (tx) => {
      await this.requireDraft(
        tx,
        requestId,
      );

      return tx.materialRequest.update({
        where: {
          id: requestId,
        },
        data,
        include: {
          materialRequestItems: true,
        },
      });
    });
  }

  async addItem(
    id: string,
    body: MaterialItemDto,
  ) {
    const requestId = this.validateId(
      id,
      'id',
    );

    return this.transaction(async (tx) => {
      await this.requireDraft(
        tx,
        requestId,
      );

      const count =
        await tx.materialRequestItem.count({
          where: {
            requestId,
          },
        });

      if (count >= 100) {
        throw new ConflictException(
          'Maximum number of request items reached',
        );
      }

      const data = await this.prepareItem(
        tx,
        body,
      );

      return tx.materialRequestItem.create({
        data: {
          requestId,
          ...data,
        },
        include: {
          material: true,
        },
      });
    });
  }

  async updateItem(
    id: string,
    itemId: string,
    body: UpdateItemDto,
  ) {
    const requestId = this.validateId(
      id,
      'id',
    );

    const validItemId = this.validateId(
      itemId,
      'itemId',
    );

    if (!body || typeof body !== 'object') {
      throw new BadRequestException(
        'Request body is required',
      );
    }

    return this.transaction(async (tx) => {
      await this.requireDraft(
        tx,
        requestId,
      );

      const item =
        await tx.materialRequestItem.findFirst({
          where: {
            id: validItemId,
            requestId,
          },
          include: {
            material: true,
          },
        });

      if (!item) {
        throw new NotFoundException(
          'Material request item not found',
        );
      }

      const data: {
        requestedQuantity?: Prisma.Decimal;
        unit?: string;
        singleBatchOnly?: boolean;
        notes?: string | null;
      } = {};

      if (
        body.requestedQuantity !== undefined
      ) {
        data.requestedQuantity =
          this.parseQuantity(
            body.requestedQuantity,
          );
      }

      if (body.unit !== undefined) {
        if (
          body.unit !== item.material.baseUnit
        ) {
          throw new BadRequestException(
            `Material unit must be ${item.material.baseUnit}`,
          );
        }

        data.unit = body.unit;
      }

      if (
        body.singleBatchOnly !== undefined
      ) {
        if (
          typeof body.singleBatchOnly !==
          'boolean'
        ) {
          throw new BadRequestException(
            'singleBatchOnly must be a boolean',
          );
        }

        data.singleBatchOnly =
          body.singleBatchOnly;
      }

      if (body.notes !== undefined) {
        data.notes = this.parseNotes(
          body.notes,
        );
      }

      if (
        Object.keys(data).length === 0
      ) {
        throw new BadRequestException(
          'No fields to update',
        );
      }

      return tx.materialRequestItem.update({
        where: {
          id: validItemId,
        },
        data,
      });
    });
  }

  async removeItem(
    id: string,
    itemId: string,
  ) {
    const requestId = this.validateId(
      id,
      'id',
    );

    const validItemId = this.validateId(
      itemId,
      'itemId',
    );

    return this.transaction(async (tx) => {
      await this.requireDraft(
        tx,
        requestId,
      );

      const item =
        await tx.materialRequestItem.findFirst({
          where: {
            id: validItemId,
            requestId,
          },
        });

      if (!item) {
        throw new NotFoundException(
          'Material request item not found',
        );
      }

      const reservationCount =
        await tx.reservation.count({
          where: {
            requestItemId: validItemId,
          },
        });

      if (reservationCount > 0) {
        throw new ConflictException(
          'Cannot delete an item with reservation history',
        );
      }

      return tx.materialRequestItem.delete({
        where: {
          id: validItemId,
        },
      });
    });
  }

  async submit(id: string) {
    const requestId = this.validateId(
      id,
      'id',
    );

    return this.transaction(async (tx) => {
      await this.requireDraft(
        tx,
        requestId,
      );

      const count =
        await tx.materialRequestItem.count({
          where: {
            requestId,
          },
        });

      if (count === 0) {
        throw new ConflictException(
          'Cannot submit a request without materials',
        );
      }

      return tx.materialRequest.update({
        where: {
          id: requestId,
        },
        data: {
          status: 'SUBMITTED',
        },
        include: {
          materialRequestItems: true,
        },
      });
    });
  }
}
