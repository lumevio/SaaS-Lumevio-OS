import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateOrganizationDto } from "./dto/create-organization.dto";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";
import { GoogleDriveService } from "../google-drive/google-drive.service";

type OrganizationRecord = {
  id: string;
  name: string;
  legalName?: string | null;
  slug: string;
  type?: string | null;
  status?: string | null;
  industry?: string | null;
  plan?: string | null;
  nip?: string | null;
  regon?: string | null;
  krs?: string | null;
  vatEu?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  contactFirstName?: string | null;
  contactLastName?: string | null;
  contactPosition?: string | null;
  street?: string | null;
  buildingNo?: string | null;
  unitNo?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  notes?: string | null;
  rootFolderId?: string | null;
  rootFolderUrl?: string | null;
  syncEnabled?: boolean | null;
  lastSyncAt?: Date | null;
  storesCount?: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type CampaignRecord = {
  id: string;
  name: string;
  slug?: string | null;
  type?: string | null;
  status?: string | null;
  createdAt?: Date | null;
};

type StoreRecord = {
  id: string;
  name: string;
  city?: string | null;
  region?: string | null;
  addressLine1?: string | null;
  createdAt?: Date | null;
};

type OrganizationWithRelations = OrganizationRecord & {
  campaigns: CampaignRecord[];
  stores: StoreRecord[];
};

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly googleDriveService: GoogleDriveService,
  ) {}

  async findAll() {
    return this.prisma.organization.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.organization.findUnique({
      where: { id },
    });
  }

  async create(dto: CreateOrganizationDto) {
    const slug = await this.ensureUniqueSlug(dto.slug || dto.name);

    const created = (await this.prisma.organization.create({
      data: {
        name: dto.name.trim(),
        legalName: dto.legalName?.trim() || null,
        slug,
        type: dto.type?.trim() || "ENTERPRISE",
        status: dto.status?.trim() || "ACTIVE",
        industry: dto.industry?.trim() || null,
        plan: dto.plan?.trim() || "ENTERPRISE",
        nip: dto.nip?.trim() || null,
        regon: dto.regon?.trim() || null,
        krs: dto.krs?.trim() || null,
        vatEu: dto.vatEu?.trim() || null,
        email: dto.email?.trim() || null,
        phone: dto.phone?.trim() || null,
        website: dto.website?.trim() || null,
        contactFirstName: dto.contactFirstName?.trim() || null,
        contactLastName: dto.contactLastName?.trim() || null,
        contactPosition: dto.contactPosition?.trim() || null,
        street: dto.street?.trim() || null,
        buildingNo: dto.buildingNo?.trim() || null,
        unitNo: dto.unitNo?.trim() || null,
        postalCode: dto.postalCode?.trim() || null,
        city: dto.city?.trim() || null,
        country: dto.country?.trim() || null,
        notes: dto.notes?.trim() || null,
        rootFolderId: dto.rootFolderId?.trim() || null,
        rootFolderUrl: dto.rootFolderUrl?.trim() || null,
        syncEnabled: dto.syncEnabled ?? true,
      },
    })) as OrganizationRecord;

    if (!created.rootFolderId && (created.syncEnabled ?? true)) {
      await this.tryProvisionDriveForOrganization(created.id);
    }

    return this.findOne(created.id);
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    const existing = (await this.prisma.organization.findUnique({
      where: { id },
    })) as OrganizationRecord | null;

    if (!existing) {
      throw new Error("Organizacja nie istnieje");
    }

    let slug = existing.slug;
    if (dto.slug || dto.name) {
      slug = await this.ensureUniqueSlug(dto.slug || dto.name || existing.slug, id);
    }

    return this.prisma.organization.update({
      where: { id },
      data: {
        name: dto.name?.trim() ?? existing.name,
        legalName: dto.legalName !== undefined ? dto.legalName?.trim() || null : undefined,
        slug,
        type: dto.type !== undefined ? dto.type?.trim() || null : undefined,
        status: dto.status !== undefined ? dto.status?.trim() || null : undefined,
        industry: dto.industry !== undefined ? dto.industry?.trim() || null : undefined,
        plan: dto.plan !== undefined ? dto.plan?.trim() || null : undefined,
        nip: dto.nip !== undefined ? dto.nip?.trim() || null : undefined,
        regon: dto.regon !== undefined ? dto.regon?.trim() || null : undefined,
        krs: dto.krs !== undefined ? dto.krs?.trim() || null : undefined,
        vatEu: dto.vatEu !== undefined ? dto.vatEu?.trim() || null : undefined,
        email: dto.email !== undefined ? dto.email?.trim() || null : undefined,
        phone: dto.phone !== undefined ? dto.phone?.trim() || null : undefined,
        website: dto.website !== undefined ? dto.website?.trim() || null : undefined,
        contactFirstName:
          dto.contactFirstName !== undefined ? dto.contactFirstName?.trim() || null : undefined,
        contactLastName:
          dto.contactLastName !== undefined ? dto.contactLastName?.trim() || null : undefined,
        contactPosition:
          dto.contactPosition !== undefined ? dto.contactPosition?.trim() || null : undefined,
        street: dto.street !== undefined ? dto.street?.trim() || null : undefined,
        buildingNo: dto.buildingNo !== undefined ? dto.buildingNo?.trim() || null : undefined,
        unitNo: dto.unitNo !== undefined ? dto.unitNo?.trim() || null : undefined,
        postalCode: dto.postalCode !== undefined ? dto.postalCode?.trim() || null : undefined,
        city: dto.city !== undefined ? dto.city?.trim() || null : undefined,
        country: dto.country !== undefined ? dto.country?.trim() || null : undefined,
        notes: dto.notes !== undefined ? dto.notes?.trim() || null : undefined,
        rootFolderId:
          dto.rootFolderId !== undefined ? dto.rootFolderId?.trim() || null : undefined,
        rootFolderUrl:
          dto.rootFolderUrl !== undefined ? dto.rootFolderUrl?.trim() || null : undefined,
        syncEnabled: dto.syncEnabled !== undefined ? Boolean(dto.syncEnabled) : undefined,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.organization.delete({
      where: { id },
    });
  }

  async reprovisionDrive(id: string) {
    return this.tryProvisionDriveForOrganization(id);
  }

  async getClientProfile(id: string) {
    const organization = (await this.prisma.organization.findUnique({
      where: { id },
      include: {
        campaigns: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            status: true,
            createdAt: true,
          },
        },
        stores: {
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            name: true,
            city: true,
            region: true as never,
            addressLine1: true as never,
            createdAt: true,
          },
        },
      },
    })) as OrganizationWithRelations | null;

    if (!organization) {
      throw new Error("Organizacja nie istnieje");
    }

    const rootFolderName =
      organization.name ? `LUMEVIO - ${organization.name}` : "LUMEVIO Client";

    return {
      organization: {
        id: organization.id,
        name: organization.name,
        legalName: organization.legalName,
        slug: organization.slug,
        type: organization.type ?? organization.plan,
        status: organization.status,
        industry: organization.industry,
        plan: organization.plan,
        nip: organization.nip,
        regon: organization.regon,
        krs: organization.krs,
        vatEu: organization.vatEu,
        email: organization.email,
        phone: organization.phone,
        website: organization.website,
        contact: {
          firstName: organization.contactFirstName,
          lastName: organization.contactLastName,
          position: organization.contactPosition,
        },
        address: {
          street: organization.street,
          buildingNo: organization.buildingNo,
          unitNo: organization.unitNo,
          postalCode: organization.postalCode,
          city: organization.city,
          country: organization.country,
        },
        notes: organization.notes,
        createdAt: organization.createdAt,
        updatedAt: organization.updatedAt,
      },
      drive: {
        syncEnabled: organization.syncEnabled,
        folderId: organization.rootFolderId,
        folderUrl: organization.rootFolderUrl,
        rootFolderName,
        blueprint: this.buildDriveBlueprint(rootFolderName),
      },
      operations: {
        totalCampaigns: organization.campaigns.length,
        totalStores: organization.stores.length,
        latestCampaigns: organization.campaigns,
        latestStores: organization.stores,
      },
      clientProfileFiles: {
        jsonFileName: "client-profile.json",
        txtFileName: "client-profile.txt",
      },
    };
  }

  async syncClientProfileToDrive(id: string) {
    const organization = (await this.prisma.organization.findUnique({
      where: { id },
    })) as OrganizationRecord | null;

    if (!organization) {
      throw new Error("Organization not found");
    }

    const profile = await this.getClientProfile(id);

    return this.googleDriveService.saveClientProfileFile({
      organizationId: id,
      organizationName: organization.name,
      clientFolderId: organization.rootFolderId || null,
      clientRootName: `LUMEVIO - ${organization.name}`,
      fileName: "client-profile.json",
      content: JSON.stringify(profile, null, 2),
    });
  }

  private async tryProvisionDriveForOrganization(id: string) {
    const organization = (await this.prisma.organization.findUnique({
      where: { id },
    })) as OrganizationRecord | null;

    if (!organization) {
      throw new Error("Organization not found");
    }

    const result = await this.googleDriveService.provisionOrganizationStructure({
      organizationId: organization.id,
      organizationName: organization.name,
      organizationSlug: organization.slug,
      profile: {
        organizationId: organization.id,
        name: organization.name,
        legalName: organization.legalName,
        slug: organization.slug,
        type: organization.type,
        status: organization.status,
        industry: organization.industry,
        plan: organization.plan,
        nip: organization.nip,
        regon: organization.regon,
        krs: organization.krs,
        vatEu: organization.vatEu,
        email: organization.email,
        phone: organization.phone,
        website: organization.website,
        contactFirstName: organization.contactFirstName,
        contactLastName: organization.contactLastName,
        contactPosition: organization.contactPosition,
        street: organization.street,
        buildingNo: organization.buildingNo,
        unitNo: organization.unitNo,
        postalCode: organization.postalCode,
        city: organization.city,
        country: organization.country,
        notes: organization.notes,
      },
    });

    if (result?.success) {
      const updated = await this.prisma.organization.update({
        where: { id: organization.id },
        data: {
          rootFolderId: result.clientFolderId || organization.rootFolderId || null,
          rootFolderUrl: result.clientFolderUrl || organization.rootFolderUrl || null,
          syncEnabled: true,
          lastSyncAt: new Date(),
        },
      });

      return {
        success: true,
        organization: updated,
        drive: result,
      };
    }

    return {
      success: false,
      organization,
      drive: result,
    };
  }

  private buildDriveBlueprint(rootFolderName: string) {
    return {
      root: rootFolderName,
      folders: [
        {
          name: "00_Client_Profile",
          files: ["client-profile.json", "client-profile.txt", "branding-notes.txt"],
        },
        {
          name: "01_Offers",
          files: ["offer-v1.pdf", "pricing-notes.txt"],
        },
        {
          name: "02_Agreements",
          files: ["agreement-draft.docx", "legal-notes.txt"],
        },
        {
          name: "03_Campaigns",
          files: [],
        },
        {
          name: "04_NFC_Tags",
          files: ["nfc-inventory.csv", "tag-mapping-notes.txt"],
        },
        {
          name: "05_Reports",
          files: ["campaign-pack.pdf", "monthly-report.pdf"],
        },
        {
          name: "06_Assets",
          files: ["logo.png", "brand-guidelines.pdf", "hero-image.png"],
        },
        {
          name: "07_Documents",
          files: ["brief.txt", "meeting-notes.txt"],
        },
      ],
    };
  }

  private async ensureUniqueSlug(rawValue: string, currentId?: string) {
    const baseSlug = this.slugify(rawValue);
    let slug = baseSlug || `organization-${Date.now()}`;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.organization.findUnique({
        where: { slug },
      });

      if (!existing || existing.id === currentId) {
        return slug;
      }

      counter += 1;
      slug = `${baseSlug}-${counter}`;
    }
  }

  private slugify(value: string) {
    return value
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-");
  }
}