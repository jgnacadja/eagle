import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { ApiSecurity, ApiTags } from '@nestjs/swagger'
import { SkipThrottle } from '@nestjs/throttler'
import { AdminApiKeyGuard } from '../guards/admin-api-key.guard'
import { CacheService } from './cache.service'

// Clés catalogue purgées par collection Directus. Une écriture sur une
// collection non listée (articles, pages…) ne touche pas ces clés — la
// purge est ignorée plutôt que d'invalider inutilement. `courses:*` couvre
// list/detail/families/rows : ils dérivent tous de `formations:all`.
const COLLECTION_KEYS: Record<string, string[]> = {
  formations: ['formations:all', 'courses:*'],
  familles_formation: ['formations:all', 'courses:*'],
  sous_familles_formation: ['formations:all', 'courses:*'],
  centres: ['centres:*', 'formations:all', 'courses:*']
}

@ApiTags('admin')
@Controller('admin')
@UseGuards(AdminApiKeyGuard)
@ApiSecurity('x-api-key')
export class CacheController {
  constructor(private readonly cache: CacheService) {}

  // Appelé par le flow Directus « Invalidate site cache » à chaque écriture
  // (items.*) sur les collections de contenu. `{ collection }` ne purge que
  // les clés alimentées par cette collection ; sans body, purge complète
  // (fallback). Le throttle admin est levé : les écritures en masse (seed,
  // sync) déclenchent une rafale d'appels — une invalidation droppée par
  // un 429 laisserait des données périmées servies jusqu'au TTL.
  @Post('cache/invalidate')
  @SkipThrottle({ admin: true })
  async invalidate(
    @Body() body?: { collection?: string }
  ): Promise<{ success: boolean; purged: boolean }> {
    const collection = body?.collection
    if (collection && !(collection in COLLECTION_KEYS)) {
      return { success: true, purged: false }
    }
    if (collection) {
      await this.cache.invalidatePatterns(COLLECTION_KEYS[collection])
    } else {
      await this.cache.invalidateCatalog()
    }
    return { success: true, purged: true }
  }
}
