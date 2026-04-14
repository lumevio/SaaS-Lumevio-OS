export type OrganizationListItem = {
  id: string;
  name: string;
  slug: string;
  industry?: string | null;
  plan: string;
  status: string;
  storesCount: number;
  rootFolderId?: string | null;
  rootFolderUrl?: string | null;
  syncEnabled: boolean;
  lastSyncAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationDetails = {
  id: string;
  name: string;
  slug: string;
  industry?: string | null;
  plan: string;
  status: string;
  storesCount: number;
  rootFolderId?: string | null;
  rootFolderUrl?: string | null;
  syncEnabled: boolean;
  lastSyncAt?: string | null;
  createdAt: string;
  updatedAt: string;
  stores?: Array<{
    id: string;
    name: string;
    city?: string | null;
    address?: string | null;
    status?: string | null;
  }>;
  campaigns?: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    type: string;
  }>;
  documents?: Array<{
    id: string;
    name: string;
    documentType: string;
    fileUrl?: string | null;
  }>;
  driveFiles?: Array<{
    id: string;
    name: string;
    webViewLink?: string | null;
    mimeType?: string | null;
  }>;
};

export type CreateOrganizationPayload = {
  name: string;
  industry?: string;
};