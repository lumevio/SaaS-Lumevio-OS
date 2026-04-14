import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    let settings = await this.prisma.platformSetting.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (!settings) {
      settings = await this.prisma.platformSetting.create({
        data: {},
      });
    }

    return settings;
  }

  async updateSettings(input: {
    platformName?: string;
    supportEmail?: string;
    appBaseUrl?: string;
    apiBaseUrl?: string;
    goBaseUrl?: string;
    defaultCampaignPreset?: string;
    defaultPageMode?: string;
    defaultUtmSource?: string;
    defaultUtmMedium?: string;
    trackIp?: boolean;
    trackUserAgent?: boolean;
    trackReferer?: boolean;
    allowCustomDomains?: boolean;
    maintenanceMode?: boolean;
    primaryColor?: string;

    googleDriveEnabled?: boolean;
    googleAppsScriptUrl?: string;
    googleDriveRootFolderId?: string;
    googleDriveRootFolderUrl?: string;
  }) {
    const current = await this.getSettings();

    return this.prisma.platformSetting.update({
      where: { id: current.id },
      data: {
        platformName: input.platformName,
        supportEmail: input.supportEmail,
        appBaseUrl: input.appBaseUrl,
        apiBaseUrl: input.apiBaseUrl,
        goBaseUrl: input.goBaseUrl,
        defaultCampaignPreset: input.defaultCampaignPreset,
        defaultPageMode: input.defaultPageMode,
        defaultUtmSource: input.defaultUtmSource,
        defaultUtmMedium: input.defaultUtmMedium,
        trackIp: input.trackIp,
        trackUserAgent: input.trackUserAgent,
        trackReferer: input.trackReferer,
        allowCustomDomains: input.allowCustomDomains,
        maintenanceMode: input.maintenanceMode,
        primaryColor: input.primaryColor,

        googleDriveEnabled: input.googleDriveEnabled,
        googleAppsScriptUrl: input.googleAppsScriptUrl,
        googleDriveRootFolderId: input.googleDriveRootFolderId,
        googleDriveRootFolderUrl: input.googleDriveRootFolderUrl,
      },
    });
  }
}