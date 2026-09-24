import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator'
import { Transform } from 'class-transformer'
import {
  toOptionalBoolean,
  toOptionalInt,
  toOptionalNumber,
  toOptionalTrimmed,
  toPositiveInt
} from '../common/utils/dto-transforms.util'

export enum CourseSortField {
  updatedAt = 'updatedAt',
  duration = 'duration',
  price = 'price',
  name = 'name',
  relevance = 'relevance'
}

export enum CourseSortOrder {
  asc = 'asc',
  desc = 'desc'
}

export enum CourseAvailability {
  thisMonth = 'success',
  scheduled = 'warning',
  onDemand = 'neutral'
}

function toLowerSortOrder(value: unknown): CourseSortOrder | undefined {
  const raw = toOptionalTrimmed(value)
  return raw ? (raw.toLowerCase() as CourseSortOrder) : undefined
}

export class ListCoursesDto {
  @ApiPropertyOptional({ description: 'Filter by family slug' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => toOptionalTrimmed(value))
  family?: string

  @ApiPropertyOptional({ description: 'Filter by sub-family slug' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => toOptionalTrimmed(value))
  subFamily?: string

  @ApiPropertyOptional({ description: 'Full-text search on title and description' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => toOptionalTrimmed(value))
  search?: string

  @ApiPropertyOptional({ description: 'CPF filter' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => toOptionalBoolean(value))
  cpf?: boolean

  @ApiPropertyOptional({ description: 'Certifying course filter' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => toOptionalBoolean(value))
  certifying?: boolean

  @ApiPropertyOptional({ description: 'Minimum duration in hours' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => toOptionalInt(value))
  durationMin?: number

  @ApiPropertyOptional({ description: 'Maximum duration in hours' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => toOptionalInt(value))
  durationMax?: number

  @ApiPropertyOptional({
    description: 'Duration buckets filter (comma-separated: courte, moyenne, longue)'
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => toOptionalTrimmed(value))
  durations?: string

  @ApiPropertyOptional({ description: 'Minimum price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => toOptionalNumber(value))
  priceMin?: number

  @ApiPropertyOptional({ description: 'Maximum price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => toOptionalNumber(value))
  priceMax?: number

  @ApiPropertyOptional({ description: 'Filter by center slug' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => toOptionalTrimmed(value))
  center?: string

  @ApiPropertyOptional({ description: 'Modalities filter (comma-separated)' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => toOptionalTrimmed(value))
  modalities?: string

  @ApiPropertyOptional({ description: 'Location filter (city, department or region)' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => toOptionalTrimmed(value))
  location?: string

  @ApiPropertyOptional({
    enum: CourseAvailability,
    description:
      'Availability filter: success = session this month, warning = upcoming session, neutral = on demand'
  })
  @IsOptional()
  @IsEnum(CourseAvailability)
  @Transform(({ value }) => toOptionalTrimmed(value) as CourseAvailability | undefined)
  availability?: CourseAvailability

  @ApiPropertyOptional({ enum: CourseSortField, description: 'Sort field' })
  @IsOptional()
  @IsEnum(CourseSortField)
  @Transform(({ value }) => toOptionalTrimmed(value) as CourseSortField | undefined)
  sort?: CourseSortField

  @ApiPropertyOptional({ enum: CourseSortOrder, description: 'Sort order' })
  @IsOptional()
  @IsEnum(CourseSortOrder)
  @Transform(({ value }) => toLowerSortOrder(value))
  order?: CourseSortOrder

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => toPositiveInt(value, 1))
  page = 1

  @ApiPropertyOptional({ description: 'Number of results per page', default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => toPositiveInt(value, 20))
  limit = 20
}

export class FamilyCourseParams {
  @ApiProperty({ description: 'Family slug' })
  @IsString()
  family!: string

  @ApiProperty({ description: 'Course slug' })
  @IsString()
  slug!: string
}
