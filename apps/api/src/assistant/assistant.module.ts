import { Module } from '@nestjs/common'
import { CatalogModule } from '../catalog/catalog.module'
import { AssistantController } from './assistant.controller'
import { AssistantModelClient } from './assistant.client'
import { AssistantService } from './assistant.service'

@Module({
  imports: [CatalogModule],
  controllers: [AssistantController],
  providers: [AssistantService, AssistantModelClient]
})
export class AssistantModule {}
