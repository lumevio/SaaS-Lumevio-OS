import { Module } from "@nestjs/common";
import { NfcTagsController } from "./nfc-tags.controller";
import { NfcTagsService } from "./nfc-tags.service";

@Module({
  controllers: [NfcTagsController],
  providers: [NfcTagsService],
  exports: [NfcTagsService],
})
export class NfcTagsModule {}