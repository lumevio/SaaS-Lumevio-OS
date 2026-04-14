import { Injectable, Logger } from "@nestjs/common";

type CreateOrganizationFolderResult = {
  success: boolean;
  folderId: string | null;
  folderUrl: string | null;
  raw?: unknown;
  error?: string;
};

@Injectable()
export class DriveService {
  private readonly logger = new Logger(DriveService.name);

  async createOrganizationFolder(
    name: string
  ): Promise<CreateOrganizationFolderResult> {
    const baseUrl = process.env.GOOGLE_APPS_SCRIPT_URL;

    this.logger.log(`GOOGLE_APPS_SCRIPT_URL: ${baseUrl}`);
    this.logger.log(`Tworzenie folderu dla: ${name}`);

    if (!baseUrl) {
      this.logger.warn("Brak GOOGLE_APPS_SCRIPT_URL w .env");
      return {
        success: false,
        folderId: null,
        folderUrl: null,
        error: "Brak GOOGLE_APPS_SCRIPT_URL",
      };
    }

    try {
      const url = `${baseUrl}?nazwa=${encodeURIComponent(name)}`;
      this.logger.log(`Request URL: ${url}`);

      const response = await fetch(url, {
        method: "GET",
      });

      const text = await response.text();
      this.logger.log(`Apps Script raw response: ${text}`);

      let data: any = null;

      try {
        data = JSON.parse(text);
      } catch {
        return {
          success: false,
          folderId: null,
          folderUrl: null,
          error: "Apps Script nie zwrócił poprawnego JSON",
          raw: text,
        };
      }

      const folderUrl = data.folderUrl ?? data.folder ?? null;
      const folderId = data.folderId ?? this.extractFolderId(folderUrl) ?? null;

      this.logger.log(`folderUrl: ${folderUrl}`);
      this.logger.log(`folderId: ${folderId}`);

      return {
        success: !!data.success,
        folderId,
        folderUrl,
        raw: data,
        error: data.error,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nieznany błąd";
      this.logger.error(message);

      return {
        success: false,
        folderId: null,
        folderUrl: null,
        error: message,
      };
    }
  }

  private extractFolderId(folderUrl?: string | null): string | null {
    if (!folderUrl) return null;

    const match = folderUrl.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    return match?.[1] ?? null;
  }
}