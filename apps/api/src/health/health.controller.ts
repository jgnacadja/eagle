import { Controller, Get } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Liveness probe — checks that the API is responding' })
  @ApiOkResponse({
    description: 'Service operational',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' }
      }
    }
  })
  check(): { status: string } {
    return { status: 'ok' }
  }
}
