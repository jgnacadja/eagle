import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DirectusModule } from '../directus/directus.module'
import { SourcesService } from './sources.service'

@Module({
  imports: [ConfigModule, DirectusModule],
  providers: [SourcesService],
  exports: [SourcesService]
})
export class SourcesModule {}
