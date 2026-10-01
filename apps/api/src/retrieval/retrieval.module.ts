import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { CatalogModule } from '../catalog/catalog.module'
import { CatalogIndexService } from './catalog-index.service'
import { HashingEmbeddingsProvider } from './embeddings/hashing-embeddings.provider'
import { HttpEmbeddingsProvider } from './embeddings/http-embeddings.provider'
import { RetrievalController } from './retrieval.controller'
import { RetrievalService } from './retrieval.service'
import { EMBEDDINGS_PROVIDER, type EmbeddingsProvider } from './retrieval.types'

// Provider d'embeddings : `hashing` (défaut, local, sans clé) ou `http`
// (API au format OpenAI, fournisseur à confirmer — voir .env.example).
export function createEmbeddingsProvider(config: ConfigService): EmbeddingsProvider {
  return config.get<string>('EMBEDDINGS_PROVIDER') === 'http'
    ? new HttpEmbeddingsProvider(config)
    : new HashingEmbeddingsProvider()
}

@Module({
  imports: [ConfigModule, CatalogModule],
  controllers: [RetrievalController],
  providers: [
    { provide: EMBEDDINGS_PROVIDER, inject: [ConfigService], useFactory: createEmbeddingsProvider },
    CatalogIndexService,
    RetrievalService
  ],
  exports: [RetrievalService, CatalogIndexService]
})
export class RetrievalModule {}
