import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { QrModule } from "../common/qr/qr.module";
import { RedirectLinksQrController } from "./redirect-links.controller";
import { RedirectLinksExportController } from "./redirect-links-export.controller";
import { RedirectLinksService } from "./redirect-links.service";

@Module({
  imports: [PrismaModule, QrModule],
  controllers: [RedirectLinksQrController, RedirectLinksExportController],
  providers: [RedirectLinksService],
  exports: [RedirectLinksService],
})
export class RedirectLinksModule {}