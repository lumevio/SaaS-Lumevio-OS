import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { DriveService } from "../drive/drive.service";
import { getAccessibleOrganizationIds } from "../auth/authz.util";

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly driveService: DriveService
  ) {}

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
    let slug = baseSlug || `organization-${Date.now()}`;
    let counter = 1;

    while (true) {
      const exists = await this.prisma.organization.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (!exists) {
        return slug;
      }

      counter += 1;
      slug = `${baseSlug}-${counter}`;
    }
  }

  async create(dto: { name: string; industry?: string }) {
    if (!dto.name?.trim()) {
      throw new BadRequestException("Nazwa organizacji jest wymagana");
    }

    const baseSlug = this.slugify(dto.name);
    const slug = await this.ensureUniqueSlug(baseSlug);

    const organization = await this.prisma.organization.create({
      data: {
        name: dto.name.trim(),
        slug,
        industry: dto.industry?.trim() || null,
        plan: "STARTER",
        status: "LEAD",
        syncEnabled: true,
      },
    });

    try {
      console.log("🔥 CREATE START:", organization.name);

      const driveResult = await this.driveService.createOrganizationFolder(
        organization.name
      );

      console.log("➡️ DRIVE RESULT:", driveResult);

      if (driveResult?.success && driveResult.folderUrl) {
        const updated = await this.prisma.organization.update({
          where: { id: organization.id },
          data: {
            rootFolderId: driveResult.folderId || null,
            rootFolderUrl: driveResult.folderUrl,
            lastSyncAt: new Date(),
            syncEnabled: true,
          },
        });

        console.log("✅ UPDATED:", updated);
        return updated;
      }

      return organization;
    } catch (error) {
      console.error("❌ DRIVE SYNC ERROR:", error);
      return organization;
    }
  }

  async findAll(user?: any) {
    if (user?.isPlatformAdmin) {
      return this.prisma.organization.findMany({
        orderBy: { createdAt: "desc" },
      });
    }

    const orgIds = getAccessibleOrganizationIds(user);

    return this.prisma.organization.findMany({
      where: {
        id: {
          in: orgIds.length ? orgIds : ["__none__"],
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string, user?: any) {
    if (user?.isPlatformAdmin) {
      const organization = await this.prisma.organization.findUnique({
        where: { id },
      });

      if (!organization) {
        throw new NotFoundException("Organizacja nie została znaleziona");
      }

      return organization;
    }

    const orgIds = getAccessibleOrganizationIds(user);

    if (!orgIds.includes(id)) {
      throw new ForbiddenException("Brak dostępu do tej organizacji");
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      throw new NotFoundException("Organizacja nie została znaleziona");
    }

    return organization;
  }

  async update(
    id: string,
    dto: {
      name?: string;
      industry?: string;
      plan?: string;
      status?: string;
      syncEnabled?: boolean;
    }
  ) {
    const exists = await this.prisma.organization.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!exists) {
      throw new NotFoundException("Organizacja nie została znaleziona");
    }

    let nextSlug: string | undefined;

    if (dto.name?.trim() && dto.name.trim() !== exists.name) {
      const baseSlug = this.slugify(dto.name);
      nextSlug = await this.ensureUniqueSlug(baseSlug);
    }

    return this.prisma.organization.update({
      where: { id },
      data: {
        name: dto.name?.trim() || undefined,
        slug: nextSlug,
        industry: dto.industry?.trim() || undefined,
        plan: dto.plan?.trim() || undefined,
        status: dto.status?.trim() || undefined,
        syncEnabled:
          typeof dto.syncEnabled === "boolean" ? dto.syncEnabled : undefined,
      },
    });
  }

  async remove(id: string) {
    const exists = await this.prisma.organization.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException("Organizacja nie została znaleziona");
    }

    await this.prisma.organization.delete({
      where: { id },
    });

    return {
      success: true,
      message: "Organizacja usunięta",
    };
  }
}