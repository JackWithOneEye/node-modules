import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

export type PatchSummary = {
  id: string
  name: string
  updatedAt: string
}

export default defineEventHandler(async () => {
  const dir = join(process.env.DATA_STORE_DIRECTORY!, 'patches')
  let entries: string[]
  try {
    entries = await readdir(dir)
  }
  catch {
    return [] as PatchSummary[]
  }
  const patches: PatchSummary[] = []
  for (const entry of entries) {
    if (!entry.endsWith('.json')) {
      continue
    }
    const id = entry.slice(0, -5)
    try {
      const raw = await readFile(join(dir, entry), 'utf8')
      const data = JSON.parse(raw)
      patches.push({ id, name: data.name ?? 'New patch', updatedAt: data.updatedAt ?? '' })
    }
    catch {
      // skip malformed files
    }
  }
  patches.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  return patches
})
