import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger'
import type { CentreListItem } from '@learnup/types'
import { AdminApiKeyGuard } from '../common/guards/admin-api-key.guard'
import { ListCentresDto, ReverseGeocodeDto } from './centres.dto'
import { CentresService } from './centres.service'
import { GeocodingService, type ReverseGeocodedLocation } from './geocoding.service'

@ApiTags('Centres')
@Controller()
export class CentresController {
  constructor(
    private readonly centresService: CentresService,
    private readonly geocoding: GeocodingService
  ) { }

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

  @Get('centres/reverse')
  @ApiOperation({ summary: 'Reverse geocode GPS coordinates to city/department (BAN)' })
  @ApiOkResponse({ description: 'Resolved location, null fields when unresolved' })
  async reverse(@Query() query: ReverseGeocodeDto): Promise<ReverseGeocodedLocation> {
    return this.geocoding.reverseGeocode(query.lat, query.lng)
  }

  @Get('centres/count')
  @ApiOperation({ summary: 'Total number of published centres' })
  @ApiOkResponse({ description: 'Centre count' })
  async count(): Promise<{ count: number }> {
    return { count: await this.centresService.count() }
  }

  @Post('admin/centres/geocode')
  @UseGuards(AdminApiKeyGuard)
  @ApiTags('admin')
  @ApiSecurity('x-api-key')
  @ApiOperation({ summary: 'Geocode centres whose address changed (BAN)' })
  async geocode(): Promise<{ geocoded: number; failed: number }> {
    return this.geocoding.syncMissing({ force: true })
  }
}
