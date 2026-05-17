import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

interface PatchBody {
  name: string
  nodes: Record<string, unknown>[]
  edges: Record<string, unknown>[]
  viewport?: Record<string, unknown>
}

export default defineEventHandler(async (event) => {
  const body = await readBody<PatchBody>(event)
  const id = randomUUID()
  const now = new Date().toISOString()
  const patch = {
    version: 1,
    id,
    name: body.name ?? 'New patch',
    createdAt: now,
    updatedAt: now,
    nodes: body.nodes ?? [],
    edges: body.edges ?? [],
    viewport: body.viewport,
  }
  const dir = join(process.env.DATA_STORE_DIRECTORY!, 'patches')
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, `${id}.json`), JSON.stringify(patch), { flag: 'w+' })
  return { id }
})
