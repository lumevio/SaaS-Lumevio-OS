import { Module } from '@nestjs/common';
import { CampaignPagesController } from './campaign-pages.controller';
import { CampaignPagesService } from './campaign-pages.service';

@Module({
  controllers: [CampaignPagesController],
  providers: [CampaignPagesService],
  exports: [CampaignPagesService],
})
export class CampaignPagesModule {}