import { Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common'
import { ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger'
import { AdminApiKeyGuard } from '../common/guards/admin-api-key.guard'
import { TriggerSyncQueryDto } from './sync.dto'
import { SyncService, type TriggerResult } from './sync.service'

@ApiTags('admin')
@Controller('admin')
@UseGuards(AdminApiKeyGuard)
@ApiSecurity('x-api-key')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  // 202 immédiat : la sync (Digiforma + upserts + géocodage) dépasse le
  // budget d'une requête serverless — elle tourne en tâche de fond et le
  // suivi (compteurs finaux par source) passe par GET /admin/sync/status.
  // `?source={code}` ne synchronise qu'une source : 404 si le code est
  // inconnu, 409 si elle est inactive ou déjà en cours de sync.
  @Post('sync')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiResponse({ status: 404, description: 'Unknown source code' })
  @ApiResponse({ status: 409, description: 'Source inactive or sync already running for it' })
  async trigger(@Query() query: TriggerSyncQueryDto): Promise<TriggerResult> {
    return this.syncService.trigger({ sourceCode: query.source })
  }

  @Get('sync/status')
  async status(): Promise<{
    latest: Awaited<ReturnType<SyncService['getLatestRun']>>
    runs: Awaited<ReturnType<SyncService['getRunsBySource']>>
  }> {
    const [latest, runs] = await Promise.all([
      this.syncService.getLatestRun(),
      this.syncService.getRunsBySource()
    ])
    return { latest, runs }
  }
}
