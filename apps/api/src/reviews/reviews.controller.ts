import { Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common'
import { ApiSecurity, ApiTags } from '@nestjs/swagger'
import { AdminApiKeyGuard } from '../common/guards/admin-api-key.guard'
import { ReviewsService } from './reviews.service'

@ApiTags('admin')
@Controller('admin')
@UseGuards(AdminApiKeyGuard)
@ApiSecurity('x-api-key')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // 202 immédiat, comme /admin/sync : le run part en tâche de fond
  // (waitUntil) et se suit via GET /admin/sync-reviews/status.
  @Post('sync-reviews')
  @HttpCode(HttpStatus.ACCEPTED)
  async trigger(): Promise<{ started: boolean }> {
    return { started: await this.reviewsService.trigger() }
  }

  @Get('sync-reviews/status')
  async status(): Promise<{ latest: Awaited<ReturnType<ReviewsService['getLatestRun']>> }> {
    const latest = await this.reviewsService.getLatestRun()
    return { latest }
  }
}
