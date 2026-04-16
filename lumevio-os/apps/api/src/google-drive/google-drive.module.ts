import { Module } from "@nestjs/common";
import { GoogleDriveService } from "./google-drive.service";
import { SettingsModule } from "../settings/settings.module";

@Module({
  imports: [SettingsModule],
  providers: [GoogleDriveService],
  exports: [GoogleDriveService],
})
export class GoogleDriveModule {}