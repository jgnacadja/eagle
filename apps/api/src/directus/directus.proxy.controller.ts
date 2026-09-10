import {
  All,
  BadGatewayException,
  Controller,
  Logger,
  MethodNotAllowedException,
  NotFoundException,
  Req,
  Res,
  ServiceUnavailableException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { SkipThrottle } from '@nestjs/throttler'
import type { Request, Response } from 'express'
import { Readable } from 'node:stream'

/**
 * Collections Directus autorisées pour le front en lecture via le proxy.
 * Pas d'endpoints d'administration ni de collections système.
 */
const ALLOWED_ITEM_COLLECTIONS = new Set([
  'articles',
  'centres',
  'familles_formation',
  'formations'
])
const UPSTREAM_TIMEOUT_MS = 10_000

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
 * ses requêtes passent par l'API qui injecte le token serveur. Aucun
 * endpoint par collection : la route catch-all transfère méthode, chemin et
 * query tels quels (le SDK Directus côté front reste utilisable tel quel).
 */
@Controller('directus')
@SkipThrottle()
export class DirectusProxyController {
  private readonly logger = new Logger(DirectusProxyController.name)
  private readonly baseUrl: string
  private readonly token: string

  constructor(config: ConfigService) {
    this.token = config.get<string>('DIRECTUS_TOKEN') ?? ''
    this.baseUrl = config.get<string>('DIRECTUS_INTERNAL_URL') ?? ''
  }

  @All('*splat')
  async proxy(@Req() req: Request, @Res() res: Response): Promise<void> {
    if (req.method !== 'GET') {
      throw new MethodNotAllowedException('Lecture seule : GET uniquement')
    }
    if (!this.baseUrl || !this.token) {
      throw new ServiceUnavailableException('Directus proxy non configuré')
    }

    const rawRelative = (req.originalUrl ?? '').replace(/^\/directus/, '')
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
    upstreamUrl.search = incoming.search

    let upstream: globalThis.Response
    try {
      upstream = await fetch(upstreamUrl.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.token}`,
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
