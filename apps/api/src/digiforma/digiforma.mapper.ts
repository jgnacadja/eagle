import { Prisma } from '@prisma/client'
import type { Program } from './digiforma.client'

export type FormationInput = Prisma.FormationCreateInput

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function mapFamilySlug(category?: string | null, programCategory?: string | null): string | null {
  const raw = (programCategory ?? category ?? '').trim()
  if (!raw) return null
  return slugify(raw)
}

function mapDescription(description?: string | null): string | null {
  if (!description) return null
  const trimmed = description.trim()
  if (!trimmed) return null
  return trimmed
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? Prisma.JsonNull)) as Prisma.InputJsonValue
}

export function mapProgramToFormation(program: Program): FormationInput {
  const title = program.title.trim()
  const slug = (program.slug ?? '').trim() || slugify(title)
  const familySlug = mapFamilySlug(program.category, program.programCategory)

  return {
    digiformaId: program.id,
    slug,
    title,
    description: mapDescription(program.description),
    durationDays: program.durationInDays ?? null,
    durationHours: program.durationInHours ?? null,
    price: program.price ?? null,
    cpf: program.cpf ?? null,
    cpfCode: program.cpfCode ?? null,
    certification: program.certificationType ?? null,
    certifierName: program.certifierName ?? null,
    category: program.category ?? null,
    familySlug,
    centerSlug: null,
    blocks: toJsonValue(program.blocks ?? null),
    imageUrl: program.image ?? null,
    status: program.status === 'published' ? 'published' : 'draft',
    seoTitle: title,
    seoDescription: mapDescription(program.description),
    raw: toJsonValue(program)
  }
}
