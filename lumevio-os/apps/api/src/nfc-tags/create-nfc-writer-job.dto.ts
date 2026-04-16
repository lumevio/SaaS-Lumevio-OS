export class CreateNfcWriterJobDto {
  organizationId!: string;
  storeId?: string;
  campaignId?: string;
  redirectLinkId?: string;
  label?: string;
  serialNumber?: string;
  tagType?: string;
  status?: string;
}