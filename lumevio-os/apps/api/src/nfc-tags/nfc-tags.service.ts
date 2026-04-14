import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { getAccessibleOrganizationIds } from "../auth/authz.util";

@Injectable()
export class NfcTagsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user?: any) {
    const orgIds = getAccessibleOrganizationIds(user);

    return this.prisma.nfcTag.findMany({
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
        uid: true,
        serialNumber: true,
        tagType: true,
        label: true,
        status: true,
        assignedAt: true,
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
        redirectLink: {
          select: {
            id: true,
            slug: true,
            title: true,
            destinationUrl: true,
          },
        },
      },
    });
  }

  async create(dto: {
    organizationId: string;
    campaignId?: string;
    redirectLinkId?: string;
    uid: string;
    serialNumber?: string;
    tagType?: string;
    label?: string;
  }) {
    if (!dto.organizationId || !dto.uid?.trim()) {
      throw new BadRequestException("Brakuje organizationId albo uid");
    }

    const existing = await this.prisma.nfcTag.findUnique({
      where: { uid: dto.uid.trim() },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException("Tag o takim UID już istnieje");
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id: dto.organizationId },
      select: { id: true },
    });

    if (!organization) {
      throw new BadRequestException("Organizacja nie istnieje");
    }

    if (dto.campaignId) {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: dto.campaignId },
        select: { id: true, organizationId: true },
      });

      if (!campaign) {
        throw new BadRequestException("Kampania nie istnieje");
      }

      if (campaign.organizationId !== dto.organizationId) {
        throw new BadRequestException("Kampania nie należy do tej organizacji");
      }
    }

    if (dto.redirectLinkId) {
      const redirectLink = await this.prisma.redirectLink.findUnique({
        where: { id: dto.redirectLinkId },
        select: { id: true, organizationId: true },
      });

      if (!redirectLink) {
        throw new BadRequestException("Redirect link nie istnieje");
      }

      if (redirectLink.organizationId !== dto.organizationId) {
        throw new BadRequestException("Redirect link nie należy do tej organizacji");
      }
    }

    const tag = await this.prisma.nfcTag.create({
      data: {
        organizationId: dto.organizationId,
        campaignId: dto.campaignId || null,
        redirectLinkId: dto.redirectLinkId || null,
        uid: dto.uid.trim(),
        serialNumber: dto.serialNumber?.trim() || null,
        tagType: dto.tagType?.trim() || null,
        label: dto.label?.trim() || null,
        status: "ACTIVE",
        assignedAt: new Date(),
      },
      select: {
        id: true,
        uid: true,
        serialNumber: true,
        tagType: true,
        label: true,
        status: true,
        assignedAt: true,
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
        redirectLink: {
          select: {
            id: true,
            slug: true,
            title: true,
            destinationUrl: true,
          },
        },
      },
    });

    return {
      success: true,
      tag,
    };
  }
}