import { Controller, Get, Query } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import type { CentreListItem } from '@learnup/types'
import { ListCentresDto } from './centres.dto'
import { CentresService } from './centres.service'

@ApiTags('Centres')
@Controller()
export class CentresController {
  constructor(private readonly centresService: CentresService) {}

  @Get('centres')
  @ApiOperation({ summary: 'List of published centres' })
  @ApiOkResponse({ description: 'Filtered list of centres' })
  async list(@Query() query: ListCentresDto): Promise<CentreListItem[]> {
    return this.centresService.list(query)
  }

  @Get('centres/departments')
  @ApiOperation({ summary: 'All department values covered by centres' })
  @ApiOkResponse({ description: 'Sorted list of departments' })
  async departments(): Promise<string[]> {
    return this.centresService.departments()
  }
}
