import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator'
import { Transform } from 'class-transformer'

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

function toOptionalTrimmed(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

function toPositiveInt(value: unknown, fallback: number): number {
  if (value === undefined || value === null || value === '') return fallback
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : Number.NaN
}

function toOptionalInt(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const parsed = Number(value)
  if (Number.isNaN(parsed) || !Number.isInteger(parsed)) {
    return Number.NaN
  }
  return parsed
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

function toOptionalBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const lowered = value.toLowerCase().trim()
    if (['true', '1', 'yes'].includes(lowered)) return true
    if (['false', '0', 'no'].includes(lowered)) return false
  }
  // Return the raw value so @IsBoolean rejects it with a 400.
  return value as unknown as boolean
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

  @ApiPropertyOptional({ enum: CourseSortField, description: 'Sort field' })
  @IsOptional()
  @IsEnum(CourseSortField)
  @Transform(({ value }) => toOptionalTrimmed(value)?.toLowerCase() as CourseSortField | undefined)
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
