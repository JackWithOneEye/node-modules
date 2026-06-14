import { describe, expect, it, vi, afterEach } from 'vitest'
import { join } from 'path'

vi.mock('h3', () => ({
  createError: (opts: { statusCode: number, statusMessage: string }) => {
    const err = new Error(opts.statusMessage) as Error & { statusCode: number, statusMessage: string }
    err.statusCode = opts.statusCode
    err.statusMessage = opts.statusMessage
    throw err
  },
}))

const { assertPatchId, getPatchDirectory, getPatchFilePath } = await import('./patch-storage')

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000'

describe('assertPatchId', () => {
  it('returns the id when valid', () => {
    expect(assertPatchId(VALID_UUID)).toBe(VALID_UUID)
  })

  it('rejects undefined', () => {
    expect(() => assertPatchId(undefined)).toThrow('Invalid patch id')
  })

  it('rejects empty string', () => {
    expect(() => assertPatchId('')).toThrow('Invalid patch id')
  })

  it('rejects non-uuid string', () => {
    expect(() => assertPatchId('abc')).toThrow('Invalid patch id')
  })

  it('rejects traversal-shaped value', () => {
    expect(() => assertPatchId('../../etc/passwd')).toThrow('Invalid patch id')
  })
})

describe('getPatchDirectory', () => {
  const originalEnv = process.env.DATA_STORE_DIRECTORY

  afterEach(() => {
    process.env.DATA_STORE_DIRECTORY = originalEnv
  })

  it('returns patches dir under provided base', () => {
    const result = getPatchDirectory('/tmp/test-store')
    expect(result).toBe(join('/tmp/test-store', 'patches'))
  })

  it('throws 500 when env var is missing', () => {
    delete process.env.DATA_STORE_DIRECTORY
    expect(() => getPatchDirectory(undefined)).toThrow('Data store directory not configured')
  })
})

describe('getPatchFilePath', () => {
  const originalEnv = process.env.DATA_STORE_DIRECTORY

  afterEach(() => {
    process.env.DATA_STORE_DIRECTORY = originalEnv
  })

  it('returns a path ending in patches/<uuid>.json', () => {
    const result = getPatchFilePath(VALID_UUID, '/tmp/test-store')
    expect(result).toBe(join('/tmp/test-store', 'patches', `${VALID_UUID}.json`))
  })

  it('rejects invalid ids', () => {
    expect(() => getPatchFilePath('abc', '/tmp/test-store')).toThrow('Invalid patch id')
  })

  it('rejects traversal-shaped ids', () => {
    expect(() => getPatchFilePath('../../etc/passwd', '/tmp/test-store')).toThrow('Invalid patch id')
  })

  it('throws 500 when data store directory is missing', () => {
    delete process.env.DATA_STORE_DIRECTORY
    expect(() => getPatchFilePath(VALID_UUID)).toThrow('Data store directory not configured')
  })
})
