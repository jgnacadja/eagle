import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import OpenAI from 'openai'

export interface AssistantModelMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Client chat completions via le SDK `openai` — pointe par défaut sur
 * OpenRouter (`ASSISTANT_BASE_URL`), ce qui permet de changer de modèle
 * sans changer de client : gratuit en dev (`ASSISTANT_MODEL`), puis
 * `anthropic/claude-haiku-4.5` en prod une fois validé.
 * Timeout et retries sont gérés par le SDK.
 */
const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1'
const DEFAULT_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free'
const REQUEST_TIMEOUT_MS = 30_000

@Injectable()
export class AssistantModelClient {
  private readonly model: string
  private readonly client: OpenAI | null

  constructor(config: ConfigService) {
    this.model = config.get<string>('ASSISTANT_MODEL') ?? DEFAULT_MODEL
    const apiKey = config.get<string>('ASSISTANT_API_KEY')
    this.client = apiKey
      ? new OpenAI({
          apiKey,
          baseURL: config.get<string>('ASSISTANT_BASE_URL') ?? DEFAULT_BASE_URL,
          timeout: REQUEST_TIMEOUT_MS
        })
      : null
  }

  async complete(instructions: string, messages: AssistantModelMessage[]): Promise<string> {
    if (!this.client) throw new Error('assistant model is not configured')

    const completion = await this.client.chat.completions.create({
      model: this.model,
      // Pas de `response_format` : tous les providers OpenRouter ne le
      // supportent pas. Le JSON est exigé par le prompt et re-validé
      // par Zod côté service.
      messages: [{ role: 'system', content: instructions }, ...messages],
      temperature: 0.2,
      // La décision JSON tient en ~1K tokens ; la borne évite aussi une
      // complétion non bornée si le modèle déraille.
      max_tokens: 4096
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('assistant model returned no content')
    return content
  }
}
