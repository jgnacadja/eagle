import { Module } from '@nestjs/common'
import { DigiformaClientFactory } from './digiforma-client.factory'

@Module({
  providers: [DigiformaClientFactory],
  exports: [DigiformaClientFactory]
})
export class DigiformaModule {}
