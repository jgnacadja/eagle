import {
  All,
  BadGatewayException,
  BadRequestException,
  Controller,
  Logger,
  MethodNotAllowedException,
  NotFoundException,
  Req,
  Res,
  ServiceUnavailableException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { Request, Response } from 'express'
import { Readable } from 'node:stream'

/**
 * Collections Directus autorisées pour le front en lecture via le proxy.
 * Pas d'endpoints d'administration ni de collections système.
 */
const ALLOWED_ITEM_COLLECTIONS = new Set([
  'articles',
  'avis',
  'centres',
  'familles_formation',
  'sous_familles_formation',
  'formations',
  'pages_legales'
])
const UPSTREAM_TIMEOUT_MS = 10_000

// Liste blanche des paramètres relayés à Directus : le rôle Public filtre
// les champs lus, mais pas la forme de la requête — `deep`, `search`,
// `meta` ou des expansions `fields=*.*.*` produiraient des requêtes SQL
// coûteuses et des réponses non bornées (sessions/blocks JSON). Le front
// n'émet que ceux-ci via le SDK (`aggregate`/`groupBy` servent aux facettes
// d'/actualites — réponse bornée par construction).
const ALLOWED_QUERY_PARAMS = new Set([
  'fields',
  'filter',
  'sort',
  'limit',
  'offset',
  'page',
  'aggregate',
  'groupBy'
])
const MAX_LIMIT = 100

// `limit` est plafonnée : `limit=-1` (et toute valeur non positive ou non
// entière) est refusée, au-delà du plafond on clampe — un appelant ne doit
// jamais obtenir une collection entière en une seule requête.
function sanitizeQueryParams(searchParams: URLSearchParams): URLSearchParams {
  const sanitized = new URLSearchParams()
  for (const [name, value] of searchParams) {
    const base = name.split('[')[0]!
    if (!ALLOWED_QUERY_PARAMS.has(base)) {
      throw new BadRequestException(`Paramètre Directus non autorisé : ${base}`)
    }
    if (base === 'limit') {
      const limit = Number(value)
      if (!Number.isInteger(limit) || limit <= 0) {
        throw new BadRequestException('limit doit être un entier strictement positif')
      }
      sanitized.append(name, String(Math.min(limit, MAX_LIMIT)))
      continue
    }
    if (base === 'fields' && value.includes('*')) {
      throw new BadRequestException("L'expansion wildcard (*) de fields est interdite")
    }
    sanitized.append(name, value)
  }
  return sanitized
}

function isAllowedPath(pathname: string): boolean {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length < 2) return false

  // assets/<id> — l'UUID est validé côté Directus, on s'assure juste qu'il y a un segment.
  if (segments[0] === 'assets') {
    return segments[1]!.length > 0 && !segments[1]!.includes('..')
  }

  // items/<collection> — on restreint explicitement pour limiter la surface d'attaque.
  if (segments[0] === 'items') {
    return ALLOWED_ITEM_COLLECTIONS.has(segments[1]!)
  }

  return false
}

/**
 * Proxy générique vers Directus : le front ne connaît pas Directus, toutes
 * ses requêtes passent par l'API. Aucun endpoint par collection : la route
 * catch-all transfère méthode, chemin et query tels quels (le SDK Directus
 * côté front reste utilisable tel quel).
 *
 * Les requêtes sont relayées SANS token : elles tombent sous le rôle Public
 * de Directus (lecture seule, status `published`, champs restreints — voir
 * directus/schema/roles.mjs). Injecter le token de service exposerait les
 * brouillons et les champs internes (formations.raw, contacts internes…).
 */
@Controller('directus')
export class DirectusProxyController {
  private readonly logger = new Logger(DirectusProxyController.name)
  private readonly baseUrl: string

  constructor(config: ConfigService) {
    this.baseUrl = config.get<string>('DIRECTUS_INTERNAL_URL') ?? ''
  }

  @All('*splat')
  async proxy(@Req() req: Request, @Res() res: Response): Promise<void> {
    if (req.method !== 'GET') {
      throw new MethodNotAllowedException('Lecture seule : GET uniquement')
    }
    if (!this.baseUrl) {
      throw new ServiceUnavailableException('Directus proxy non configuré')
    }

    const rawRelative = req.originalUrl.replace(/^\/directus/, '')
    const incoming = new URL(rawRelative, 'https://directus.invalid')

    if (incoming.hostname !== 'directus.invalid') {
      throw new NotFoundException('Chemin Directus non autorisé')
    }

    const [pathPart] = rawRelative.split('?')
    if (pathPart.includes('..') || /%2E%2E/i.test(pathPart)) {
      throw new NotFoundException('Chemin Directus non autorisé')
    }

    if (!isAllowedPath(incoming.pathname)) {
      throw new NotFoundException('Chemin Directus non autorisé')
    }

    const upstreamUrl = new URL(this.baseUrl)
    const basePath = upstreamUrl.pathname.replace(/\/$/, '')
    upstreamUrl.pathname = `${basePath}${incoming.pathname}`
    upstreamUrl.search = sanitizeQueryParams(incoming.searchParams).toString()

    let upstream: globalThis.Response
    try {
      upstream = await fetch(upstreamUrl.toString(), {
        method: 'GET',
        headers: {
          Accept: req.headers.accept ?? '*/*'
        },
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
      })
    } catch (error) {
      this.logger.warn(error, 'Directus proxy upstream failure')
      throw new BadGatewayException('Directus indisponible')
    }

    res.status(upstream.status)
    for (const header of ['content-type', 'cache-control', 'content-disposition', 'etag']) {
      const value = upstream.headers.get(header)
      if (value) res.setHeader(header, value)
    }
    // Les assets sont chargés par le navigateur depuis une autre origine
    // (front) que l'API — helmet impose sinon `same-origin`.
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')

    if (!upstream.body) {
      res.end()
      return
    }

    Readable.fromWeb(upstream.body as import('node:stream/web').ReadableStream)
      .on('error', (error: Error) => {
        this.logger.warn(error, 'Directus proxy stream error')
        res.destroy()
      })
      .pipe(res)
  }
}
