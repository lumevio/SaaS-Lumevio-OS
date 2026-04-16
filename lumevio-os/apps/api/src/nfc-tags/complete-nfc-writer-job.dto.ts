export class CompleteNfcWriterJobDto {
  uid!: string;
  serialNumber?: string;
  tagType?: string;
  writeStatus!: "SUCCESS" | "FAILED";
  errorMessage?: string;
}