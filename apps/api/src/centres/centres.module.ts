import { Module } from '@nestjs/common'
import { CacheModule } from '../common/cache/cache.module'
import { DirectusModule } from '../directus/directus.module'
import { CentresController } from './centres.controller'
import { CentresService } from './centres.service'
import { GeocodingService } from './geocoding.service'

@Module({
  imports: [CacheModule, DirectusModule],
  controllers: [CentresController],
  providers: [CentresService, GeocodingService],
  exports: [GeocodingService]
})
export class CentresModule {}
