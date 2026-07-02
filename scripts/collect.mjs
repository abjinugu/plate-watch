// Build step: read the curated source of truth, validate it, and emit the
// static file the SPA fetches at runtime. Runs automatically before `vite build`
// (see the "prebuild" script), so Cloudflare Pages regenerates it on every deploy.

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { validateEntry } from './schema.mjs'

const ENTRIES = new URL('../data/entries.json', import.meta.url)
const OUT_DIR = new URL('../public/', import.meta.url)
const OUT = new URL('../public/data.json', import.meta.url)

const entries = JSON.parse(await readFile(ENTRIES, 'utf8'))

const valid = []
for (const e of entries) {
  const errors = validateEntry(e)
  if (errors.length) {
    console.error(`invalid entry ${e.id ?? '?'}: ${errors.join(', ')}`)
    process.exitCode = 1
    continue
  }
  valid.push(e)
}

valid.sort((a, b) => b.inspectedOn.localeCompare(a.inspectedOn))

await mkdir(OUT_DIR, { recursive: true })
await writeFile(
  OUT,
  JSON.stringify({ generatedAt: new Date().toISOString(), entries: valid }, null, 2) + '\n'
)
console.log(`wrote ${valid.length} entries to public/data.json`)
