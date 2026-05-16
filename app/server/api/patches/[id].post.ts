import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

interface PatchBody {
  name: string
  nodes: Record<string, unknown>[]
  edges: Record<string, unknown>[]
  viewport?: Record<string, unknown>
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  }
  const body = await readBody<PatchBody>(event)
  const dir = join(process.env.DATA_STORE_DIRECTORY!, 'patches')
  const filePath = join(dir, `${id}.json`)
  let existing: Record<string, unknown> = {}
  try {
    const raw = await readFile(filePath, 'utf8')
    existing = JSON.parse(raw) as Record<string, unknown>
  }
  catch {
    // file doesn't exist yet, create new
  }
  const now = new Date().toISOString()
  const patch = {
    version: 1,
    id,
    name: body.name ?? existing.name ?? 'Untitled',
    createdAt: existing.createdAt ?? now,
    updatedAt: now,
    nodes: body.nodes ?? (existing.nodes as Record<string, unknown>[]) ?? [],
    edges: body.edges ?? (existing.edges as Record<string, unknown>[]) ?? [],
    viewport: body.viewport ?? existing.viewport,
  }
  await mkdir(dir, { recursive: true })
  await writeFile(filePath, JSON.stringify(patch), { flag: 'w+' })
  return patch
})
