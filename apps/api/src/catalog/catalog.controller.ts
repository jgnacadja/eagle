import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common'
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags
} from '@nestjs/swagger'
import type { Course, CourseListItem, FamilyWithCount, Paginated } from '@learnup/types'
import { CatalogService } from './catalog.service'
import { FamilyCourseParams, ListCoursesDto } from './catalog.dto'

@ApiTags('Catalog')
@Controller()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('courses')
  @ApiOperation({ summary: 'Paginated list of courses' })
  @ApiOkResponse({ description: 'Paginated list of courses' })
  async list(@Query() query: ListCoursesDto): Promise<Paginated<CourseListItem>> {
    return this.catalogService.list(query)
  }

  @Get('courses/:family/:slug')
  @ApiOperation({ summary: 'Course details' })
  @ApiParam({ name: 'family', description: 'Family slug' })
  @ApiParam({ name: 'slug', description: 'Course slug' })
  @ApiOkResponse({ description: 'Course found' })
  @ApiNotFoundResponse({ description: 'Course not found' })
  async byFamilyAndSlug(@Param() params: FamilyCourseParams): Promise<Course> {
    const course = await this.catalogService.findBySlug(params.slug, params.family)
    if (!course) {
      throw new NotFoundException('Course not found')
    }
    return course
  }

  @Get('families')
  @ApiOperation({ summary: 'Families with course counts' })
  @ApiOkResponse({ description: 'Families with course counts' })
  async families(): Promise<FamilyWithCount[]> {
    return this.catalogService.families()
  }
}
