import { readFile } from 'fs/promises'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  }
  const filePath = join(process.env.DATA_STORE_DIRECTORY!, 'patches', `${id}.json`)
  try {
    const raw = await readFile(filePath, 'utf8')
    return JSON.parse(raw)
  }
  catch {
    throw createError({ statusCode: 404, statusMessage: 'Patch not found' })
  }
})
