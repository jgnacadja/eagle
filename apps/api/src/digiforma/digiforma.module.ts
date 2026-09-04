import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DigiformaClient } from './digiforma.client'

@Module({
  imports: [ConfigModule],
  providers: [DigiformaClient],
  exports: [DigiformaClient]
})
export class DigiformaModule {}
