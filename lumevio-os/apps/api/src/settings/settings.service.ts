import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpsertSettingsDto } from "./dto/upsert-settings.dto";

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    const existing = await this.prisma.platformSetting.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.platformSetting.create({
      data: {},
    });
  }

  async upsert(dto: UpsertSettingsDto) {
    const existing = await this.prisma.platformSetting.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (!existing) {
      return this.prisma.platformSetting.create({
        data: {
          platformName: dto.platformName ?? "LUMEVIO OS",
          supportEmail: dto.supportEmail ?? "admin@lumevio.pl",
          appBaseUrl: dto.appBaseUrl ?? "http://127.0.0.1:3000",
          apiBaseUrl: dto.apiBaseUrl ?? "http://127.0.0.1:3001",
          goBaseUrl: dto.goBaseUrl ?? "http://127.0.0.1:3002",
          defaultCampaignPreset: dto.defaultCampaignPreset ?? "landing",
          defaultPageMode: dto.defaultPageMode ?? "hosted",
          defaultUtmSource: dto.defaultUtmSource ?? "lumevio",
          defaultUtmMedium: dto.defaultUtmMedium ?? "nfc",
          trackIp: dto.trackIp ?? true,
          trackUserAgent: dto.trackUserAgent ?? true,
          trackReferer: dto.trackReferer ?? true,
          allowCustomDomains: dto.allowCustomDomains ?? false,
          maintenanceMode: dto.maintenanceMode ?? false,
          primaryColor: dto.primaryColor ?? "#6d7cff",
          googleDriveEnabled: dto.googleDriveEnabled ?? false,
          googleAppsScriptUrl: dto.googleAppsScriptUrl ?? null,
          googleDriveRootFolderId: dto.googleDriveRootFolderId ?? null,
          googleDriveRootFolderUrl: dto.googleDriveRootFolderUrl ?? null,
        },
      });
    }

    return this.prisma.platformSetting.update({
      where: { id: existing.id },
      data: {
        platformName: dto.platformName ?? existing.platformName,
        supportEmail: dto.supportEmail ?? existing.supportEmail,
        appBaseUrl: dto.appBaseUrl ?? existing.appBaseUrl,
        apiBaseUrl: dto.apiBaseUrl ?? existing.apiBaseUrl,
        goBaseUrl: dto.goBaseUrl ?? existing.goBaseUrl,
        defaultCampaignPreset: dto.defaultCampaignPreset ?? existing.defaultCampaignPreset,
        defaultPageMode: dto.defaultPageMode ?? existing.defaultPageMode,
        defaultUtmSource: dto.defaultUtmSource ?? existing.defaultUtmSource,
        defaultUtmMedium: dto.defaultUtmMedium ?? existing.defaultUtmMedium,
        trackIp: dto.trackIp ?? existing.trackIp,
        trackUserAgent: dto.trackUserAgent ?? existing.trackUserAgent,
        trackReferer: dto.trackReferer ?? existing.trackReferer,
        allowCustomDomains: dto.allowCustomDomains ?? existing.allowCustomDomains,
        maintenanceMode: dto.maintenanceMode ?? existing.maintenanceMode,
        primaryColor: dto.primaryColor ?? existing.primaryColor,
        googleDriveEnabled: dto.googleDriveEnabled ?? existing.googleDriveEnabled,
        googleAppsScriptUrl: dto.googleAppsScriptUrl ?? existing.googleAppsScriptUrl,
        googleDriveRootFolderId:
          dto.googleDriveRootFolderId ?? existing.googleDriveRootFolderId,
        googleDriveRootFolderUrl:
          dto.googleDriveRootFolderUrl ?? existing.googleDriveRootFolderUrl,
      },
    });
  }

  async getGoogleDriveConfig() {
    const settings = await this.getAll();

    return {
      enabled: settings.googleDriveEnabled,
      scriptUrl: settings.googleAppsScriptUrl?.trim() || "",
      rootFolderId: settings.googleDriveRootFolderId?.trim() || "",
      rootFolderUrl: settings.googleDriveRootFolderUrl?.trim() || "",
    };
  }
}