import { Controller, Get, Query } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { SeoResolveDto } from './seo.dto'
import { SeoService, type SeoResolution } from './seo.service'

@ApiTags('seo')
@Controller('seo')
export class SeoController {
  constructor(private readonly seo: SeoService) {}

  // Interrogé par le middleware serveur du front avant chaque rendu :
  // redirections (301), suppressions (410) et résolution du contenu
  // servi à l'adresse demandée.
  @Get('resolve')
  @ApiOperation({ summary: 'Resolve a public path to content, redirect or gone' })
  @ApiOkResponse({ description: '{type,id} | {redirect:{to,status}} | {gone:true}' })
  resolve(@Query() query: SeoResolveDto): Promise<SeoResolution> {
    return this.seo.resolve(query.path)
  }
}
