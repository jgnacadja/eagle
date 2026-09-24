import { Module } from '@nestjs/common'
import { CacheModule } from '../common/cache/cache.module'
import { DirectusModule } from '../directus/directus.module'
import { SearchMissesModule } from '../search-misses/search-misses.module'
import { CatalogController } from './catalog.controller'
import { CatalogService } from './catalog.service'

@Module({
  imports: [CacheModule, DirectusModule, SearchMissesModule],
  controllers: [CatalogController],
  providers: [CatalogService]
})
export class CatalogModule {}
