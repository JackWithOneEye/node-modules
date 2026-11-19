// Electron shell: runs the built Nuxt (Nitro) server in a utility process on a free localhost port
// and opens it in a window. Patches are stored in the per-user app data directory.
const { app, BrowserWindow, session, shell, utilityProcess } = require('electron')
const net = require('node:net')
const path = require('node:path')

// Packaged: <resources>/web. Unpackaged (`bun run start`): desktop/web, filled the same way CI does.
const webDir = app.isPackaged
  ? path.join(process.resourcesPath, 'web')
  : path.join(__dirname, 'web')

let server

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer()
    srv.unref()
    srv.on('error', reject)
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address()
      srv.close(() => resolve(port))
    })
  })
}

async function waitForServer(url, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    }
    catch {
      // not listening yet
    }
    await new Promise(r => setTimeout(r, 100))
  }
  throw new Error(`Server did not start at ${url}`)
}

async function startServer() {
  const port = await freePort()
  server = utilityProcess.fork(path.join(webDir, 'output', 'server', 'index.mjs'), [], {
    env: {
      ...process.env,
      HOST: '127.0.0.1',
      PORT: String(port),
      NODE_ENV: 'production',
      DATA_STORE_DIRECTORY: path.join(app.getPath('userData'), 'data'),
      AUDIO_PROCESSORS_OUTPUT_FILE: path.join(webDir, 'audio-processors.js'),
    },
    stdio: 'inherit',
  })
  server.on('exit', (code) => {
    server = undefined
    if (code !== 0) console.warn(`Server exited with code ${code}`)
  })
  const url = `http://127.0.0.1:${port}`
  await waitForServer(`${url}/api/patches`)
  return url
}

async function createWindow(url) {
  const origin = new URL(url).origin
  // The app needs MIDI (incl. sysex), microphone input and device enumeration; grant them only to our own server.
  const allowed = new Set(['media', 'midi', 'midiSysex', 'speaker-selection'])
  session.defaultSession.setPermissionRequestHandler((wc, permission, callback, details) => {
    callback(allowed.has(permission) && new URL(details.requestingUrl).origin === origin)
  })
  session.defaultSession.setPermissionCheckHandler((wc, permission, requestingOrigin) => {
    return allowed.has(permission) && requestingOrigin === origin
  })

  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    backgroundColor: '#0f172a',
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true },
  })
  // Open external links in the system browser instead of new Electron windows.
  win.webContents.setWindowOpenHandler(({ url: target }) => {
    if (!target.startsWith(origin)) shell.openExternal(target)
    return { action: target.startsWith(origin) ? 'allow' : 'deny' }
  })
  await win.loadURL(url)
}

app.whenReady().then(async () => {
  const url = await startServer()
  await createWindow(url)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(url)
  })
}).catch((err) => {
  console.error(err)
  app.exit(1)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => {
  server?.kill()
})
