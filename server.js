import express from 'express'
import http2Express from 'http2-express-bridge'
import { createSecureServer } from 'node:http2'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, extname } from 'node:path'
import { createBrotliCompress, createGzip, constants } from 'node:zlib'
import { pipeline } from 'node:stream'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PORT = process.env.PORT || 3000
const DIST = join(__dirname, 'dist')

// ─── Находим реальные имена ассетов с хешами Vite ───
const assets = readdirSync(join(DIST, 'assets'))
const cssFile = assets.find(f => f.startsWith('index-') && f.endsWith('.css'))
const jsFile = assets.find(f => f.startsWith('index-') && f.endsWith('.js'))

// ─── Self-signed сертификат для HTTPS (только для демо) ───
const certPath = join(__dirname, 'cert.pem')
const keyPath = join(__dirname, 'key.pem')

if (!existsSync(certPath) || !existsSync(keyPath)) {
  console.error('Нужны self-signed сертификаты для HTTPS.')
  console.error('Сгенерируйте: openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 365 -subj "/CN=localhost"')
  process.exit(1)
}

const app = http2Express(express)

// ─── 1. Cache-Control заголовки ───
// Хешированные ассеты (JS/CSS с хешем в имени) — кешируем навсегда
// HTML и прочее — revalidate при каждом запросе
app.use((req, res, next) => {
  const url = req.url

  if (url.match(/\.(js|css)$/) && url.includes('-')) {
    // Файлы с хешем Vite (index-CwvPyqso.css) — иммутабельный кеш
    res.set('Cache-Control', 'public, max-age=31536000, immutable')
  } else if (url.match(/\.(jpg|jpeg|png|gif|webp|avif|svg|ico|woff2?)$/)) {
    // Картинки и шрифты — долгий кеш
    res.set('Cache-Control', 'public, max-age=86400')
  } else {
    // HTML и остальное — всегда проверять свежесть
    res.set('Cache-Control', 'no-cache')
  }

  next()
})

// ─── 2. Brotli-сжатие для текстовых файлов ───
const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.json', '.svg', '.xml', '.txt'])

app.use(async (req, res, next) => {
  const filePath = join(DIST, req.path === '/' ? 'index.html' : req.path)
  const ext = extname(filePath)

  if (!COMPRESSIBLE.has(ext)) {
    return next()
  }

  try {
    const fileStat = await stat(filePath)
    if (!fileStat.isFile()) return next()

    const acceptEncoding = req.headers['accept-encoding'] || ''

    const mimeTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.svg': 'image/svg+xml',
      '.xml': 'application/xml',
      '.txt': 'text/plain'
    }
    res.set('Content-Type', mimeTypes[ext] || 'application/octet-stream')

    if (acceptEncoding.includes('br')) {
      res.set('Content-Encoding', 'br')
      const brotli = createBrotliCompress({
        params: { [constants.BROTLI_PARAM_QUALITY]: 4 }
      })
      pipeline(createReadStream(filePath), brotli, res, () => {})
    } else if (acceptEncoding.includes('gzip')) {
      res.set('Content-Encoding', 'gzip')
      pipeline(createReadStream(filePath), createGzip(), res, () => {})
    } else {
      createReadStream(filePath).pipe(res)
    }
  } catch {
    next()
  }
})

// Статические файлы (для не-compressible форматов: картинки, шрифты)
app.use(express.static(DIST))

// ─── 3. 103 Early Hints + SPA fallback ───
app.get('*', (req, res) => {
  // 103 Early Hints — браузер начинает загрузку ресурсов до основного ответа
  if (res.writeEarlyHints) {
    res.writeEarlyHints({
      link: [
        `</assets/${cssFile}>; rel=preload; as=style`,
        `</assets/${jsFile}>; rel=modulepreload`,
        '</images/hero/hero-1.jpg>; rel=preload; as=image'
      ]
    })
  }

  res.set('Content-Type', 'text/html')
  const acceptEncoding = req.headers['accept-encoding'] || ''
  const htmlPath = join(DIST, 'index.html')

  if (acceptEncoding.includes('br')) {
    res.set('Content-Encoding', 'br')
    const brotli = createBrotliCompress({
      params: { [constants.BROTLI_PARAM_QUALITY]: 4 }
    })
    pipeline(createReadStream(htmlPath), brotli, res, () => {})
  } else {
    createReadStream(htmlPath).pipe(res)
  }
})

// ─── HTTP/2 сервер ───
const server = createSecureServer(
  {
    key: readFileSync(keyPath),
    cert: readFileSync(certPath),
    allowHTTP1: true // фолбэк для клиентов без HTTP/2
  },
  app
)

server.listen(PORT, () => {
  console.log(`TechStore server running at https://localhost:${PORT}`)
  console.log('Mode: optimized (HTTP/2 + Brotli + Cache-Control + Early Hints)')
})
