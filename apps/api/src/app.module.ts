import { ExecutionContext, Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis'
import { HealthController } from './health/health.controller'
import { PrismaModule } from './prisma/prisma.module'
import { DigiformaModule } from './digiforma/digiforma.module'
import { SyncModule } from './sync/sync.module'
import { CacheModule } from './common/cache/cache.module'

function isAdminRoute(context: ExecutionContext): boolean {
  const request = context.switchToHttp().getRequest<{ originalUrl?: string }>()
  return request.originalUrl?.startsWith('/admin') ?? false
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'public',
            ttl: 60_000,
            limit: 100,
            skipIf: (context) => isAdminRoute(context),
            getTracker: (req) => req.ip ?? req.socket?.remoteAddress ?? 'anonymous'
          },
          {
            name: 'admin',
            ttl: 60_000,
            limit: 10,
            skipIf: (context) => !isAdminRoute(context),
            getTracker: (req) => req.headers?.['x-api-key'] ?? 'anonymous'
          }
        ],
        storage: new ThrottlerStorageRedisService(config.getOrThrow<string>('REDIS_URL'))
      })
    }),
    PrismaModule,
    CacheModule,
    DigiformaModule,
    SyncModule
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ]
})
export class AppModule {}
