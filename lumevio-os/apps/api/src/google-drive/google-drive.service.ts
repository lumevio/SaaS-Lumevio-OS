import { Injectable } from "@nestjs/common";
import { SettingsService } from "../settings/settings.service";

type ProvisionOrganizationInput = {
  organizationId: string;
  organizationName: string;
  organizationSlug?: string | null;
  profile?: Record<string, unknown>;
};

type SyncOrganizationProfileInput = {
  organizationId: string;
  organizationName: string;
  clientFolderId?: string | null;
  clientRootName?: string | null;
  payload: Record<string, unknown>;
};

type SaveClientProfileFileInput = {
  organizationId: string;
  organizationName: string;
  clientFolderId?: string | null;
  clientRootName?: string | null;
  fileName: string;
  content: string;
};

@Injectable()
export class GoogleDriveService {
  constructor(private readonly settingsService: SettingsService) {}

  async getConfig() {
    const config = await this.settingsService.getGoogleDriveConfig();

    return {
      enabled: Boolean(config.enabled),
      scriptUrl: config.scriptUrl || "",
      rootFolderId: config.rootFolderId || "",
      rootFolderUrl: config.rootFolderUrl || "",
    };
  }

  async isEnabled() {
    const config = await this.getConfig();
    return config.enabled && Boolean(config.scriptUrl);
  }

  async provisionOrganization(input: ProvisionOrganizationInput) {
    const config = await this.getConfig();

    if (!config.enabled) {
      return {
        success: false,
        reason: "Google Drive integration disabled",
      };
    }

    if (!config.scriptUrl) {
      return {
        success: false,
        reason: "Missing Google Apps Script URL",
      };
    }

    const response = await fetch(config.scriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "provision_client",
        rootFolderId: config.rootFolderId || null,
        clientName: input.organizationName,
        clientSlug: input.organizationSlug || "",
        profile: {
          organizationId: input.organizationId,
          ...(input.profile || {}),
        },
      }),
    });

    const text = await response.text();

    try {
      return JSON.parse(text);
    } catch {
      return {
        success: false,
        reason: "Invalid JSON from Google Apps Script",
        raw: text,
      };
    }
  }

  async provisionOrganizationStructure(input: ProvisionOrganizationInput) {
    return this.provisionOrganization(input);
  }

  async syncOrganizationProfile(input: SyncOrganizationProfileInput) {
    const config = await this.getConfig();

    if (!config.enabled) {
      return {
        success: false,
        reason: "Google Drive integration disabled",
      };
    }

    if (!config.scriptUrl) {
      return {
        success: false,
        reason: "Missing Google Apps Script URL",
      };
    }

    const response = await fetch(config.scriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "save_client_profile",
        rootFolderId: config.rootFolderId || null,
        clientName: input.organizationName,
        clientFolderId: input.clientFolderId || null,
        clientRootName: input.clientRootName || `LUMEVIO - ${input.organizationName}`,
        fileName: "client-profile.json",
        profile: {
          organizationId: input.organizationId,
          ...input.payload,
        },
      }),
    });

    const text = await response.text();

    try {
      return JSON.parse(text);
    } catch {
      return {
        success: false,
        reason: "Invalid JSON from Google Apps Script",
        raw: text,
      };
    }
  }

  async saveClientProfileFile(input: SaveClientProfileFileInput) {
    const config = await this.getConfig();

    if (!config.enabled) {
      return {
        success: false,
        reason: "Google Drive integration disabled",
      };
    }

    if (!config.scriptUrl) {
      return {
        success: false,
        reason: "Missing Google Apps Script URL",
      };
    }

    const response = await fetch(config.scriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "save_client_profile",
        rootFolderId: config.rootFolderId || null,
        clientName: input.organizationName,
        clientFolderId: input.clientFolderId || null,
        clientRootName: input.clientRootName || `LUMEVIO - ${input.organizationName}`,
        fileName: input.fileName,
        profile: {
          organizationId: input.organizationId,
          rawContent: input.content,
        },
      }),
    });

    const text = await response.text();

    try {
      return JSON.parse(text);
    } catch {
      return {
        success: false,
        reason: "Invalid JSON from Google Apps Script",
        raw: text,
      };
    }
  }
}