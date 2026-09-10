import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, MaxLength } from 'class-validator'
import { Transform } from 'class-transformer'

function toOptionalTrimmed(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

export class ListCentresDto {
  @ApiPropertyOptional({ description: 'Filter by department (exact or departments_covered)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => toOptionalTrimmed(value))
  department?: string

  @ApiPropertyOptional({ description: 'Search on name, city, postal code, address, specialties' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => toOptionalTrimmed(value))
  search?: string
}
