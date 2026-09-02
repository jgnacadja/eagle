import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { HealthController } from './health/health.controller'
import { PrismaModule } from './prisma/prisma.module'
import { DigiformaModule } from './digiforma/digiforma.module'
import { SyncModule } from './sync/sync.module'
import { CacheModule } from './common/cache/cache.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    PrismaModule,
    CacheModule,
    DigiformaModule,
    SyncModule
  ],
  controllers: [HealthController]
})
export class AppModule {}
