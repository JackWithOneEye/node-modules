import { writeFile } from 'fs/promises'
import type { Node, Edge, ViewportTransform } from '@vue-flow/core'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ nodes: Node[], edges: Edge[], viewport: ViewportTransform }>(event)
  await writeFile(`${process.env.DATA_STORE_DIRECTORY}/data.json`, JSON.stringify(body), { flag: 'w+' })
  return { body }
})
