import {
  BadRequestException,
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
    let slug = baseSlug || `org-${Date.now()}`;
    let counter = 1;

    while (true) {
      const exists = await this.prisma.organization.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (!exists) return slug;

      counter += 1;
      slug = `${baseSlug}-${counter}`;
    }
  }

  async findAll(user?: any) {
    const orgIds = getAccessibleOrganizationIds(user);

    return this.prisma.organization.findMany({
      where: user?.isPlatformAdmin
        ? undefined
        : {
            id: {
              in: orgIds.length ? orgIds : ["__none__"],
            },
          },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string, user?: any) {
    const orgIds = getAccessibleOrganizationIds(user);

    const organization = await this.prisma.organization.findFirst({
      where: user?.isPlatformAdmin
        ? { id }
        : {
            id: {
              in: orgIds.length ? orgIds : ["__none__"],
            },
          },
    });

    if (!organization) {
      throw new NotFoundException("Organizacja nie została znaleziona");
    }

    return organization;
  }

  async create(dto: { name: string; industry?: string }) {
    if (!dto.name?.trim()) {
      throw new BadRequestException("Nazwa organizacji jest wymagana");
    }

    const baseSlug = this.slugify(dto.name);
    const slug = await this.ensureUniqueSlug(baseSlug);

    const created = await this.prisma.organization.create({
      data: {
        name: dto.name.trim(),
        slug,
        industry: dto.industry?.trim() || null,
        plan: "STARTER",
        status: "LEAD",
      },
    });

    try {
      const driveResult = await this.driveService.createOrganizationFolder(
        created.name
      );

      if (driveResult?.success) {
        return this.prisma.organization.update({
          where: { id: created.id },
          data: {
            rootFolderId: driveResult.folderId || null,
            rootFolderUrl: driveResult.folderUrl || null,
            lastSyncAt: new Date(),
          },
        });
      }
    } catch {}

    return created;
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
    const existing = await this.prisma.organization.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!existing) {
      throw new NotFoundException("Organizacja nie została znaleziona");
    }

    let slug: string | undefined;

    if (dto.name?.trim() && dto.name.trim() !== existing.name) {
      slug = await this.ensureUniqueSlug(this.slugify(dto.name));
    }

    return this.prisma.organization.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        industry: dto.industry?.trim(),
        plan: dto.plan,
        status: dto.status,
        syncEnabled: dto.syncEnabled,
        slug,
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.organization.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!existing) {
      throw new NotFoundException("Organizacja nie została znaleziona");
    }

    await this.prisma.organization.delete({
      where: { id },
    });

    return {
      success: true,
      deletedId: id,
      message: `Usunięto organizację: ${existing.name}`,
    };
  }
}