import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class RedirectLinksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.redirectLink.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        organization: {
          select: { id: true, name: true, slug: true },
        },
        campaign: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
  }

  async findById(id: string) {
    const link = await this.prisma.redirectLink.findUnique({
      where: { id },
      include: {
        organization: {
          select: { id: true, name: true, slug: true },
        },
        campaign: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!link) {
      throw new NotFoundException("Redirect link not found");
    }

    return link;
  }

  async resolveBySlug(slug: string) {
    const link = await this.prisma.redirectLink.findUnique({
      where: { slug },
      include: {
        organization: {
          select: { id: true, name: true, slug: true },
        },
        campaign: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!link) {
      throw new NotFoundException("Redirect link not found");
    }

    return link;
  }

  getPublicUrl(link: { slug: string }) {
    const appBase =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_BASE_URL ||
      "http://localhost:3000";

    return `${appBase.replace(/\/$/, "")}/r/${link.slug}`;
  }
}