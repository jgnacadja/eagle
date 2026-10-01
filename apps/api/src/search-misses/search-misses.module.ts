import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DirectusModule } from '../directus/directus.module'
import { SearchMissesController } from './search-misses.controller'
import { SearchMissesService } from './search-misses.service'

// Purge planifiée hors process (workflow GitHub `search-misses-purge.yml`
// → `POST /admin/search-misses/purge`) : aucun scheduler in-process.
@Module({
  imports: [ConfigModule, DirectusModule],
  controllers: [SearchMissesController],
  providers: [SearchMissesService],
  exports: [SearchMissesService]
})
export class SearchMissesModule {}
