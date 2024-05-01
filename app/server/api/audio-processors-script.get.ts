import { readFile } from 'fs/promises'

export default defineEventHandler(async (event) => {
  const data = await readFile(`${process.env.AUDIO_PROCESSORS_OUTPUT_FILE}`, 'utf8')
  setResponseHeader(event, 'content-type', 'text/javascript')
  return data
})
