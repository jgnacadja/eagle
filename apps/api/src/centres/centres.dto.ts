import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsLatitude, IsLongitude, IsOptional, IsString, MaxLength } from 'class-validator'
import { Transform, Type } from 'class-transformer'

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

export class ReverseGeocodeDto {
  @ApiProperty({ description: 'Latitude GPS (WGS84)' })
  @Type(() => Number)
  @IsLatitude()
  lat!: number

  @ApiProperty({ description: 'Longitude GPS (WGS84)' })
  @Type(() => Number)
  @IsLongitude()
  lng!: number
}
