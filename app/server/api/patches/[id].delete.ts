import { unlink } from 'fs/promises'
import { getPatchFilePath } from '../../utils/patch-storage'

export default defineEventHandler(async (event) => {
  const filePath = getPatchFilePath(getRouterParam(event, 'id'))
  try {
    await unlink(filePath)
    return { success: true }
  }
  catch {
    throw createError({ statusCode: 404, statusMessage: 'Patch not found' })
  }
})
