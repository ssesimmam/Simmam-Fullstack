import { createServer } from 'node:http'
import { extname, resolve, normalize, join, sep } from 'node:path'
import { existsSync, statSync, createReadStream } from 'node:fs'

const port = Number(process.env.PORT || 4173)
const host = process.env.HOST || '0.0.0.0'
const distDir = resolve('dist')
const indexFile = join(distDir, 'index.html')

const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'application/javascript; charset=utf-8'],
  ['.mjs', 'application/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.ico', 'image/x-icon'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.txt', 'text/plain; charset=utf-8'],
])

function sendFile(res, filePath) {
  const type = mimeTypes.get(extname(filePath).toLowerCase()) || 'application/octet-stream'
  const asset = filePath.includes(`${sep}assets${sep}`) || filePath.includes('/assets/')

  res.statusCode = 200
  res.setHeader('Content-Type', type)
  res.setHeader('Cache-Control', asset ? 'public, max-age=31536000, immutable' : 'no-cache')

  createReadStream(filePath)
    .on('error', () => {
      res.statusCode = 500
      res.end('Internal Server Error')
    })
    .pipe(res)
}

function sendIndex(res) {
  if (!existsSync(indexFile)) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end('dist/index.html not found. Run the build before starting the server.')
    return
  }

  res.statusCode = 200
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache')
  createReadStream(indexFile).pipe(res)
}

const server = createServer((req, res) => {
  if (!req.url || (req.method !== 'GET' && req.method !== 'HEAD')) {
    res.statusCode = 405
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end('Method Not Allowed')
    return
  }

  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  const pathname = decodeURIComponent(requestUrl.pathname)

  if (pathname === '/api' || pathname.startsWith('/api/')) {
    res.statusCode = 404
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end('Not Found')
    return
  }

  const resolvedPath = normalize(resolve(distDir, `.${pathname}`))
  const insideDist = resolvedPath === distDir || resolvedPath.startsWith(`${distDir}${sep}`)

  if (insideDist && existsSync(resolvedPath) && statSync(resolvedPath).isFile()) {
    sendFile(res, resolvedPath)
    return
  }

  if (pathname.includes('.')) {
    res.statusCode = 404
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end('Not Found')
    return
  }

  sendIndex(res)
})

server.listen(port, host, () => {
  console.log(`Frontend server listening on http://${host}:${port}`)
})
