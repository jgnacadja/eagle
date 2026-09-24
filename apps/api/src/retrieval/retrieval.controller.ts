import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger'
import { AdminApiKeyGuard } from '../common/guards/admin-api-key.guard'
import { CatalogIndexService } from './catalog-index.service'
import { RetrievalSearchDto } from './retrieval.dto'
import { RetrievalService } from './retrieval.service'
import type { RetrievalIndexInfo, RetrievalResult } from './retrieval.types'

/**
 * Outillage admin du retrieval : état de l'index, reconstruction forcée et
 * recherche de test (jeu de requêtes de pertinence). Le moteur IA consomme
 * `RetrievalService` en interne — pas d'endpoint public ici.
 */
@ApiTags('admin')
@Controller('admin/retrieval')
@UseGuards(AdminApiKeyGuard)
@ApiSecurity('x-api-key')
export class RetrievalController {
  constructor(
    private readonly retrieval: RetrievalService,
    private readonly catalogIndex: CatalogIndexService
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Retrieval index status' })
  @ApiOkResponse({ description: 'Version, build date, provider and size of the index' })
  async status(): Promise<RetrievalIndexInfo> {
    await this.catalogIndex.getIndex()
    return this.catalogIndex.info
  }

  @Post('reindex')
  @ApiOperation({ summary: 'Rebuild the retrieval index from the published catalogue' })
  @ApiOkResponse({ description: 'Index rebuilt' })
  async reindex(): Promise<RetrievalIndexInfo> {
    const index = await this.catalogIndex.rebuild()
    return index.info
  }

  @Get('search')
  @ApiOperation({ summary: 'Hybrid search (lexical + semantic) over published courses' })
  @ApiOkResponse({ description: 'Ranked candidates with scores and matched terms' })
  search(@Query() query: RetrievalSearchDto): Promise<RetrievalResult> {
    return this.retrieval.search({
      text: query.q,
      limit: query.limit,
      family: query.family,
      modalities: query.modalities
        ?.split(',')
        .map((m) => m.trim())
        .filter(Boolean),
      location: query.location
    })
  }
}
