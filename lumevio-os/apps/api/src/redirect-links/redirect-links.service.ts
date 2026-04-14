import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { getAccessibleOrganizationIds } from "../auth/authz.util";

@Injectable()
export class RedirectLinksService {
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
    let slug = baseSlug || `link-${Date.now()}`;
    let counter = 1;

    while (true) {
      const exists = await this.prisma.redirectLink.findUnique({
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

  async findAll(user?: any) {
    const orgIds = getAccessibleOrganizationIds(user);

    return this.prisma.redirectLink.findMany({
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
        destinationUrl: true,
        fallbackUrl: true,
        title: true,
        isActive: true,
        validFrom: true,
        validTo: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  async create(dto: {
    organizationId: string;
    campaignId?: string;
    title?: string;
    slug?: string;
    destinationUrl: string;
    fallbackUrl?: string;
  }) {
    if (!dto.organizationId || !dto.destinationUrl?.trim()) {
      throw new BadRequestException(
        "Brakuje organizationId albo destinationUrl"
      );
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id: dto.organizationId },
      select: { id: true, name: true },
    });

    if (!organization) {
      throw new BadRequestException("Organizacja nie istnieje");
    }

    let campaign = null;
    if (dto.campaignId) {
      campaign = await this.prisma.campaign.findUnique({
        where: { id: dto.campaignId },
        select: { id: true, organizationId: true, name: true },
      });

      if (!campaign) {
        throw new BadRequestException("Kampania nie istnieje");
      }

      if (campaign.organizationId !== dto.organizationId) {
        throw new BadRequestException("Kampania nie należy do tej organizacji");
      }
    }

    const baseSlug = dto.slug?.trim()
      ? this.slugify(dto.slug)
      : this.slugify(
          `${organization.name}-${campaign?.name || dto.title || "link"}`
        );

    const slug = await this.ensureUniqueSlug(baseSlug);

    const link = await this.prisma.redirectLink.create({
      data: {
        organizationId: dto.organizationId,
        campaignId: dto.campaignId || null,
        slug,
        destinationUrl: dto.destinationUrl.trim(),
        fallbackUrl: dto.fallbackUrl?.trim() || null,
        title: dto.title?.trim() || null,
        isActive: true,
      },
      select: {
        id: true,
        slug: true,
        destinationUrl: true,
        fallbackUrl: true,
        title: true,
        isActive: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        campaign: {
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
      link,
      publicUrl: `http://localhost:3001/r/${link.slug}`,
    };
  }

  async resolveBySlug(slug: string) {
    return this.prisma.redirectLink.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        destinationUrl: true,
        fallbackUrl: true,
        isActive: true,
        organizationId: true,
        campaignId: true,
      },
    });
  }
}