import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DirectusMirrorService } from './directus.mirror.service'

@Module({
  imports: [ConfigModule],
  providers: [DirectusMirrorService],
  exports: [DirectusMirrorService]
})
export class DirectusModule {}
