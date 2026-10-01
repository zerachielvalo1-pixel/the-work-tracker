import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const ROOT = process.cwd()
const PORT = 4319

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
}

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
    if (path === '/') path = '/verify/preview.html'
    // The previews link to the real build output, which lives in dist/.
    if (path.startsWith('/assets/')) path = `/dist${path}`

    // Keep the served path inside the project directory.
    const target = join(ROOT, normalize(path).replace(/^(\.\.[/\\])+/, ''))
    if (!target.startsWith(ROOT)) {
      res.writeHead(403).end('forbidden')
      return
    }

    const body = await readFile(target)
    res.writeHead(200, { 'content-type': TYPES[extname(target)] ?? 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(404).end('not found')
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`verify server on http://127.0.0.1:${PORT}/`)
})
