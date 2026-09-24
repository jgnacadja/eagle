import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { toOptionalTrimmed } from '../common/utils/dto-transforms.util'

export class FallbackQueryDto {
  @ApiProperty({ description: 'Need expressed in natural language' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(500)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  q!: string

  @ApiPropertyOptional({ description: 'Location (city, department, region, postcode)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => toOptionalTrimmed(value))
  location?: string
}
