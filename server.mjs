import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const PORT = process.env.PORT || 3000
const DIST = path.resolve('dist')

function contentType(file) {
  const ext = path.extname(file).toLowerCase()
  return (
    {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.ico': 'image/x-icon',
      '.woff2': 'font/woff2',
    }[ext] || 'application/octet-stream'
  )
}

const server = http.createServer((req, res) => {
  try {
    const urlPath = new URL(req.url, `http://localhost:${PORT}`).pathname
    let filePath = path.join(DIST, urlPath)

    // If path is directory, serve index.html
    if (filePath.endsWith(path.sep)) filePath = path.join(filePath, 'index.html')

    // If file doesn't exist, fallback to index.html (SPA)
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST, 'index.html')
    }

    const ct = contentType(filePath)
    res.writeHead(200, { 'Content-Type': ct, 'Cache-Control': 'public, max-age=0' })
    const stream = fs.createReadStream(filePath)
    stream.pipe(res)
    stream.on('error', (err) => {
      console.error(err)
      res.writeHead(500)
      res.end('Internal Server Error')
    })
  } catch (err) {
    console.error(err)
    res.writeHead(500)
    res.end('Internal Server Error')
  }
})

server.listen(PORT, () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`)
})
