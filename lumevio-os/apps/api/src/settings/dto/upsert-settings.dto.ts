import { IsBoolean, IsOptional, IsString } from "class-validator";

export class UpsertSettingsDto {
  @IsOptional()
  @IsString()
  platformName?: string;

  @IsOptional()
  @IsString()
  supportEmail?: string;

  @IsOptional()
  @IsString()
  appBaseUrl?: string;

  @IsOptional()
  @IsString()
  apiBaseUrl?: string;

  @IsOptional()
  @IsString()
  goBaseUrl?: string;

  @IsOptional()
  @IsString()
  defaultCampaignPreset?: string;

  @IsOptional()
  @IsString()
  defaultPageMode?: string;

  @IsOptional()
  @IsString()
  defaultUtmSource?: string;

  @IsOptional()
  @IsString()
  defaultUtmMedium?: string;

  @IsOptional()
  @IsBoolean()
  trackIp?: boolean;

  @IsOptional()
  @IsBoolean()
  trackUserAgent?: boolean;

  @IsOptional()
  @IsBoolean()
  trackReferer?: boolean;

  @IsOptional()
  @IsBoolean()
  allowCustomDomains?: boolean;

  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @IsBoolean()
  googleDriveEnabled?: boolean;

  @IsOptional()
  @IsString()
  googleAppsScriptUrl?: string;

  @IsOptional()
  @IsString()
  googleDriveRootFolderId?: string;

  @IsOptional()
  @IsString()
  googleDriveRootFolderUrl?: string;
}