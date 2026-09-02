import { Controller, Get, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { AdminApiKeyGuard } from '../common/guards/admin-api-key.guard'
import { SyncService } from './sync.service'

@ApiTags('admin')
@Controller('admin')
@UseGuards(AdminApiKeyGuard)
@ApiBearerAuth('x-api-key')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('sync')
  async trigger(): Promise<{ success: boolean }> {
    await this.syncService.run()
    return { success: true }
  }

  @Get('sync/status')
  async status(): Promise<{ latest: Awaited<ReturnType<SyncService['getLatestRun']>> }> {
    const latest = await this.syncService.getLatestRun()
    return { latest }
  }
}
