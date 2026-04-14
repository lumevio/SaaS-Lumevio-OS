import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RedirectLinksService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
  return this.prisma.redirectLink.findUnique({
    where: { id },
  });
}

  async findAll() {
    return this.prisma.redirectLink.findMany({
      include: {
        organization: true,
        campaign: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async create(dto: any) {
    const created = await this.prisma.redirectLink.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        destinationUrl: dto.destinationUrl,
        fallbackUrl: dto.fallbackUrl,
        isActive: dto.isActive ?? true,
        organization: dto.organizationId
          ? {
              connect: { id: dto.organizationId },
            }
          : undefined,
        campaign: dto.campaignId
          ? {
              connect: { id: dto.campaignId },
            }
          : undefined,
      },
      include: {
        organization: true,
        campaign: true,
      },
    });

    return {
      success: true,
      publicUrl: `http://localhost:3001/r/${created.slug}`,
      link: created,
    };
  }

  async update(id: string, dto: any) {
    const existing = await this.prisma.redirectLink.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Redirect link not found');
    }

    return this.prisma.redirectLink.update({
      where: { id },
      data: {
        title: dto.title,
        slug: dto.slug,
        destinationUrl: dto.destinationUrl,
        fallbackUrl: dto.fallbackUrl,
        isActive: dto.isActive,
        organization: dto.organizationId
          ? {
              connect: { id: dto.organizationId },
            }
          : undefined,
        campaign: dto.campaignId
          ? {
              connect: { id: dto.campaignId },
            }
          : undefined,
      },
      include: {
        organization: true,
        campaign: true,
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.redirectLink.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Redirect link not found');
    }

    return this.prisma.redirectLink.delete({
      where: { id },
    });
  }

  async resolveBySlug(slug: string) {
    const link = await this.prisma.redirectLink.findUnique({
      where: { slug },
      include: {
        organization: true,
        campaign: true,
      },
    });

    if (!link) {
      throw new NotFoundException('Redirect link not found');
    }

    if (!link.isActive) {
      throw new NotFoundException('Redirect link is inactive');
    }

    return link;
  }
}