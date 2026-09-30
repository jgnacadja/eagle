import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'
import { toOptionalTrimmed, toPositiveInt } from '../common/utils/dto-transforms.util'

export class RetrievalSearchDto {
  @ApiProperty({ description: 'Need expressed in natural language' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  q!: string

  @ApiPropertyOptional({ description: 'Number of candidates', default: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  @Transform(({ value }) => toPositiveInt(value, 5))
  limit = 5

  @ApiPropertyOptional({ description: 'Family slug filter' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => toOptionalTrimmed(value))
  family?: string

  @ApiPropertyOptional({ description: 'Modalities filter (comma-separated)' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => toOptionalTrimmed(value))
  modalities?: string

  @ApiPropertyOptional({ description: 'Location filter (city, department, region, postcode)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => toOptionalTrimmed(value))
  location?: string
}
