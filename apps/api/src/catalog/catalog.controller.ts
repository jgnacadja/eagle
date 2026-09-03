import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common'
import type { Course, CourseListItem, Paginated } from '@learnup/types'
import { CatalogService } from './catalog.service'
import { FamilyCourseParams, ListCoursesDto } from './catalog.dto'

@Controller('courses')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) { }

  @Get()
  async list(@Query() query: ListCoursesDto): Promise<Paginated<CourseListItem>> {
    return this.catalogService.list(query)
  }

  @Get(':family/:slug')
  async byFamilyAndSlug(@Param() params: FamilyCourseParams): Promise<Course> {
    const course = await this.catalogService.findBySlug(params.slug, params.family)
    if (!course) {
      throw new NotFoundException('Course not found')
    }
    return course
  }
}
