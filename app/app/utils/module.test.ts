import { describe, expect, it } from 'vitest'
import { getModuleCatalogEntry, moduleCatalog, searchModuleCatalog } from './module'

describe('moduleCatalog', () => {
  it('contains known module types', () => {
    const types = moduleCatalog.map(e => e.type)
    expect(types).toContain('oscillator')
    expect(types).toContain('gain')
    expect(types).toContain('destination')
  })
})

describe('searchModuleCatalog', () => {
  it('ranks Oscillator first when querying "osc"', () => {
    const results = searchModuleCatalog('osc')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0]!.type).toBe('oscillator')
  })

  it('filters by category when provided', () => {
    const results = searchModuleCatalog('', 'I/O')
    for (const entry of results) {
      expect(entry.category).toBe('I/O')
    }
  })
})

describe('getModuleCatalogEntry', () => {
  it('returns Gain entry for type "gain"', () => {
    const entry = getModuleCatalogEntry('gain')
    expect(entry).toBeDefined()
    expect(entry!.label).toBe('Gain')
  })
})
