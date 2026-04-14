import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { OrganizationsModule } from "./organizations/organizations.module";
import { StoresModule } from "./stores/stores.module";
import { CampaignsModule } from "./campaigns/campaigns.module";
import { RedirectLinksModule } from "./redirect-links/redirect-links.module";
import { EventsModule } from "./events/events.module";
import { DocumentsModule } from "./documents/documents.module";
import { DriveModule } from "./drive/drive.module";
import { MailModule } from "./mail/mail.module";
import { AuditModule } from "./audit/audit.module";
import { PublicModule } from "./public/public.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { NfcTagsModule } from "./nfc-tags/nfc-tags.module";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";
import { RolesGuard } from "./auth/guards/roles.guard";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    StoresModule,
    CampaignsModule,
    RedirectLinksModule,
    EventsModule,
    DocumentsModule,
    DriveModule,
    MailModule,
    AuditModule,
    PublicModule,
    DashboardModule,
    NfcTagsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}