import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator'

export class TriggerSyncQueryDto {
  @ApiPropertyOptional({
    description: 'Code of the source to synchronize (all active sources when omitted)'
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Matches(/^[a-z0-9][a-z0-9_-]*$/, { message: 'source must be a lowercase slug' })
  source?: string
}
