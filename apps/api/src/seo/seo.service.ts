import { Injectable } from '@nestjs/common'
import { CacheService } from '../common/cache/cache.service'
import { DirectusItemsClient } from '../directus/directus.items.client'

/**
 * Réponse de `GET /seo/resolve?path=` — le middleware serveur du front
 * l'interroge avant chaque rendu de page :
 * - `redirect` : la ligne `redirects` impose un 301 vers `to` ;
 * - `gone` : la page a été dépubliée/supprimée (410) ;
 * - `{type, id}` : l'adresse correspond à un contenu publié connu — le rendu
 *   normal continue. `type`/`id` null : adresse inconnue, la page gèrera
 *   son propre 404.
 */
export type SeoResolution =
  | { type: string | null; id: string | number | null }
  | { redirect: { to: string; status: 301 } }
  | { gone: true }

interface RedirectRow {
  status: string
  to_path: string | null
}

// Routes codées (pages/*.vue hors dynamiques) — résolues sans requête.
const STATIC_PATHS = new Set([
  '/',
  '/formations',
  '/actualites',
  '/centres',
  '/a-propos',
  '/entreprise',
  '/entreprise-reseau',
  '/parler-a-votre-conseiller',
  '/partenaire-reseau',
  '/referencer-mon-organisme',
  '/rejoindre-le-reseau',
  '/centres/demande-de-formation'
])

@Injectable()
export class SeoService {
  constructor(
    private readonly directus: DirectusItemsClient,
    private readonly cache: CacheService
  ) {}

  async resolve(rawPath: string): Promise<SeoResolution> {
    const path = normalizePath(rawPath)
    const cached = await this.cache.get<SeoResolution>(`seo:resolve:${path}`)
    if (cached) return cached

    const resolution = await this.resolveUncached(path)
    await this.cache.set(`seo:resolve:${path}`, resolution)
    return resolution
  }

  private async resolveUncached(path: string): Promise<SeoResolution> {
    const { data: rows } = await this.directus.readMany<RedirectRow>('redirects', {
      filter: { from_path: { _eq: path } },
      fields: ['status', 'to_path'],
      limit: 1
    })
    const row = rows[0]
    if (row?.status === '410') return { gone: true }
    if (row?.status === '301' && row.to_path) {
      return { redirect: { to: row.to_path, status: 301 } }
    }
    // Ligne invalide (301 sans cible) ou absente : on résout le contenu.

    const entity = await this.resolveEntity(path)
    return entity ?? { type: null, id: null }
  }

  // Gabarits d'URL publique : le premier motif qui colle gagne — un chemin
  // plus profond que le gabarit n'est jamais tenté.
  private async resolveEntity(path: string): Promise<{ type: string; id: string | number } | null> {
    if (STATIC_PATHS.has(path)) return { type: 'static', id: path }

    let match = /^\/formations\/([^/]+)\/([^/]+)$/.exec(path)
    if (match) {
      const [, famille, slug] = match
      // La famille de l'URL est vérifiée en filtre relationnel — une seule
      // requête au lieu de deux, et une adresse composée à la main (slug
      // valide sous une famille qui n'est pas la sienne) ne résout pas.
      const formation = await this.findOneWithFields<{ id: number }>(
        'formations',
        {
          slug: { _eq: slug },
          status: { _eq: 'published' },
          famille: { slug: { _eq: famille }, status: { _eq: 'published' } }
        },
        ['id']
      )
      return formation ? { type: 'formation', id: formation.id } : null
    }

    match = /^\/formations\/([^/]+)$/.exec(path)
    if (match) {
      return this.findOne('famille', 'familles_formation', {
        slug: { _eq: match[1] },
        status: { _eq: 'published' }
      })
    }

    match = /^\/actualites\/([^/]+)$/.exec(path)
    if (match) {
      return this.findOne('article', 'articles', {
        slug: { _eq: match[1] },
        status: { _eq: 'published' }
      })
    }

    match = /^\/centres\/([^/]+)$/.exec(path)
    if (match) {
      return this.findOne('centre', 'centres', {
        slug: { _eq: match[1] },
        status: { _eq: 'published' }
      })
    }

    match = /^\/([^/]+)$/.exec(path)
    if (match) {
      return this.findOne('page', 'pages_legales', {
        slug: { _eq: match[1] },
        status: { _eq: 'published' }
      })
    }

    return null
  }

  private async findOne(
    type: string,
    collection: string,
    filter: Record<string, unknown>
  ): Promise<{ type: string; id: string | number } | null> {
    const row = await this.findOneWithFields<{ id: string | number }>(collection, filter, ['id'])
    return row ? { type, id: row.id } : null
  }

  private async findOneWithFields<T extends Record<string, unknown>>(
    collection: string,
    filter: Record<string, unknown>,
    fields: string[]
  ): Promise<T | null> {
    const { data } = await this.directus.readMany<T>(collection, { filter, fields, limit: 1 })
    return data[0] ?? null
  }
}

// Même normalisation que le middleware : sans slash final, en minuscules —
// `from_path` est stocké sous cette forme, un double enregistrement
// /A/ vs /a serait une fuite.
function normalizePath(path: string): string {
  const clean = path.replace(/\/+$/, '').toLowerCase()
  return clean.startsWith('/') ? clean : `/${clean}`
}
