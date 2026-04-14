export class UpdateCampaignPageDto {
  organizationId?: string;
  campaignId?: string;
  slug?: string;
  title?: string;
  templateType?: string;
  status?: string;
  pageMode?: string;
  externalUrl?: string;
  customDomain?: string;
  jsonConfig?: unknown;
}