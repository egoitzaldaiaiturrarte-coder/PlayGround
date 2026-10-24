import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const port = Number(process.env.PORT || 3000)
const host = process.env.HOST || '0.0.0.0'

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8'
}

const server = createServer(async (req, res) => {
  const started = performance.now()
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)

  if (url.pathname === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' })
    res.end('ok\n')
    return
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' })
    res.end('Method not allowed\n')
    return
  }

  try {
    let pathname = decodeURIComponent(url.pathname)
    if (pathname === '/') pathname = '/index.html'
    let file = resolve(join(root, `.${pathname}`))
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(403)
      res.end('Forbidden\n')
      return
    }

    let info
    try {
      info = await stat(file)
    } catch {
      info = null
    }

    if (!info || info.isDirectory()) {
      if (extname(pathname)) {
        res.writeHead(404)
        res.end('Not found\n')
        return
      }
      file = join(root, 'index.html')
      info = await stat(file)
    }

    const body = await readFile(file)
    const type = mime[extname(file).toLowerCase()] || 'application/octet-stream'
    const headers = {
      'Content-Type': type,
      'Content-Length': body.length,
      'Cache-Control': extname(file) === '.html' ? 'no-cache' : 'public, max-age=60',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'SAMEORIGIN'
    }

    res.writeHead(200, headers)
    if (req.method === 'HEAD') res.end()
    else res.end(body)
    console.log(`[serve] ${req.method} ${url.pathname} ${res.statusCode} ${(performance.now() - started).toFixed(1)}ms`)
  } catch (error) {
    console.error('[serve]', error)
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Internal server error\n')
  }
})

server.listen(port, host, () => {
  console.log(`[serve] ${root} -> http://${host}:${port}`)
})

const shutdown = signal => {
  console.log(`[serve] ${signal} received, closing`)
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(0), 3000).unref()
}
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
