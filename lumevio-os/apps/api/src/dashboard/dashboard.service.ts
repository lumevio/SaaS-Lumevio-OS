import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { getAccessibleOrganizationIds } from "../auth/authz.util";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(user?: any) {
    if (user?.isPlatformAdmin) {
      const [
        organizationsCount,
        usersCount,
        storesCount,
        campaignsCount,
        redirectLinksCount,
        eventsCount,
        latestOrganizations,
        latestEvents,
      ] = await Promise.all([
        this.prisma.organization.count(),
        this.prisma.user.count(),
        this.prisma.store.count(),
        this.prisma.campaign.count(),
        this.prisma.redirectLink.count(),
        this.prisma.event.count(),
        this.prisma.organization.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            plan: true,
            createdAt: true,
            rootFolderUrl: true,
          },
        }),
        this.prisma.event.findMany({
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            type: true,
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
              },
            },
          },
        }),
      ]);

      return {
        kpis: {
          organizationsCount,
          usersCount,
          storesCount,
          campaignsCount,
          redirectLinksCount,
          eventsCount,
        },
        latestOrganizations,
        latestEvents,
      };
    }

    const orgIds = getAccessibleOrganizationIds(user);

    const [
      storesCount,
      campaignsCount,
      redirectLinksCount,
      eventsCount,
      latestOrganizations,
      latestEvents,
    ] = await Promise.all([
      this.prisma.store.count({
        where: {
          organizationId: { in: orgIds.length ? orgIds : ["__none__"] },
        },
      }),
      this.prisma.campaign.count({
        where: {
          organizationId: { in: orgIds.length ? orgIds : ["__none__"] },
        },
      }),
      this.prisma.redirectLink.count({
        where: {
          organizationId: { in: orgIds.length ? orgIds : ["__none__"] },
        },
      }),
      this.prisma.event.count({
        where: {
          organizationId: { in: orgIds.length ? orgIds : ["__none__"] },
        },
      }),
      this.prisma.organization.findMany({
        where: {
          id: { in: orgIds.length ? orgIds : ["__none__"] },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          plan: true,
          createdAt: true,
          rootFolderUrl: true,
        },
      }),
      this.prisma.event.findMany({
        where: {
          organizationId: { in: orgIds.length ? orgIds : ["__none__"] },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          type: true,
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
            },
          },
        },
      }),
    ]);

    return {
      kpis: {
        organizationsCount: latestOrganizations.length,
        usersCount: 0,
        storesCount,
        campaignsCount,
        redirectLinksCount,
        eventsCount,
      },
      latestOrganizations,
      latestEvents,
    };
  }
}