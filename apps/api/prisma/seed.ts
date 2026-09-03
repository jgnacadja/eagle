/**
 * Main seed entry point
 * This file imports and runs the modular seed system
 *
 * Usage:
 * - Development: npm run seed (or SEED_MODE=development npm run seed)
 * - Production: SEED_MODE=production npm run seed
 */
import { seed, disconnect } from './seeds/index.js'

async function main() {
  try {
    await seed()
    await disconnect()
    process.exit(0)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('❌ Seeding failed:', e)
    await disconnect().catch(() => {})
    process.exit(1)
  }
}

void main()
