import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator'
import { Transform } from 'class-transformer'

function toOptionalTrimmed(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

function toPositiveInt(value: unknown, fallback: number): number {
  if (value === undefined || value === null || value === '') return fallback
  const parsed = Number(String(value))
  return Number.isInteger(parsed) ? parsed : Number.NaN
}

export class ListCoursesDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => toOptionalTrimmed(value))
  family?: string

  @IsOptional()
  @IsString()
  @Transform(({ value }) => toOptionalTrimmed(value))
  search?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => toPositiveInt(value, 1))
  page = 1

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => toPositiveInt(value, 20))
  limit = 20
}

export class FamilyCourseParams {
  @IsString()
  family!: string

  @IsString()
  slug!: string
}
