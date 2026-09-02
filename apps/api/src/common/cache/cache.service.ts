import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name)
  private readonly client: Redis
  private currentVersion = 0

  constructor(config: ConfigService) {
    const url = config.getOrThrow<string>('REDIS_URL')
    this.client = new Redis(url, { maxRetriesPerRequest: 3 })
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit()
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(this.key(key))
    if (!value) return null
    return JSON.parse(value) as T
  }

  async set<T>(key: string, value: T, ttlSeconds = 3600): Promise<void> {
    const serialized = JSON.stringify(value)
    await this.client.setex(this.key(key), ttlSeconds, serialized)
  }

  async del(pattern: string): Promise<void> {
    const keys = await this.client.keys(this.key(pattern))
    if (keys.length > 0) {
      await this.client.del(...keys)
    }
  }

  async invalidateCatalog(): Promise<void> {
    this.currentVersion += 1
    await this.del('catalog:*')
    this.logger.log(`Cache catalogue invalidé, nouvelle version v${this.currentVersion}`)
  }

  key(path: string): string {
    return `catalog:v${this.currentVersion}:${path}`
  }
}
