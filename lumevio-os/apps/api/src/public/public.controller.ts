import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { RedirectLinksService } from '../redirect-links/redirect-links.service';
import { CampaignPagesService } from '../campaign-pages/campaign-pages.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller()
export class PublicController {
  constructor(
    private readonly redirectLinksService: RedirectLinksService,
    private readonly campaignPagesService: CampaignPagesService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('r/:slug')
  async redirectBySlug(
    @Param('slug') slug: string,
    @Res() res: Response,
    @Query('session_id') sessionId?: string,
    @Query('nfc_tag_id') nfcTagId?: string,
  ) {
    const link = await this.redirectLinksService.resolveBySlug(slug);

    await this.prisma.event.create({
      data: {
        type: 'redirect_open',
        organizationId: link.organizationId,
        campaignId: link.campaignId,
        redirectLinkId: link.id,
        nfcTagId: nfcTagId || undefined,
        sessionId: sessionId || undefined,
        payload: {
          slug: link.slug,
          destinationUrl: link.destinationUrl,
          fallbackUrl: link.fallbackUrl,
        },
      },
    });

    if (link.campaignId) {
      const page = await this.prisma.campaignPage.findFirst({
        where: {
          campaignId: link.campaignId,
          status: 'published',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (page) {
        const search = new URLSearchParams();

        if (sessionId) {
          search.set('session_id', sessionId);
        }

        if (nfcTagId) {
          search.set('nfc_tag_id', nfcTagId);
        }

        const suffix = search.toString() ? `?${search.toString()}` : '';

        return res.redirect(`http://localhost:3002/p/${page.slug}${suffix}`);
      }
    }

    return res.redirect(link.destinationUrl);
  }

  @Get('public/campaign-pages/:slug')
  async getPublishedCampaignPage(@Param('slug') slug: string) {
    const page = await this.campaignPagesService.findPublishedBySlug(slug);

    if (page.pageMode === 'external_redirect' && page.externalUrl) {
      return {
        type: 'external_redirect',
        slug: page.slug,
        title: page.title,
        externalUrl: page.externalUrl,
        templateType: page.templateType,
        status: page.status,
        pageMode: page.pageMode,
        jsonConfig: page.jsonConfig,
        campaign: page.campaign,
        organization: page.organization,
      };
    }

    return {
      id: page.id,
      slug: page.slug,
      title: page.title,
      templateType: page.templateType,
      status: page.status,
      pageMode: page.pageMode,
      externalUrl: page.externalUrl,
      jsonConfig: page.jsonConfig,
      campaign: page.campaign,
      organization: page.organization,
    };
  }
}