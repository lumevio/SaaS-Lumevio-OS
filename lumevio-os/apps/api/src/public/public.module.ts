import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { EventsModule } from "../events/events.module";
import { RedirectLinksModule } from "../redirect-links/redirect-links.module";
import { PublicController } from "./public.controller";
import { PublicPagesController } from "./public-pages.controller";

@Module({
  imports: [PrismaModule, EventsModule, RedirectLinksModule],
  controllers: [PublicController, PublicPagesController],
})
export class PublicModule {}