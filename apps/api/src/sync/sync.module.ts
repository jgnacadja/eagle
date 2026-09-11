import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { SyncController } from './sync.controller'
import { SyncService } from './sync.service'
import { DigiformaModule } from '../digiforma/digiforma.module'
import { CacheModule } from '../common/cache/cache.module'
import { DirectusModule } from '../directus/directus.module'

@Module({
  imports: [ScheduleModule.forRoot(), DigiformaModule, CacheModule, DirectusModule],
  controllers: [SyncController],
  providers: [SyncService]
})
export class SyncModule {}
