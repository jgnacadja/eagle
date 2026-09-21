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
  @ApiPropertyOptional({ description: 'URL de la page d’origine (attribution HubSpot)' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  pageUri?: string

  @ApiPropertyOptional({ description: 'Nom de la page d’origine' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  pageName?: string
}

export class NewsletterLeadDto extends LeadContextDto {
  @ApiProperty({ description: 'E-mail professionnel' })
  @IsEmail()
  @MaxLength(320)
  email!: string
}

export class DemandeLeadDto extends LeadContextDto {
  @ApiProperty({ description: 'Nom et prénom' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  nom!: string

  @ApiProperty({ description: 'E-mail professionnel' })
  @IsEmail()
  @MaxLength(320)
  email!: string

  @ApiProperty({ description: 'Téléphone — au moins 10 chiffres' })
  @IsString()
  @Matches(/^\D*(?:\d\D*){10,}$/, { message: 'Numéro incomplet — 10 chiffres attendus.' })
  @MaxLength(30)
  telephone!: string

  @ApiProperty({ description: 'Raison sociale' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  raisonSociale!: string

  @ApiProperty({ description: 'SIRET — 14 chiffres, espaces tolérés' })
  @Matches(/^\d{14}$/, { message: 'SIRET invalide — 14 chiffres attendus.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\s/g, '') : value))
  siret!: string

  @ApiProperty({ description: 'Fonction' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  fonction!: string

  @ApiProperty({ description: 'Nombre de salariés à former', minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  salaries!: number

  @ApiProperty({ description: 'Échéance souhaitée' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  echeance!: string

  @ApiPropertyOptional({ description: 'Précisions' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  precisions?: string

  @ApiProperty({ description: 'Consentement au traitement — doit être accepté' })
  @IsBoolean()
  @Equals(true, { message: 'Consentement requis pour envoyer la demande.' })
  consentement!: boolean

  @ApiPropertyOptional({ description: 'Centre demandé (contexte)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  centre?: string

  @ApiPropertyOptional({ description: 'Formation demandée (contexte)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  formation?: string

  @ApiPropertyOptional({ description: 'Session demandée (contexte)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  session?: string

  @ApiPropertyOptional({ description: 'Sujet transmis par les CTA réseau' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sujet?: string
}

export class CandidatureLeadDto extends LeadContextDto {
  @ApiProperty({ description: 'Voie de candidature', enum: VOIES })
  @IsIn(VOIES)
  voie!: (typeof VOIES)[number]

  @ApiProperty({ description: 'Nom et prénom' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  nom!: string

  @ApiProperty({ description: 'E-mail professionnel' })
  @IsEmail()
  @MaxLength(320)
  email!: string

  @ApiProperty({ description: 'Téléphone — au moins 10 chiffres' })
  @IsString()
  @Matches(/^\D*(?:\d\D*){10,}$/, { message: 'Numéro incomplet — 10 chiffres attendus.' })
  @MaxLength(30)
  telephone!: string

  @ApiProperty({ description: 'Ville ou territoire visé' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  ville!: string

  @ApiProperty({ description: 'Parcours et projet' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  parcours!: string

  @ApiProperty({ description: 'Consentement au traitement — doit être accepté' })
  @IsBoolean()
  @Equals(true, { message: 'Consentement requis pour envoyer la candidature.' })
  consentement!: boolean
}
