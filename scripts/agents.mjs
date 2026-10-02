#!/usr/bin/env node
// Fichiers agents/skills internes : versionnés sur la branche orpheline `agents`,
// absents des branches livrées (rc/main) et ignorés par .gitignore.
//
//   node scripts/agents.mjs pull     restaure les fichiers dans le worktree
//   node scripts/agents.mjs push     publie les fichiers locaux sur origin/agents
//   node scripts/agents.mjs status   liste les différences local ↔ branche
//   option --local : utilise refs/heads/agents sans toucher au remote

import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const BRANCH = 'agents'
const REMOTE_REF = `refs/remotes/origin/${BRANCH}`
const LOCAL_REF = `refs/heads/${BRANCH}`

const PATHS = [
  'AGENTS.md',
  'CLAUDE.md',
  '.mcp.json',
  'eagle.code-workspace',
  '.agents',
  '.vscode',
  'apps/api/AGENTS.md',
  'apps/front/AGENTS.md',
  'apps/api/skills-lock.json'
]

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim()
const out = (s) => process.stdout.write(`${s}\n`)
const err = (s) => process.stderr.write(`${s}\n`)

const git = (args, env = {}, opts = {}) =>
  execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, ...env },
    ...opts
  }).trim()

const refExists = (ref) => {
  try {
    git(['rev-parse', '--verify', '--quiet', ref])
    return true
  } catch {
    return false
  }
}

const fetchAgents = () => {
  try {
    git(['fetch', 'origin', `${BRANCH}:${REMOTE_REF}`], {}, { stdio: ['pipe', 'pipe', 'ignore'] })
  } catch {
    // offline ou remote sans branche agents : on retombe sur la ref locale
  }
}

const resolveRef = (preferLocal = false) => {
  if (preferLocal && refExists(LOCAL_REF)) return LOCAL_REF
  if (refExists(REMOTE_REF)) return REMOTE_REF
  if (refExists(LOCAL_REF)) return LOCAL_REF
  return null
}

const expandFiles = () => {
  const files = []
  const walk = (rel) => {
    const abs = join(root, rel)
    if (!existsSync(abs)) return
    if (statSync(abs).isDirectory()) {
      for (const entry of readdirSync(abs)) walk(join(rel, entry))
    } else {
      files.push(rel)
    }
  }
  PATHS.forEach(walk)
  return files
}

const pull = (preferLocal) => {
  if (!preferLocal) fetchAgents()
  const ref = resolveRef(preferLocal)
  if (!ref) {
    err(`branche '${BRANCH}' introuvable (origin ni locale) — rien à restaurer`)
    process.exit(1)
  }
  const archive = execFileSync('git', ['archive', ref], { cwd: root, maxBuffer: 64 * 1024 * 1024 })
  execFileSync('tar', ['-xf', '-'], { cwd: root, input: archive })
  const count = git(['ls-tree', '-r', '--name-only', ref]).split('\n').filter(Boolean).length
  out(`${count} fichier(s) restauré(s) depuis ${ref}`)
}

const push = (localOnly) => {
  fetchAgents()
  const parent = resolveRef()
  const files = expandFiles()
  if (!files.length) {
    err('aucun fichier agent trouvé dans le worktree')
    process.exit(1)
  }
  const indexFile = join(mkdtempSync(join(tmpdir(), 'agents-')), 'index')
  const env = { GIT_INDEX_FILE: indexFile }
  git(['read-tree', '--empty'], env)
  for (const f of files) {
    const sha = git(['hash-object', '-w', '--', f])
    git(['update-index', '--add', '--cacheinfo', `100644,${sha},${f}`], env)
  }
  const tree = git(['write-tree'], env)
  rmSync(indexFile, { force: true })
  if (parent && git(['rev-parse', `${parent}^{tree}`]) === tree) {
    out(`${BRANCH} déjà à jour`)
    return
  }
  const args = ['commit-tree', tree, '-m', 'chore(agents): sync agent/skill files']
  if (parent) args.push('-p', parent)
  const commit = git(args)
  git(['update-ref', LOCAL_REF, commit])
  if (localOnly) {
    out(`commit ${commit.slice(0, 8)} sur ${LOCAL_REF} (--local, non poussé)`)
    return
  }
  git(['push', 'origin', `${LOCAL_REF}:${BRANCH}`])
  out(`${files.length} fichier(s) → origin/${BRANCH} (${commit.slice(0, 8)})`)
}

const status = (preferLocal) => {
  if (!preferLocal) fetchAgents()
  const ref = resolveRef(preferLocal)
  if (!ref) {
    err(`branche '${BRANCH}' introuvable (origin ni locale)`)
    process.exit(1)
  }
  const remote = new Map(
    git(['ls-tree', '-r', ref, '--format', '%(objectname) %(path)'])
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const sep = line.indexOf(' ')
        return [line.slice(sep + 1), line.slice(0, sep)]
      })
  )
  let drift = 0
  for (const f of expandFiles()) {
    const sha = git(['hash-object', '--', f])
    if (remote.get(f) !== sha) {
      out(remote.has(f) ? `modifié   ${f}` : `local seul ${f}`)
      drift++
    }
    remote.delete(f)
  }
  for (const f of remote.keys()) {
    out(`absent    ${f}`)
    drift++
  }
  out(drift ? `${drift} différence(s) ↔ ${ref}` : `à jour avec ${ref}`)
}

const [cmd = 'pull', ...rest] = process.argv.slice(2)
const local = rest.includes('--local') || cmd === '--local'
const command = cmd === '--local' ? 'pull' : cmd

if (command === 'pull') pull(local)
else if (command === 'push') push(local)
else if (command === 'status') status(local)
else {
  out('usage: node scripts/agents.mjs [pull|push|status] [--local]')
  process.exit(command === 'help' || command === '--help' ? 0 : 1)
}
