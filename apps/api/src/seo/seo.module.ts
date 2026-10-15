import { Module } from '@nestjs/common'
import { DirectusModule } from '../directus/directus.module'
import { SeoController } from './seo.controller'
import { SeoService } from './seo.service'

@Module({
  imports: [DirectusModule],
  controllers: [SeoController],
  providers: [SeoService]
})
export class SeoModule {}
