import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

type CreateNfcWriterJobInput = {
  organizationId: string;
  storeId?: string | null;
  campaignId?: string | null;
  redirectLinkId?: string | null;
  label?: string | null;
  serialNumber?: string | null;
  tagType?: string | null;
  status?: string | null;
};

type CompleteNfcWriterJobInput = {
  uid: string;
};

@Injectable()
export class NfcWriterService {
  constructor(private readonly prisma: PrismaService) {}

  async createJob(input: CreateNfcWriterJobInput) {
    const job = await this.prisma.nfcWriterJob.create({
      data: {
        id: crypto.randomUUID(),
        updatedAt: new Date(),
        status: input.status || "PENDING",
        label: input.label?.trim() || null,
        serialNumber: input.serialNumber?.trim() || null,
        tagType: input.tagType?.trim() || null,
        organizationId: input.organizationId,
        storeId: input.storeId || null,
        campaignId: input.campaignId || null,
        redirectLinkId: input.redirectLinkId || null,
      },
      include: {
        Organization: {
          select: { id: true, name: true, slug: true },
        },
        Store: {
          select: { id: true, name: true },
        },
        Campaign: {
          select: { id: true, name: true, slug: true },
        },
        RedirectLink: {
          select: { id: true, slug: true, title: true, destinationUrl: true },
        },
      },
    });

    return job;
  }

  async findAll() {
    return this.prisma.nfcWriterJob.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        Organization: {
          select: { id: true, name: true, slug: true },
        },
        Store: {
          select: { id: true, name: true },
        },
        Campaign: {
          select: { id: true, name: true, slug: true },
        },
        RedirectLink: {
          select: { id: true, slug: true, title: true, destinationUrl: true },
        },
      },
    });
  }

  async findById(id: string) {
    const job = await this.prisma.nfcWriterJob.findUnique({
      where: { id },
      include: {
        Organization: {
          select: { id: true, name: true, slug: true },
        },
        Store: {
          select: { id: true, name: true },
        },
        Campaign: {
          select: { id: true, name: true, slug: true },
        },
        RedirectLink: {
          select: { id: true, slug: true, title: true, destinationUrl: true },
        },
      },
    });

    if (!job) {
      throw new NotFoundException("NFC writer job not found");
    }

    return job;
  }

  async getJob(id: string) {
    return this.findById(id);
  }

  async markWritten(id: string, uid: string) {
    const existing = await this.findById(id);

    const updated = await this.prisma.nfcWriterJob.update({
      where: { id },
      data: {
        uid,
        status: "COMPLETED",
        completedAt: new Date(),
        updatedAt: new Date(),
        errorMessage: null,
      },
      include: {
        Organization: {
          select: { id: true, name: true, slug: true },
        },
        Store: {
          select: { id: true, name: true },
        },
        Campaign: {
          select: { id: true, name: true, slug: true },
        },
        RedirectLink: {
          select: { id: true, slug: true, title: true, destinationUrl: true },
        },
      },
    });

    const tapUrl = updated.RedirectLink?.slug
      ? this.buildTapUrl(updated.id, updated.RedirectLink.slug)
      : null;

    return {
      previous: existing,
      current: updated,
      tapUrl,
    };
  }

  async completeJob(id: string, dto: CompleteNfcWriterJobInput) {
    return this.markWritten(id, dto.uid);
  }

  async markFailed(id: string, errorMessage: string) {
    return this.prisma.nfcWriterJob.update({
      where: { id },
      data: {
        status: "FAILED",
        updatedAt: new Date(),
        errorMessage: errorMessage?.trim() || "Unknown NFC write error",
      },
      include: {
        Organization: {
          select: { id: true, name: true, slug: true },
        },
        Store: {
          select: { id: true, name: true },
        },
        Campaign: {
          select: { id: true, name: true, slug: true },
        },
        RedirectLink: {
          select: { id: true, slug: true, title: true, destinationUrl: true },
        },
      },
    });
  }

  buildTapUrl(jobId: string, redirectSlug: string) {
    const appBase =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_BASE_URL ||
      "http://localhost:3000";

    return `${appBase.replace(/\/$/, "")}/r/${redirectSlug}?nfc_tag_id=${encodeURIComponent(jobId)}`;
  }
}