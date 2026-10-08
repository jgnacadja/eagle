import { Global, Module } from '@nestjs/common'
import { SourcesModule } from '../../sources/sources.module'
import { SourcesModule } from '../../sources/sources.module'
import { CacheController } from './cache.controller'
import { CacheService } from './cache.service'

@Global()
@Module({
  imports: [SourcesModule],
  controllers: [CacheController],
  providers: [CacheService],
  exports: [CacheService]
})
export class CacheModule {}
