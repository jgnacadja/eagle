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
 * Timeout et retries sont gérés par le SDK ; l'appelant peut aussi annuler
 * la requête en vol via `signal` (budget de temps du mode dégradé).
 */
const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1'
const DEFAULT_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free'
const REQUEST_TIMEOUT_MS = 30_000

/**
 * Effort de reasoning OpenRouter (`low` par défaut : la décision JSON n'a
 * pas besoin d'une longue chaîne de pensée et c'est le facteur dominant de
 * latence sur les modèles à reasoning). `off` désactive complètement le
 * reasoning via `exclude: true`.
 */
type ReasoningConfig = { effort: 'low' | 'medium' | 'high' } | { exclude: true }

function reasoningConfig(effort: string | undefined): ReasoningConfig {
  if (effort === 'off') return { exclude: true }
  if (effort === 'medium' || effort === 'high') return { effort }
  return { effort: 'low' }
}

@Injectable()
export class AssistantModelClient {
  private readonly model: string
  private readonly reasoning: ReasoningConfig
  private readonly client: OpenAI | null

  constructor(config: ConfigService) {
    this.model = config.get<string>('ASSISTANT_MODEL') ?? DEFAULT_MODEL
    this.reasoning = reasoningConfig(config.get<string>('ASSISTANT_REASONING_EFFORT'))
    const apiKey = config.get<string>('ASSISTANT_API_KEY')
    this.client = apiKey
      ? new OpenAI({
          apiKey,
          baseURL: config.get<string>('ASSISTANT_BASE_URL') ?? DEFAULT_BASE_URL,
          timeout: REQUEST_TIMEOUT_MS
        })
      : null
  }

  async complete(
    instructions: string,
    messages: AssistantModelMessage[],
    options: { signal?: AbortSignal } = {}
  ): Promise<string> {
    if (!this.client) throw new Error('assistant model is not configured')

    // `reasoning` est un paramètre OpenRouter hors du schéma OpenAI : le SDK
    // transfère les clés inconnues dans le body, d'où le cast.
    const completion = await this.client.chat.completions.create(
      {
        model: this.model,
        reasoning: this.reasoning,
        // Pas de `response_format` : tous les providers OpenRouter ne le
        // supportent pas. Le JSON est exigé par le prompt et re-validé
        // par Zod côté service.
        messages: [{ role: 'system', content: instructions }, ...messages],
        temperature: 0.2,
        // La décision JSON tient en ~1K tokens ; la borne évite aussi une
        // complétion non bornée si le modèle déraille.
        max_tokens: 2048
      } as OpenAI.ChatCompletionCreateParamsNonStreaming,
      // Annulation : le signal interrompt la requête HTTP et ses retries.
      { signal: options.signal }
    )

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('assistant model returned no content')
    return content
  }
}
