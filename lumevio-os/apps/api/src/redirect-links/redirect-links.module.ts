import { Module } from "@nestjs/common";
import { RedirectLinksController } from "./redirect-links.controller";
import { RedirectLinksService } from "./redirect-links.service";

@Module({
  controllers: [RedirectLinksController],
  providers: [RedirectLinksService],
  exports: [RedirectLinksService],
})
export class RedirectLinksModule {}