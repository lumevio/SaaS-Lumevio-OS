import { Body, Controller, Get, Put } from "@nestjs/common";
import { SettingsService } from "./settings.service";
import { UpsertSettingsDto } from "./dto/upsert-settings.dto";

@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getAll() {
    return this.settingsService.getAll();
  }

  @Put()
  upsert(@Body() dto: UpsertSettingsDto) {
    return this.settingsService.upsert(dto);
  }
}