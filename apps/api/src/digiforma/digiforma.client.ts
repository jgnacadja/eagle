import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

export interface DigiformaImage {
  id?: string | null
  url?: string | null
}

export interface DigiformaCost {
  cost?: number | null
  vat?: number | null
  type?: string | null
}

export interface DigiformaSessionLocation {
  name?: string | null
  city?: string | null
  postalCode?: string | null
  department?: string | null
  region?: string | null
  centreSlug?: string | null
}

export interface DigiformaSession {
  id?: string | null
  startDate?: string | null
  endDate?: string | null
  modality?: string | null
  seatsRemaining?: number | null
  location?: DigiformaSessionLocation | null
}

export interface Program {
  id: string
  code?: string | null
  name: string
  subtitle?: string | null
  description?: string | null
  durationInDays?: number | null
  durationInHours?: number | null
  cpf?: boolean | null
  cpfCode?: string | null
  certificationType?: string | null
  certifierName?: string | null
  category?: { id?: string; name?: string | null } | null
  blocks?:
    | {
        name?: string | null
        description?: string | null
        goals?: { text?: string | null }[] | null
        position?: number | null
        type?: string | null
        durationInDays?: number | null
        durationInHours?: number | null
      }[]
    | null
  image?: DigiformaImage | null
  generatedProgramUrl?: string | null
  costsInter?: DigiformaCost[] | null
  targets?: { text?: string | null }[] | null
  prerequisites?: { text?: string | null }[] | null
  evaluation?: { text?: string | null }[] | null
  modalities?: string[] | null
  sessions?: DigiformaSession[] | null
  onSale?: boolean | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface DigiformaProgramsResponse {
  data?: {
    programs?: Program[]
  }
  errors?: unknown[]
}

const PAGE_SIZE = 100
const MAX_PAGES = 100

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
    let page = 1
    let previousFirstId: string | undefined

    while (page <= MAX_PAGES) {
      const nodes = await this.queryPrograms(page)

      // Garde-fou : si l'API boucle (même premier id que la page
      // précédente), on arrête au lieu de paginer jusqu'à MAX_PAGES.
      const firstId = nodes[0]?.id
      if (firstId !== undefined && firstId === previousFirstId) {
        this.logger.warn(`Digiforma pagination loop detected at page ${page}, stopping`)
        break
      }
      previousFirstId = firstId

      programs.push(...nodes)

      if (nodes.length < PAGE_SIZE) {
        break
      }

      page += 1
    }

    return programs
  }

  private async queryPrograms(page: number, attempt = 1): Promise<Program[]> {
    const query = this.buildProgramsQuery()

    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`
        },
        body: JSON.stringify({
          query,
          variables: { page, size: PAGE_SIZE }
        }),
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

      return body.data?.programs ?? []
    } catch (error) {
      if (attempt >= this.maxRetries) {
        this.logger.error(error, 'Digiforma query failed after retries')
        throw error
      }

      const delay = 2 ** attempt * 100
      this.logger.warn(`Digiforma retry ${attempt} after ${delay}ms`)
      await new Promise((resolve) => setTimeout(resolve, delay))
      return this.queryPrograms(page, attempt + 1)
    }
  }

  private buildProgramsQuery(): string {
    return `
      query Programs($page: Int!, $size: Int!) {
        programs(pagination: { page: $page, size: $size }) {
          id
          code
          name
          subtitle
          description
          durationInDays
          durationInHours
          cpf
          cpfCode
          certificationType
          certifierName
          category {
            id
            name
          }
          blocks {
            name
            description
            goals {
              text
            }
            position
            type
            durationInDays
            durationInHours
          }
          image {
            url
          }
          generatedProgramUrl
          costsInter {
            cost
            vat
            type
          }
          targets {
            text
          }
          prerequisites {
            text
          }
          onSale
          createdAt
          updatedAt
        }
      }
    `
  }
}
