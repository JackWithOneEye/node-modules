import { readFile } from 'fs/promises'
import type { Node, Edge, ViewportTransform } from '@vue-flow/core'

export default defineEventHandler(async () => {
  const data = await readFile(`${process.env.DATA_STORE_DIRECTORY}/data.json`, 'utf8')
  return JSON.parse(data) as { nodes: Node[], edges: Edge[], viewport: ViewportTransform }
})
