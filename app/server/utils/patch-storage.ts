import { resolve, relative } from 'path'
import { createError } from 'h3'

export const PATCH_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export function assertPatchId(id: string | undefined): string {
  if (!id || !PATCH_ID_PATTERN.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid patch id' })
  }
  return id
}

export function getPatchDirectory(dataStoreDirectory = process.env.DATA_STORE_DIRECTORY): string {
  if (!dataStoreDirectory) {
    throw createError({ statusCode: 500, statusMessage: 'Data store directory not configured' })
  }
  return resolve(dataStoreDirectory, 'patches')
}

export function getPatchFilePath(id: string | undefined, dataStoreDirectory = process.env.DATA_STORE_DIRECTORY): string {
  const validId = assertPatchId(id)
  const dir = getPatchDirectory(dataStoreDirectory)
  const filePath = resolve(dir, `${validId}.json`)
  if (relative(dir, filePath).startsWith('..')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid patch id' })
  }
  return filePath
}
