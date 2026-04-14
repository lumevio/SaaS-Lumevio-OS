import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { RedirectLinksModule } from '../redirect-links/redirect-links.module';
import { CampaignPagesModule } from '../campaign-pages/campaign-pages.module';

@Module({
  imports: [RedirectLinksModule, CampaignPagesModule],
  controllers: [PublicController],
})
export class PublicModule {}