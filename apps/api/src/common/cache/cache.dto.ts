import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsOptional, IsString, MaxLength } from 'class-validator'

export class InvalidateCacheDto {
  @ApiPropertyOptional({ description: 'Directus collection whose cache keys must be purged' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() || undefined : undefined))
  collection?: string
}
