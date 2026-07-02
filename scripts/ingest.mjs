// Scheduled step: run the source adapters, merge any NEW entries into the
// curated data/entries.json (deduped by id), and leave the file for the
// GitHub Action to commit. A commit triggers a fresh Cloudflare Pages build.

import { readFile, writeFile } from 'node:fs/promises'
import { fromFssai, fromCfsTelangana, fromGhmc } from './sources.mjs'
import { validateEntry } from './schema.mjs'

const ENTRIES = new URL('../data/entries.json', import.meta.url)

const existing = JSON.parse(await readFile(ENTRIES, 'utf8'))
const byId = new Map(existing.map((e) => [e.id, e]))

const incoming = (await Promise.all([fromFssai(), fromCfsTelangana(), fromGhmc()])).flat()

let added = 0
for (const entry of incoming) {
  const errors = validateEntry(entry)
  if (errors.length) {
    console.warn(`skipping ${entry?.id ?? '?'}: ${errors.join(', ')}`)
    continue
  }
  if (!byId.has(entry.id)) {
    byId.set(entry.id, entry)
    added++
  }
}

if (added > 0) {
  const merged = [...byId.values()].sort((a, b) => b.inspectedOn.localeCompare(a.inspectedOn))
  await writeFile(ENTRIES, JSON.stringify(merged, null, 2) + '\n')
  console.log(`added ${added} new entr${added === 1 ? 'y' : 'ies'}`)
} else {
  console.log('no new entries')
}
