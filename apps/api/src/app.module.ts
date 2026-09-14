import { ExecutionContext, Logger, Module, OnModuleDestroy } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ThrottlerGuard, ThrottlerModule, ThrottlerStorage } from '@nestjs/throttler'
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis'
import Redis, { RedisOptions } from 'ioredis'
import { scryptSync } from 'node:crypto'
import { HealthController } from './health/health.controller'
import { DigiformaModule } from './digiforma/digiforma.module'
import { SyncModule } from './sync/sync.module'
import { CatalogModule } from './catalog/catalog.module'
import { CentresModule } from './centres/centres.module'
import { CacheModule } from './common/cache/cache.module'
import { DirectusModule } from './directus/directus.module'

function isAdminRoute(context: ExecutionContext): boolean {
  const request = context.switchToHttp().getRequest<{ originalUrl?: string }>()
  const url = request.originalUrl ?? ''
  return url === '/admin' || url.startsWith('/admin/')
}

const THROTTLER_REDIS_OPTIONS: RedisOptions = {
  connectTimeout: 1_000,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 0,
  retryStrategy: () => null
}

type ThrottlerStorageRecord = Awaited<ReturnType<ThrottlerStorage['increment']>>

export class FailSafeThrottlerStorage implements ThrottlerStorage {
  private readonly logger = new Logger(FailSafeThrottlerStorage.name)
  private disabled = false

  constructor(private readonly inner: ThrottlerStorage) {}

  async increment(
    ...args: Parameters<ThrottlerStorage['increment']>
  ): Promise<ThrottlerStorageRecord> {
    if (this.disabled) {
      return { totalHits: 0, timeToExpire: 0, isBlocked: false, timeToBlockExpire: 0 }
    }

    try {
      return await this.inner.increment(...args)
    } catch (error) {
      this.disabled = true
      this.logger.warn(error, 'Redis throttler unavailable — rate limiting disabled')
      return { totalHits: 0, timeToExpire: 0, isBlocked: false, timeToBlockExpire: 0 }
    }
  }
}

let throttlerRedis: Redis | undefined

function createRedisThrottlerStorage(url: string): ThrottlerStorage {
  throttlerRedis = new Redis(url, THROTTLER_REDIS_OPTIONS)
  throttlerRedis.on('error', () => {
    // silencieux : le wrapper FailSafeThrottlerStorage dégrade proprement
  })
  return new FailSafeThrottlerStorage(new ThrottlerStorageRedisService(throttlerRedis))
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const adminApiKey = config.getOrThrow<string>('ADMIN_API_KEY')
        const redisUrl = config.get<string>('REDIS_URL')
        return {
          throttlers: [
            {
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
              getTracker: (req) => {
                const key = req.headers?.['x-api-key']
                const raw = Array.isArray(key) ? key[0] : key
                return typeof raw === 'string' && raw.length > 0
                  ? scryptSync(raw, adminApiKey, 32).toString('hex')
                  : 'anonymous'
              }
            }
          ],
          storage: redisUrl ? createRedisThrottlerStorage(redisUrl) : undefined
        }
      }
    }),
    CacheModule,
    DigiformaModule,
    SyncModule,
    CatalogModule,
    CentresModule,
    DirectusModule
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ]
})
export class AppModule implements OnModuleDestroy {
  async onModuleDestroy(): Promise<void> {
    await throttlerRedis?.quit().catch(() => undefined)
  }
}
