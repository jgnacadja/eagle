import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DirectusCatalogService } from './directus.catalog.service'
import { DirectusItemsClient } from './directus.items.client'
import { DirectusProxyController } from './directus.proxy.controller'

@Module({
  imports: [ConfigModule],
  controllers: [DirectusProxyController],
  providers: [DirectusCatalogService, DirectusItemsClient],
  exports: [DirectusCatalogService, DirectusItemsClient]
})
export class DirectusModule {}
