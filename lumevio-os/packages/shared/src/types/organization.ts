export type Organization = {
  id: string;
  name: string;
  slug: string;
  industry?: string | null;
  plan: string;
  status: string;
  rootFolderId?: string | null;
  rootFolderUrl?: string | null;
  createdAt: string;
};
