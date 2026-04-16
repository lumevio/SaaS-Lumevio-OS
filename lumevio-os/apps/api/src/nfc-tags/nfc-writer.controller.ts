import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { NfcWriterService } from "./nfc-writer.service";
import { CreateNfcWriterJobDto } from "./create-nfc-writer-job.dto";
import { CompleteNfcWriterJobDto } from "./complete-nfc-writer-job.dto";

@Controller("nfc-writer")
export class NfcWriterController {
  constructor(private readonly nfcWriterService: NfcWriterService) {}

  @Post("jobs")
  createJob(@Body() dto: CreateNfcWriterJobDto) {
    return this.nfcWriterService.createJob(dto);
  }

  @Get("jobs/:id")
  getJob(@Param("id") id: string) {
    return this.nfcWriterService.getJob(id);
  }

  @Post("jobs/:id/complete")
  completeJob(@Param("id") id: string, @Body() dto: CompleteNfcWriterJobDto) {
    return this.nfcWriterService.completeJob(id, dto);
  }
}