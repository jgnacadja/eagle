import { Injectable } from '@nestjs/common'
import type { SourceConfig } from '../sources/source.types'
import { DigiformaClient } from './digiforma.client'

interface CachedClient {
  client: DigiformaClient
  url: string
  token: string
}

/**
 * Une instance de `DigiformaClient` par source, réutilisée tant que l'URL et
 * la clé n'ont pas changé (une clé modifiée dans l'admin est prise en compte
 * au prochain run).
 */
@Injectable()
export class DigiformaClientFactory {
  private readonly clients = new Map<string, CachedClient>()

  for(source: SourceConfig): DigiformaClient {
    const url = source.digiforma.apiUrl
    const token = source.secrets.digiformaApiKey
    if (!url || !token) {
      // Le message ne cite que le code : aucune valeur de config.
      throw new Error(`Source "${source.code}": Digiforma API URL or key missing`)
    }

    const cached = this.clients.get(source.id)
    if (cached && cached.url === url && cached.token === token) return cached.client

    const client = new DigiformaClient({ url, token })
    this.clients.set(source.id, { client, url, token })
    return client
  }
}
