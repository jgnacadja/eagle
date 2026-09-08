/* eslint-disable no-console */
import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '../generated/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { mapProgramToCourse } from '../../src/digiforma/digiforma.mapper'
import type { Program } from '../../src/digiforma/digiforma.client'

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env['DATABASE_URL']
  })
})

export async function disconnect(): Promise<void> {
  await prisma.$disconnect()
}

export async function seed(): Promise<void> {
  const fixturePath = fileURLToPath(new URL('../../test/fixtures/programs.json', import.meta.url))
  const raw = await readFile(fixturePath, 'utf8')
  const programs: Program[] = JSON.parse(raw)

  const courses = programs.map((p) => mapProgramToCourse(p))

  let upserted = 0
  for (const course of courses) {
    // familySlug est exclu de l'update : l'affectation de famille est
    // éditoriale (Directus → /admin/families/apply), le seed ne doit pas
    // écraser une affectation existante.
    const { familySlug: _familySlug, ...updateData } = course
    await prisma.course.upsert({
      where: { digiformaId: course.digiformaId },
      create: course,
      update: updateData
    })
    upserted += 1
  }

  console.log(`Seeded ${upserted} courses`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .catch((e) => {
      console.error('Seeding failed:', e)
      process.exit(1)
    })
    .finally(async () => {
      await disconnect()
      process.exit(0)
    })
}
