import { Module } from '@nestjs/common'
import { SyncController } from './sync.controller'
import { SyncService } from './sync.service'
import { DigiformaModule } from '../digiforma/digiforma.module'
import { CacheModule } from '../common/cache/cache.module'
import { DirectusModule } from '../directus/directus.module'
import { CentresModule } from '../centres/centres.module'
import { SourcesModule } from '../sources/sources.module'

@Module({
  imports: [DigiformaModule, CacheModule, DirectusModule, CentresModule, SourcesModule],
  controllers: [SyncController],
  providers: [SyncService]
})
export class SyncModule {}
