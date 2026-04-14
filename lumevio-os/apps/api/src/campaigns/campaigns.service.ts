import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { getAccessibleOrganizationIds } from "../auth/authz.util";

@Injectable()
export class CampaignsService {
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
    let slug = baseSlug || `campaign-${Date.now()}`;
    let counter = 1;

    while (true) {
      const exists = await this.prisma.campaign.findUnique({
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
    if (user?.isPlatformAdmin) {
      return this.prisma.campaign.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          objective: true,
          status: true,
          interactions: true,
          leads: true,
          conversionRate: true,
          createdAt: true,
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          store: {
            select: {
              id: true,
              name: true,
              city: true,
            },
          },
        },
      });
    }

    const orgIds = getAccessibleOrganizationIds(user);

    return this.prisma.campaign.findMany({
      where: {
        organizationId: {
          in: orgIds.length ? orgIds : ["__none__"],
        },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        objective: true,
        status: true,
        interactions: true,
        leads: true,
        conversionRate: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
    });
  }

  async findOne(id: string, user?: any) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            industry: true,
            plan: true,
            status: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            city: true,
            address: true,
            zone: true,
            status: true,
          },
        },
        redirectLinks: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            slug: true,
            title: true,
            destinationUrl: true,
            fallbackUrl: true,
            isActive: true,
            createdAt: true,
          },
        },
        documents: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            documentType: true,
            fileUrl: true,
            createdAt: true,
          },
        },
        events: {
          orderBy: { createdAt: "desc" },
          take: 25,
          select: {
            id: true,
            type: true,
            createdAt: true,
            payload: true,
            redirectLink: {
              select: {
                id: true,
                slug: true,
                title: true,
              },
            },
          },
        },
        nfcTags: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            uid: true,
            serialNumber: true,
            tagType: true,
            label: true,
            status: true,
            assignedAt: true,
            redirectLink: {
              select: {
                id: true,
                slug: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException("Kampania nie została znaleziona");
    }

    if (!user?.isPlatformAdmin) {
      const orgIds = getAccessibleOrganizationIds(user);

      if (!orgIds.includes(campaign.organizationId)) {
        throw new ForbiddenException("Brak dostępu do tej kampanii");
      }
    }

    return campaign;
  }

  async create(dto: {
    organizationId: string;
    storeId?: string;
    name: string;
    type: string;
    objective?: string;
  }) {
    if (!dto.organizationId || !dto.name?.trim() || !dto.type?.trim()) {
      throw new BadRequestException("Brakuje organizationId, name albo type");
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id: dto.organizationId },
      select: { id: true },
    });

    if (!organization) {
      throw new BadRequestException("Organizacja nie istnieje");
    }

    if (dto.storeId) {
      const store = await this.prisma.store.findUnique({
        where: { id: dto.storeId },
        select: { id: true, organizationId: true },
      });

      if (!store) {
        throw new BadRequestException("Sklep nie istnieje");
      }

      if (store.organizationId !== dto.organizationId) {
        throw new BadRequestException("Sklep nie należy do tej organizacji");
      }
    }

    const baseSlug = this.slugify(dto.name);
    const slug = await this.ensureUniqueSlug(baseSlug);

    const campaign = await this.prisma.campaign.create({
      data: {
        organizationId: dto.organizationId,
        storeId: dto.storeId || null,
        name: dto.name.trim(),
        slug,
        type: dto.type.trim(),
        objective: dto.objective?.trim() || null,
        status: "DRAFT",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        objective: true,
        status: true,
        interactions: true,
        leads: true,
        conversionRate: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
    });

    return {
      success: true,
      campaign,
    };
  }
}