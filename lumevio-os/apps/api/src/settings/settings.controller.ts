import { Body, Controller, Get, Patch } from "@nestjs/common";
import { Roles } from "../auth/roles.decorator";
import { SettingsService } from "./settings.service";

@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Roles("SUPERADMIN")
  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Roles("SUPERADMIN")
  @Patch()
  updateSettings(
    @Body()
    dto: {
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
    }
  ) {
    return this.settingsService.updateSettings(dto);
  }
}