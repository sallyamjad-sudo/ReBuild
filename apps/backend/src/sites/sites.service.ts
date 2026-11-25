
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

type SiteStatus = 'ACTIVE' | 'INACTIVE';

type CreateSiteDto = {
  projectId?: string;
  name?: string;
  address?: string;
};

type UpdateSiteDto = {
  name?: string;
  address?: string;
  status?: SiteStatus;
};

@Injectable()
export class SitesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateSiteDto) {
    if (!data || typeof data.projectId !== 'string') {
      throw new BadRequestException('projectId is required');
    }

    if (
      typeof data.name !== 'string' ||
      !data.name.trim() ||
      data.name.trim().length > 200
    ) {
      throw new BadRequestException('Valid site name is required');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (
      data.address !== undefined &&
      typeof data.address !== 'string'
    ) {
      throw new BadRequestException('Invalid address');
    }

    return this.prisma.site.create({
      data: {
        projectId: data.projectId,
        name: data.name.trim(),
        address: data.address,
        status: 'ACTIVE',
      },
    });
  }

  async findAll(projectId?: string) {
    return this.prisma.site.findMany({
      where: projectId ? { projectId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const site = await this.prisma.site.findUnique({
      where: { id },
    });

    if (!site) {
      throw new NotFoundException('Site not found');
    }

    return site;
  }

  async update(id: string, data: UpdateSiteDto) {
    await this.findOne(id);

    if (!data || Object.keys(data).length === 0) {
      throw new BadRequestException('No fields provided');
    }

    if (data.name !== undefined) {
      if (
        typeof data.name !== 'string' ||
        !data.name.trim() ||
        data.name.trim().length > 200
      ) {
        throw new BadRequestException('Invalid site name');
      }
    }

    if (
      data.address !== undefined &&
      typeof data.address !== 'string'
    ) {
      throw new BadRequestException('Invalid address');
    }

    if (
      data.status !== undefined &&
      !['ACTIVE', 'INACTIVE'].includes(data.status)
    ) {
      throw new BadRequestException('Invalid site status');
    }

    const updateData = {
      name: data.name?.trim(),
      address: data.address,
      status: data.status,
    };

    if (Object.values(updateData).every((value) => value === undefined)) {
      throw new BadRequestException('No valid fields provided');
    }

    return this.prisma.site.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    try {
      return await this.prisma.site.delete({
        where: { id },
      });
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          'Cannot delete a site with related records',
        );
      }

      throw error;
    }
  }
}
