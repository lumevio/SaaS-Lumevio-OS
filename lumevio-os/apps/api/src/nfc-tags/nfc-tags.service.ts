import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class NfcTagsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.nfcTag.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        organization: {
          select: { id: true, name: true, slug: true },
        },
        store: {
          select: { id: true, name: true },
        },
        campaign: {
          select: { id: true, name: true, slug: true },
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

  async findById(id: string) {
    const tag = await this.prisma.nfcTag.findUnique({
      where: { id },
      include: {
        organization: {
          select: { id: true, name: true, slug: true },
        },
        store: {
          select: { id: true, name: true },
        },
        campaign: {
          select: { id: true, name: true, slug: true },
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

    if (!tag) {
      throw new NotFoundException("NFC tag not found");
    }

    return tag;
  }

  getPublicUrl(tag: { id: string; redirectLink?: { slug: string } | null }) {
    const appBase =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_BASE_URL ||
      "http://localhost:3000";

    if (!tag.redirectLink?.slug) {
      return `${appBase.replace(/\/$/, "")}/nfc/${tag.id}`;
    }

    return `${appBase.replace(/\/$/, "")}/r/${tag.redirectLink.slug}?nfc_tag_id=${encodeURIComponent(tag.id)}`;
  }
}