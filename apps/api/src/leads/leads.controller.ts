import { Body, Controller, Post } from '@nestjs/common'
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
  CandidatureLeadDto,
  ConseillerLeadDto,
  DemandeLeadDto,
  NewsletterLeadDto
} from './leads.dto'
import { LeadsService } from './leads.service'

@ApiTags('Leads')
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post('newsletter')
  @ApiOperation({ summary: 'Submit a newsletter subscription to HubSpot' })
  @ApiCreatedResponse({ description: 'Submission forwarded to HubSpot Forms' })
  newsletter(@Body() dto: NewsletterLeadDto): Promise<{ submitted: true }> {
    return this.leadsService.submitNewsletter(dto)
  }

  @Post('demande')
  @ApiOperation({ summary: 'Submit a training request to HubSpot' })
  @ApiCreatedResponse({ description: 'Submission forwarded to HubSpot Forms' })
  demande(@Body() dto: DemandeLeadDto): Promise<{ submitted: true }> {
    return this.leadsService.submitDemande(dto)
  }

  @Post('candidature')
  @ApiOperation({ summary: 'Submit a network application to HubSpot' })
  @ApiCreatedResponse({ description: 'Submission forwarded to HubSpot Forms' })
  candidature(@Body() dto: CandidatureLeadDto): Promise<{ submitted: true }> {
    return this.leadsService.submitCandidature(dto)
  }

  @Post('conseiller')
  @ApiOperation({ summary: 'Submit an advisor contact request to HubSpot' })
  @ApiCreatedResponse({ description: 'Submission forwarded to HubSpot Forms' })
  conseiller(@Body() dto: ConseillerLeadDto): Promise<{ submitted: true }> {
    return this.leadsService.submitConseiller(dto)
  }
}
