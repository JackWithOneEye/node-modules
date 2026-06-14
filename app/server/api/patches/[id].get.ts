import { readFile } from 'fs/promises'
import { getPatchFilePath } from '../../utils/patch-storage'

export default defineEventHandler(async (event) => {
  const filePath = getPatchFilePath(getRouterParam(event, 'id'))
  try {
    const raw = await readFile(filePath, 'utf8')
    return JSON.parse(raw)
  }
  catch {
    throw createError({ statusCode: 404, statusMessage: 'Patch not found' })
  }
})
