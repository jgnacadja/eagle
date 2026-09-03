import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { SyncController } from './sync.controller'
import { SyncService } from './sync.service'
import { DigiformaModule } from '../digiforma/digiforma.module'
import { PrismaModule } from '../prisma/prisma.module'
import { CacheModule } from '../common/cache/cache.module'

@Module({
  imports: [ScheduleModule.forRoot(), DigiformaModule, PrismaModule, CacheModule],
  controllers: [SyncController],
  providers: [SyncService]
})
export class SyncModule {}
