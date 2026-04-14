import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampaignPageDto } from './dto/create-campaign-page.dto';
import { UpdateCampaignPageDto } from './dto/update-campaign-page.dto';

@Injectable()
export class CampaignPagesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.campaignPage.findMany({
      include: {
        organization: true,
        campaign: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.campaignPage.findUnique({
      where: { id },
      include: {
        organization: true,
        campaign: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Campaign page not found');
    }

    return item;
  }

  async create(dto: CreateCampaignPageDto) {
    if (!dto.organizationId) {
      throw new NotFoundException('organizationId is required');
    }

    if (!dto.campaignId) {
      throw new NotFoundException('campaignId is required');
    }

    if (!dto.slug?.trim()) {
      throw new NotFoundException('slug is required');
    }

    if (!dto.title?.trim()) {
      throw new NotFoundException('title is required');
    }

    const jsonConfig =
      dto.jsonConfig === undefined
        ? undefined
        : (dto.jsonConfig as Prisma.InputJsonValue);

    return this.prisma.campaignPage.create({
      data: {
        organization: {
          connect: { id: dto.organizationId },
        },
        campaign: {
          connect: { id: dto.campaignId },
        },
        slug: dto.slug.trim(),
        title: dto.title.trim(),
        templateType: dto.templateType ?? 'landing',
        status: dto.status ?? 'draft',
        pageMode: dto.pageMode ?? 'hosted',
        externalUrl: dto.externalUrl,
        customDomain: dto.customDomain,
        jsonConfig,
      },
      include: {
        organization: true,
        campaign: true,
      },
    });
  }

  async update(id: string, dto: UpdateCampaignPageDto) {
    await this.findOne(id);

    const jsonConfig =
      dto.jsonConfig === undefined
        ? undefined
        : (dto.jsonConfig as Prisma.InputJsonValue);

    return this.prisma.campaignPage.update({
      where: { id },
      data: {
        slug: dto.slug?.trim(),
        title: dto.title?.trim(),
        templateType: dto.templateType,
        status: dto.status,
        pageMode: dto.pageMode,
        externalUrl: dto.externalUrl,
        customDomain: dto.customDomain,
        jsonConfig,
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
    await this.findOne(id);

    return this.prisma.campaignPage.delete({
      where: { id },
    });
  }

  async findBySlug(slug: string) {
    const item = await this.prisma.campaignPage.findUnique({
      where: { slug },
      include: {
        organization: true,
        campaign: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Campaign page not found');
    }

    return item;
  }

  async findPublishedBySlug(slug: string) {
    const item = await this.prisma.campaignPage.findFirst({
      where: {
        slug,
        status: 'published',
      },
      include: {
        organization: true,
        campaign: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Published campaign page not found');
    }

    return item;
  }

  async publish(id: string) {
    await this.findOne(id);

    return this.prisma.campaignPage.update({
      where: { id },
      data: {
        status: 'published',
        publishedAt: new Date(),
      },
      include: {
        organization: true,
        campaign: true,
      },
    });
  }

  async unpublish(id: string) {
    await this.findOne(id);

    return this.prisma.campaignPage.update({
      where: { id },
      data: {
        status: 'draft',
        publishedAt: null,
      },
      include: {
        organization: true,
        campaign: true,
      },
    });
  }

  async archive(id: string) {
    await this.findOne(id);

    return this.prisma.campaignPage.update({
      where: { id },
      data: {
        status: 'archived',
      },
      include: {
        organization: true,
        campaign: true,
      },
    });
  }
}