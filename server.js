import express from 'express'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// Baseline: HTTP/1.1, без сжатия, без кеширования
// Намеренно неоптимизированная конфигурация для демонстрации

// Явно отключаем кеширование — anti-pattern для baseline
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  res.set('Pragma', 'no-cache')
  res.set('Expires', '0')
  next()
})

// Статические файлы из dist/
app.use(express.static(join(__dirname, 'dist')))

// Одностраничное приложение — все маршруты возвращают index.html
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`TechStore server running at http://localhost:${PORT}`)
  console.log('Mode: baseline (no optimizations)')
})
