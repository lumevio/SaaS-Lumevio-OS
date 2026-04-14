import { ForbiddenException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { getAccessibleOrganizationIds } from "../auth/authz.util";

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user?: any) {
    const orgIds = getAccessibleOrganizationIds(user);

    return this.prisma.event.findMany({
      where: user?.isPlatformAdmin
        ? undefined
        : {
            organizationId: {
              in: orgIds.length ? orgIds : ["__none__"],
            },
          },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        type: true,
        createdAt: true,
        payload: true,
        sessionId: true,
        redirectLink: {
          select: {
            id: true,
            slug: true,
            title: true,
          },
        },
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

  async track(input: {
    type: string;
    organizationId: string;
    campaignId?: string | null;
    redirectLinkId?: string | null;
    nfcTagId?: string | null;
    sessionId?: string | null;
    payload?: Record<string, unknown>;
  }) {
    const payload = (input.payload ?? {}) as Prisma.InputJsonValue;

    return this.prisma.event.create({
      data: {
        type: input.type,
        organizationId: input.organizationId,
        campaignId: input.campaignId || null,
        redirectLinkId: input.redirectLinkId || null,
        nfcTagId: input.nfcTagId || null,
        sessionId: input.sessionId || null,
        payload,
      },
    });
  }

  async trackRedirectOpen(input: {
    redirectLinkId: string;
    organizationId: string;
    campaignId?: string | null;
    payload?: Record<string, unknown>;
  }) {
    return this.track({
      type: "redirect_open",
      redirectLinkId: input.redirectLinkId,
      organizationId: input.organizationId,
      campaignId: input.campaignId || null,
      payload: input.payload,
    });
  }

  private async assertCampaignAccess(user: any, campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        organizationId: true,
      },
    });

    if (!campaign) {
      throw new ForbiddenException("Brak dostępu do kampanii");
    }

    if (user?.isPlatformAdmin) {
      return campaign;
    }

    const orgIds = getAccessibleOrganizationIds(user);
    if (!orgIds.includes(campaign.organizationId)) {
      throw new ForbiddenException("Brak dostępu do kampanii");
    }

    return campaign;
  }

  async getSummary(
    user?: any,
    filters?: {
      campaignId?: string;
      organizationId?: string;
    }
  ) {
    const orgIds = getAccessibleOrganizationIds(user);

    if (!user?.isPlatformAdmin && filters?.organizationId) {
      if (!orgIds.includes(filters.organizationId)) {
        throw new ForbiddenException("Brak dostępu do organizacji");
      }
    }

    if (filters?.campaignId) {
      await this.assertCampaignAccess(user, filters.campaignId);
    }

    const where: Prisma.EventWhereInput = user?.isPlatformAdmin
      ? {}
      : {
          organizationId: {
            in: orgIds.length ? orgIds : ["__none__"],
          },
        };

    if (filters?.organizationId) {
      where.organizationId = filters.organizationId;
    }

    if (filters?.campaignId) {
      where.campaignId = filters.campaignId;
    }

    const [landingViews, ctaClicks, formSubmits, redirectOpens, recentEvents] =
      await Promise.all([
        this.prisma.event.count({
          where: { ...where, type: "landing_view" },
        }),
        this.prisma.event.count({
          where: { ...where, type: "cta_click" },
        }),
        this.prisma.event.count({
          where: { ...where, type: "form_submit" },
        }),
        this.prisma.event.count({
          where: { ...where, type: "redirect_open" },
        }),
        this.prisma.event.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            type: true,
            createdAt: true,
            sessionId: true,
            payload: true,
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

    const ctaRate = landingViews > 0 ? (ctaClicks / landingViews) * 100 : 0;
    const formRate = landingViews > 0 ? (formSubmits / landingViews) * 100 : 0;

    return {
      totals: {
        landingViews,
        ctaClicks,
        formSubmits,
        redirectOpens,
        ctaRate: Number(ctaRate.toFixed(2)),
        formRate: Number(formRate.toFixed(2)),
      },
      recentEvents,
    };
  }

  async getCampaignSummary(user: any, campaignId: string) {
    const campaign = await this.assertCampaignAccess(user, campaignId);

    const [landingViews, ctaClicks, formSubmits, redirectOpens, latestEvents] =
      await Promise.all([
        this.prisma.event.count({
          where: {
            campaignId,
            type: "landing_view",
          },
        }),
        this.prisma.event.count({
          where: {
            campaignId,
            type: "cta_click",
          },
        }),
        this.prisma.event.count({
          where: {
            campaignId,
            type: "form_submit",
          },
        }),
        this.prisma.event.count({
          where: {
            campaignId,
            type: "redirect_open",
          },
        }),
        this.prisma.event.findMany({
          where: { campaignId },
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            type: true,
            createdAt: true,
            sessionId: true,
            payload: true,
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

    const ctaRate = landingViews > 0 ? (ctaClicks / landingViews) * 100 : 0;
    const formRate = landingViews > 0 ? (formSubmits / landingViews) * 100 : 0;

    return {
      campaignId,
      organizationId: campaign.organizationId,
      totals: {
        landingViews,
        ctaClicks,
        formSubmits,
        redirectOpens,
        ctaRate: Number(ctaRate.toFixed(2)),
        formRate: Number(formRate.toFixed(2)),
      },
      latestEvents,
    };
  }
}