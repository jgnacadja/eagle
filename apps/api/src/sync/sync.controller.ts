import { Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common'
import { ApiSecurity, ApiTags } from '@nestjs/swagger'
import { AdminApiKeyGuard } from '../common/guards/admin-api-key.guard'
import { SyncService } from './sync.service'

@ApiTags('admin')
@Controller('admin')
@UseGuards(AdminApiKeyGuard)
@ApiSecurity('x-api-key')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  // 202 immédiat : la sync (Digiforma + upserts + géocodage) dépasse le
  // budget d'une requête serverless — elle tourne en tâche de fond et le
  // suivi passe par GET /admin/sync/status.
  @Post('sync')
  @HttpCode(HttpStatus.ACCEPTED)
  async trigger(): Promise<{ started: boolean }> {
    return { started: await this.syncService.trigger() }
  }

  @Get('sync/status')
  async status(): Promise<{ latest: Awaited<ReturnType<SyncService['getLatestRun']>> }> {
    const latest = await this.syncService.getLatestRun()
    return { latest }
  }
}
