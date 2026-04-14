import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { getAccessibleOrganizationIds } from "../auth/authz.util";

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user?: any) {
    if (user?.isPlatformAdmin) {
      return this.prisma.store.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          city: true,
          address: true,
          zone: true,
          status: true,
          healthScore: true,
          createdAt: true,
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

    const orgIds = getAccessibleOrganizationIds(user);

    return this.prisma.store.findMany({
      where: {
        organizationId: {
          in: orgIds.length ? orgIds : ["__none__"],
        },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        city: true,
        address: true,
        zone: true,
        status: true,
        healthScore: true,
        createdAt: true,
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

  async create(dto: {
    organizationId: string;
    name: string;
    city?: string;
    address?: string;
    zone?: string;
  }) {
    if (!dto.organizationId || !dto.name?.trim()) {
      throw new BadRequestException("Brakuje organizationId albo name");
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id: dto.organizationId },
      select: { id: true, storesCount: true },
    });

    if (!organization) {
      throw new BadRequestException("Organizacja nie istnieje");
    }

    const store = await this.prisma.store.create({
      data: {
        organizationId: dto.organizationId,
        name: dto.name.trim(),
        city: dto.city?.trim() || null,
        address: dto.address?.trim() || null,
        zone: dto.zone?.trim() || null,
        status: "LIVE",
      },
      select: {
        id: true,
        name: true,
        city: true,
        address: true,
        zone: true,
        status: true,
        healthScore: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    await this.prisma.organization.update({
      where: { id: dto.organizationId },
      data: {
        storesCount: {
          increment: 1,
        },
      },
    });

    return {
      success: true,
      store,
    };
  }
}