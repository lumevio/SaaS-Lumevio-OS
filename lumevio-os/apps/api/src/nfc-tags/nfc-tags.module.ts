import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { QrModule } from "../common/qr/qr.module";
import { NfcTagsQrController } from "./nfc-tags.controller";
import { NfcTagsExportController } from "./nfc-tags-export.controller";
import { NfcTagsService } from "./nfc-tags.service";

@Module({
  imports: [PrismaModule, QrModule],
  controllers: [NfcTagsQrController, NfcTagsExportController],
  providers: [NfcTagsService],
  exports: [NfcTagsService],
})
export class NfcTagsModule {}