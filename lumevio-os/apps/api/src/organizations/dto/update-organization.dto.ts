export class UpdateOrganizationDto {
  name?: string;
  slug?: string;

  legalName?: string;
  type?: string;
  status?: string;
  industry?: string;
  plan?: string;

  nip?: string;
  regon?: string;
  krs?: string;
  vatEu?: string;

  email?: string;
  phone?: string;
  website?: string;

  contactFirstName?: string;
  contactLastName?: string;
  contactPosition?: string;

  street?: string;
  buildingNo?: string;
  unitNo?: string;
  postalCode?: string;
  city?: string;
  country?: string;

  notes?: string;

  rootFolderId?: string;
  rootFolderUrl?: string;
  syncEnabled?: boolean;
}