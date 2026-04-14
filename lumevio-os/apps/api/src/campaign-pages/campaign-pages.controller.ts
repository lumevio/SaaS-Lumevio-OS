import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CampaignPagesService } from './campaign-pages.service';
import { CreateCampaignPageDto } from './dto/create-campaign-page.dto';
import { UpdateCampaignPageDto } from './dto/update-campaign-page.dto';

@Controller('campaign-pages')
@UseGuards(JwtAuthGuard)
export class CampaignPagesController {
  constructor(private readonly service: CampaignPagesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCampaignPageDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCampaignPageDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/publish')
  publish(@Param('id') id: string) {
    return this.service.publish(id);
  }

  @Post(':id/unpublish')
  unpublish(@Param('id') id: string) {
    return this.service.unpublish(id);
  }

  @Post(':id/archive')
  archive(@Param('id') id: string) {
    return this.service.archive(id);
  }
}