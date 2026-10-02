import { Module } from '@nestjs/common'
import { SyncController } from './sync.controller'
import { SyncService } from './sync.service'
import { DigiformaModule } from '../digiforma/digiforma.module'
import { CacheModule } from '../common/cache/cache.module'
import { DirectusModule } from '../directus/directus.module'
import { CentresModule } from '../centres/centres.module'

@Module({
  imports: [DigiformaModule, CacheModule, DirectusModule, CentresModule],
  controllers: [SyncController],
  providers: [SyncService]
})
export class SyncModule {}
