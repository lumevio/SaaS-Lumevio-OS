import { Module } from "@nestjs/common";
import { OrganizationsController } from "./organizations.controller";
import { OrganizationsService } from "./organizations.service";
import { PrismaModule } from "../prisma/prisma.module";
import { GoogleDriveModule } from "../google-drive/google-drive.module";

@Module({
  imports: [PrismaModule, GoogleDriveModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}