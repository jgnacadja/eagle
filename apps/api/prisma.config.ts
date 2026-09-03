import 'dotenv/config'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'
import { defineConfig } from 'prisma/config'

config({
  path: fileURLToPath(new URL('../../.env', import.meta.url))
})

// Fallback for build environments where DATABASE_URL may not be set
const databaseUrl = process.env['DATABASE_URL'] || 'postgresql://build:build@localhost:5432/build'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations'
  },
  datasource: {
    url: databaseUrl
  }
})
