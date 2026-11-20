// Entry of the standalone binary: starts the bundled Nuxt server on localhost and opens it in the default browser.
// web/ is filled by CI (.github/workflows/standalone.yml) or by hand, see AGENTS.md.
import { homedir } from 'node:os'
import { join } from 'node:path'
import processorsScript from './web/audio-processors.js' with { type: 'file' }

// A fixed port keeps the origin, and with it the browser's localStorage (themes, favourites), the same across runs.
process.env.PORT ??= '4848'
process.env.HOST ??= '127.0.0.1'
process.env.DATA_STORE_DIRECTORY ??= join(homedir(), '.node-modules')
process.env.AUDIO_PROCESSORS_OUTPUT_FILE = processorsScript

const url = `http://${process.env.HOST === '0.0.0.0' ? '127.0.0.1' : process.env.HOST}:${process.env.PORT}`

function openBrowser() {
  const cmd = process.platform === 'darwin'
    ? ['open', url]
    : process.platform === 'win32'
      ? ['cmd', '/c', 'start', '', url]
      : ['xdg-open', url]
  try {
    Bun.spawn(cmd, { stdout: 'ignore', stderr: 'ignore' })
  }
  catch {
    console.warn(`Could not open a browser; open ${url} yourself.`)
  }
}

async function alreadyRunning() {
  try {
    return (await fetch(`${url}/api/audio-processors-script`)).ok
  }
  catch {
    return false
  }
}

if (await alreadyRunning()) {
  console.log(`Node Modules is already running at ${url}`)
  openBrowser()
  process.exit(0)
}

try {
  await import('./web/output/server/index.mjs')
}
catch (err) {
  console.error(`Could not start the server on ${url}: ${err}`)
  console.error('Set PORT to use another port.')
  process.exit(1)
}
console.log(`Patches are stored in ${process.env.DATA_STORE_DIRECTORY}. Press Ctrl+C to quit.`)
openBrowser()
