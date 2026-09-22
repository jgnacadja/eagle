import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import {
  Equals,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min
} from 'class-validator'

const VOIES = ['centre', 'organisme', 'formateur'] as const

class LeadContextDto {
  @ApiPropertyOptional({ description: 'URL of the originating page (HubSpot attribution)' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  pageUri?: string

  @ApiPropertyOptional({ description: 'Name of the originating page' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  pageName?: string
}

export class NewsletterLeadDto extends LeadContextDto {
  @ApiProperty({ description: 'Professional email' })
  @IsEmail()
  @MaxLength(320)
  email!: string
}

export class DemandeLeadDto extends LeadContextDto {
  @ApiProperty({ description: 'Full name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  nom!: string

  @ApiProperty({ description: 'Professional email' })
  @IsEmail()
  @MaxLength(320)
  email!: string

  @ApiProperty({ description: 'Phone — at least 10 digits' })
  @IsString()
  @Matches(/^\D*(?:\d\D*){10,}$/, {
    message: 'Incomplete phone number — at least 10 digits expected.'
  })
  @MaxLength(30)
  telephone!: string

  @ApiProperty({ description: 'Company name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  raisonSociale!: string

  @ApiProperty({ description: 'SIRET — 14 digits, spaces allowed' })
  @Matches(/^\d{14}$/, { message: 'Invalid SIRET — 14 digits expected.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\s/g, '') : value))
  siret!: string

  @ApiProperty({ description: 'Job title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  fonction!: string

  @ApiProperty({ description: 'Number of employees to train', minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  salaries!: number

  @ApiProperty({ description: 'Desired timeframe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  echeance!: string

  @ApiPropertyOptional({ description: 'Additional details' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  precisions?: string

  @ApiProperty({ description: 'Consent to processing — must be accepted' })
  @IsBoolean()
  @Equals(true, { message: 'Consent is required to submit the request.' })
  consentement!: boolean

  @ApiPropertyOptional({ description: 'Requested center (context)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  centre?: string

  @ApiPropertyOptional({ description: 'Requested course (context)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  formation?: string

  @ApiPropertyOptional({ description: 'Requested session (context)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  session?: string

  @ApiPropertyOptional({ description: 'Subject passed by the network CTAs' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sujet?: string
}

export class CandidatureLeadDto extends LeadContextDto {
  @ApiProperty({ description: 'Application track', enum: VOIES })
  @IsIn(VOIES)
  voie!: (typeof VOIES)[number]

  @ApiProperty({ description: 'Full name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  nom!: string

  @ApiProperty({ description: 'Professional email' })
  @IsEmail()
  @MaxLength(320)
  email!: string

  @ApiProperty({ description: 'Phone — at least 10 digits' })
  @IsString()
  @Matches(/^\D*(?:\d\D*){10,}$/, {
    message: 'Incomplete phone number — at least 10 digits expected.'
  })
  @MaxLength(30)
  telephone!: string

  @ApiProperty({ description: 'Target city or territory' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  ville!: string

  @ApiProperty({ description: 'Background and project' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  parcours!: string

  @ApiProperty({ description: 'Consent to processing — must be accepted' })
  @IsBoolean()
  @Equals(true, { message: 'Consent is required to submit the application.' })
  consentement!: boolean
}
