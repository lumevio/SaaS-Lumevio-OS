import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('events')
export class EventsController {
  constructor(private readonly prisma: PrismaService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createInternalEvent(@Body() body: any) {
    const event = await this.prisma.event.create({
      data: {
        type: body.type,
        organizationId: body.organizationId,
        campaignId: body.campaignId,
        redirectLinkId: body.redirectLinkId,
        nfcTagId: body.nfcTagId,
        sessionId: body.sessionId,
        payload: body.payload,
      },
    });

    return {
      success: true,
      eventId: event.id,
    };
  }

  @Post('public')
  async createPublicEvent(@Body() body: any) {
    const event = await this.prisma.event.create({
      data: {
        type: body.type,
        organizationId: body.organizationId,
        campaignId: body.campaignId,
        redirectLinkId: body.redirectLinkId,
        nfcTagId: body.nfcTagId,
        sessionId: body.sessionId,
        payload: body.payload,
      },
    });

    return {
      success: true,
      eventId: event.id,
    };
  }
}