import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DirectusCatalogService } from './directus.catalog.service'
import { DirectusProxyController } from './directus.proxy.controller'

@Module({
  imports: [ConfigModule],
  controllers: [DirectusProxyController],
  providers: [DirectusCatalogService],
  exports: [DirectusCatalogService]
})
export class DirectusModule {}
