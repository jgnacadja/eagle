import { Module } from '@nestjs/common'
import { CacheModule } from '../common/cache/cache.module'
import { DirectusModule } from '../directus/directus.module'
import { PrismaModule } from '../prisma/prisma.module'
import { CatalogController } from './catalog.controller'
import { CatalogService } from './catalog.service'

@Module({
  imports: [CacheModule, PrismaModule, DirectusModule],
  controllers: [CatalogController],
  providers: [CatalogService]
})
export class CatalogModule {}
