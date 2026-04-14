import {
  BadRequestException,
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

      if (!exists) return slug;

      counter += 1;
      slug = `${baseSlug}-${counter}`;
    }
  }

  async findAll(user?: any) {
    const orgIds = getAccessibleOrganizationIds(user);

    return this.prisma.campaign.findMany({
      where: user?.isPlatformAdmin
        ? undefined
        : {
            organizationId: {
              in: orgIds.length ? orgIds : ["__none__"],
            },
          },
      orderBy: { createdAt: "desc" },
      include: {
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
    const orgIds = getAccessibleOrganizationIds(user);

    const campaign = await this.prisma.campaign.findFirst({
      where: user?.isPlatformAdmin
        ? { id }
        : {
            id,
            organizationId: {
              in: orgIds.length ? orgIds : ["__none__"],
            },
          },
      include: {
        organization: true,
        store: true,
        redirectLinks: true,
        documents: true,
        events: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
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
          include: {
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
      select: { id: true, name: true },
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

    const slug = await this.ensureUniqueSlug(
      this.slugify(`${organization.name}-${dto.name}`)
    );

    return this.prisma.campaign.create({
      data: {
        organizationId: dto.organizationId,
        storeId: dto.storeId || null,
        name: dto.name.trim(),
        slug,
        type: dto.type.trim(),
        objective: dto.objective?.trim() || null,
        status: "DRAFT",
      },
      include: {
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

  async update(
    id: string,
    dto: {
      name?: string;
      type?: string;
      objective?: string;
      status?: string;
      storeId?: string | null;
    }
  ) {
    const existing = await this.prisma.campaign.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        organizationId: true,
      },
    });

    if (!existing) {
      throw new NotFoundException("Kampania nie została znaleziona");
    }

    if (dto.storeId) {
      const store = await this.prisma.store.findUnique({
        where: { id: dto.storeId },
        select: { id: true, organizationId: true },
      });

      if (!store) {
        throw new BadRequestException("Sklep nie istnieje");
      }

      if (store.organizationId !== existing.organizationId) {
        throw new BadRequestException("Sklep nie należy do tej organizacji");
      }
    }

    let slug: string | undefined;

    if (dto.name?.trim() && dto.name.trim() !== existing.name) {
      slug = await this.ensureUniqueSlug(this.slugify(dto.name));
    }

    return this.prisma.campaign.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        type: dto.type?.trim(),
        objective: dto.objective?.trim(),
        status: dto.status,
        storeId: dto.storeId === undefined ? undefined : dto.storeId,
        slug,
      },
      include: {
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

  async remove(id: string) {
    const existing = await this.prisma.campaign.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!existing) {
      throw new NotFoundException("Kampania nie została znaleziona");
    }

    await this.prisma.campaign.delete({
      where: { id },
    });

    return {
      success: true,
      deletedId: id,
      message: `Usunięto kampanię: ${existing.name}`,
    };
  }
}