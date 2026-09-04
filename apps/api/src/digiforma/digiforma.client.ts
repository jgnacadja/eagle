import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

export interface Program {
  id: string
  slug?: string | null
  title: string
  description?: string | null
  durationInDays?: number | null
  durationInHours?: number | null
  price?: number | null
  cpf?: boolean | null
  cpfCode?: string | null
  certificationType?: string | null
  certifierName?: string | null
  category?: string | null
  programCategory?: string | null
  blocks?: unknown[] | null
  image?: string | null
  generatedProgramUrl?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  status?: string | null
}

export interface DigiformaProgramsResponse {
  data?: {
    programs?: {
      nodes: Program[]
      pageInfo?: { hasNextPage: boolean; endCursor?: string }
    }
  }
  errors?: unknown[]
}

@Injectable()
export class DigiformaClient {
  private readonly logger = new Logger(DigiformaClient.name)
  private readonly url: string
  private readonly token: string
  private readonly maxRetries = 3

  constructor(config: ConfigService) {
    this.url = config.getOrThrow<string>('DIGIFORMA_API_URL')
    this.token = config.getOrThrow<string>('DIGIFORMA_API_KEY')
  }

  async fetchAllPrograms(): Promise<Program[]> {
    const programs: Program[] = []
    let cursor: string | undefined
    let hasNext = true
    let page = 0

    while (hasNext && page < 100) {
      const response = await this.queryPrograms(cursor)
      const nodes = response.data?.programs?.nodes ?? []
      programs.push(...nodes)
      hasNext = response.data?.programs?.pageInfo?.hasNextPage ?? false
      const nextCursor = response.data?.programs?.pageInfo?.endCursor ?? undefined

      if (hasNext && (nextCursor === undefined || nextCursor === cursor)) {
        this.logger.warn('Pagination cursor did not advance, stopping')
        break
      }

      cursor = nextCursor
      page += 1
    }

    return programs
  }

  private async queryPrograms(cursor?: string, attempt = 1): Promise<DigiformaProgramsResponse> {
    const query = this.buildProgramsQuery()

    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`
        },
        body: JSON.stringify({ query, variables: { after: cursor ?? null } }),
        signal: AbortSignal.timeout(30_000)
      })

      if (!response.ok) {
        throw new Error(`Digiforma HTTP ${response.status}`)
      }

      const body = (await response.json()) as DigiformaProgramsResponse

      if (body.errors && body.errors.length > 0) {
        this.logger.warn({ errors: body.errors }, 'GraphQL errors from Digiforma')

        if (!body.data?.programs) {
          throw new Error(`Digiforma GraphQL errors: ${JSON.stringify(body.errors)}`)
        }
      }

      return body
    } catch (error) {
      if (attempt >= this.maxRetries) {
        this.logger.error(error, 'Digiforma query failed after retries')
        throw error
      }

      const delay = 2 ** attempt * 100
      this.logger.warn(`Digiforma retry ${attempt} after ${delay}ms`)
      await new Promise((resolve) => setTimeout(resolve, delay))
      return this.queryPrograms(cursor, attempt + 1)
    }
  }

  private buildProgramsQuery(): string {
    return `
      query Programs($after: String) {
        programs(first: 100, after: $after) {
          nodes {
            id
            slug
            title
            description
            durationInDays
            durationInHours
            price
            cpf
            cpfCode
            certificationType
            certifierName
            category
            programCategory
            blocks
            image
            generatedProgramUrl
            createdAt
            updatedAt
            status
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `
  }
}
