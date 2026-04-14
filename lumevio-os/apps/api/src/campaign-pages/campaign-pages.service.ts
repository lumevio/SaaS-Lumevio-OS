import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { getAccessibleOrganizationIds } from "../auth/authz.util";

@Injectable()
export class CampaignPagesService {
  constructor(private readonly prisma: PrismaService) {}

  private slugify(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  private async ensureUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug || `page-${Date.now()}`;
    let counter = 1;

    while (true) {
      const exists = await this.prisma.campaignPage.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (!exists) {
        return slug;
      }

      counter += 1;
      slug = `${baseSlug}-${counter}`;
    }
  }

  private buildPublicUrl(page: {
    slug: string;
    pageMode?: string | null;
  }) {
    if (page.pageMode === "external_redirect") {
      return `http://localhost:3001/api/public/page/${page.slug}`;
    }

    return `http://localhost:3002/${page.slug}`;
  }

  async findAll(user?: any) {
    const orgIds = getAccessibleOrganizationIds(user);

    return this.prisma.campaignPage.findMany({
      where: user?.isPlatformAdmin
        ? undefined
        : {
            organizationId: {
              in: orgIds.length ? orgIds : ["__none__"],
            },
          },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        templateType: true,
        status: true,
        pageMode: true,
        externalUrl: true,
        customDomain: true,
        publishedAt: true,
        createdAt: true,
        campaign: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  async findBySlug(slug: string) {
    const page = await this.prisma.campaignPage.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        title: true,
        templateType: true,
        status: true,
        pageMode: true,
        externalUrl: true,
        customDomain: true,
        jsonConfig: true,
        publishedAt: true,
        campaign: {
          select: {
            id: true,
            name: true,
            slug: true,
            organizationId: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!page) {
      throw new NotFoundException("Strona kampanii nie została znaleziona");
    }

    return page;
  }

  async create(dto: {
    organizationId: string;
    campaignId: string;
    title: string;
    slug?: string;
    templateType?: string;
    pageMode?: string;
    externalUrl?: string;
    customDomain?: string;
    jsonConfig?: Record<string, unknown>;
  }) {
    if (!dto.organizationId || !dto.campaignId || !dto.title?.trim()) {
      throw new BadRequestException(
        "Brakuje organizationId, campaignId albo title"
      );
    }

    const pageMode = dto.pageMode?.trim() || "hosted";

    if (
      pageMode !== "hosted" &&
      pageMode !== "external_redirect"
    ) {
      throw new BadRequestException("Nieprawidłowy pageMode");
    }

    if (pageMode === "external_redirect" && !dto.externalUrl?.trim()) {
      throw new BadRequestException(
        "Dla trybu external_redirect wymagany jest externalUrl"
      );
    }

    const campaign = await this.prisma.campaign.findUnique({
      where: { id: dto.campaignId },
      select: {
        id: true,
        organizationId: true,
        name: true,
      },
    });

    if (!campaign) {
      throw new BadRequestException("Kampania nie istnieje");
    }

    if (campaign.organizationId !== dto.organizationId) {
      throw new BadRequestException(
        "Kampania nie należy do tej organizacji"
      );
    }

    const baseSlug = dto.slug?.trim()
      ? this.slugify(dto.slug)
      : this.slugify(`${campaign.name}-${dto.title}`);

    const slug = await this.ensureUniqueSlug(baseSlug);
    const jsonConfig = (dto.jsonConfig ?? {}) as Prisma.InputJsonValue;

    const page = await this.prisma.campaignPage.create({
      data: {
        organizationId: dto.organizationId,
        campaignId: dto.campaignId,
        slug,
        title: dto.title.trim(),
        templateType: dto.templateType?.trim() || "landing",
        status: "draft",
        pageMode,
        externalUrl:
          pageMode === "external_redirect"
            ? dto.externalUrl?.trim() || null
            : null,
        customDomain: dto.customDomain?.trim() || null,
        jsonConfig,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        templateType: true,
        status: true,
        pageMode: true,
        externalUrl: true,
        customDomain: true,
        publishedAt: true,
        createdAt: true,
        campaign: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return {
      success: true,
      page,
      publicUrl: this.buildPublicUrl(page),
    };
  }

  async publish(id: string) {
    const page = await this.prisma.campaignPage.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        pageMode: true,
      },
    });

    if (!page) {
      throw new NotFoundException("Strona kampanii nie została znaleziona");
    }

    const updated = await this.prisma.campaignPage.update({
      where: { id },
      data: {
        status: "published",
        publishedAt: new Date(),
      },
      select: {
        id: true,
        slug: true,
        title: true,
        templateType: true,
        status: true,
        pageMode: true,
        externalUrl: true,
        customDomain: true,
        publishedAt: true,
        createdAt: true,
        campaign: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return {
      success: true,
      page: updated,
      publicUrl: this.buildPublicUrl(updated),
    };
  }
}