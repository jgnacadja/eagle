import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DirectusModule } from '../directus/directus.module'
import { SearchMissesController } from './search-misses.controller'
import { SearchMissesService } from './search-misses.service'

// Le cron de purge s'appuie sur SchedulerRegistry, fourni globalement par
// ScheduleModule.forRoot() (importé une seule fois dans SyncModule).
@Module({
  imports: [ConfigModule, DirectusModule],
  controllers: [SearchMissesController],
  providers: [SearchMissesService],
  exports: [SearchMissesService]
})
export class SearchMissesModule {}
