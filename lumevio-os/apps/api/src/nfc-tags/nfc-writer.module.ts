import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { NfcWriterController } from "./nfc-writer.controller";
import { NfcWriterService } from "./nfc-writer.service";

@Module({
  imports: [PrismaModule],
  controllers: [NfcWriterController],
  providers: [NfcWriterService],
  exports: [NfcWriterService],
})
export class NfcWriterModule {}