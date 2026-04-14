import { Body, Controller, Get, Post, Req } from "@nestjs/common";
import { Roles } from "../auth/roles.decorator";
import { NfcTagsService } from "./nfc-tags.service";

@Controller("nfc-tags")
export class NfcTagsController {
  constructor(private readonly nfcTagsService: NfcTagsService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.nfcTagsService.findAll(req.user);
  }

  @Roles("SUPERADMIN")
  @Post()
  create(
    @Body()
    dto: {
      organizationId: string;
      campaignId?: string;
      redirectLinkId?: string;
      uid: string;
      serialNumber?: string;
      tagType?: string;
      label?: string;
    }
  ) {
    return this.nfcTagsService.create(dto);
  }
}