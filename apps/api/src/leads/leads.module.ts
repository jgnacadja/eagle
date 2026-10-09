import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DirectusModule } from '../directus/directus.module'
import { SourcesModule } from '../sources/sources.module'
import { HubspotTargetResolver } from './hubspot-target.resolver'
import { LeadsController } from './leads.controller'
import { LeadsService } from './leads.service'

@Module({
  imports: [ConfigModule, DirectusModule, SourcesModule],
  controllers: [LeadsController],
  providers: [LeadsService, HubspotTargetResolver]
})
export class LeadsModule {}
