import sharp from 'sharp'
import { readdir, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const CONFIGS = [
  { dir: 'public/images/products', width: 800,  quality: 75 },
  { dir: 'public/images/hero',     width: 1600, quality: 80 },
  { dir: 'public/images/reviews',  width: 200,  quality: 70 },
]

async function optimizeDir({ dir, width, quality }) {
  const files = (await readdir(dir)).filter(f => /\.jpe?g$/i.test(f))
  let totalBefore = 0
  let totalAfter = 0

  console.log(`\n📁 ${dir} (${files.length} files, resize to ${width}px, quality ${quality})`)
  console.log('─'.repeat(60))

  for (const file of files) {
    const filePath = join(dir, file)
    const before = (await stat(filePath)).size

    const buffer = await sharp(filePath)
      .resize({ width, withoutEnlargement: true })
      .jpeg({ quality, progressive: true })
      .toBuffer()

    await writeFile(filePath, buffer)
    const after = buffer.length

    totalBefore += before
    totalAfter += after

    const saved = ((1 - after / before) * 100).toFixed(0)
    console.log(`  ${file}: ${kb(before)} → ${kb(after)} (−${saved}%)`)
  }

  return { totalBefore, totalAfter }
}

function kb(bytes) {
  return `${(bytes / 1024).toFixed(0)} KB`
}

async function main() {
  console.log('🖼️  Оптимизация картинок для демо\n')

  let grandBefore = 0
  let grandAfter = 0

  for (const config of CONFIGS) {
    const { totalBefore, totalAfter } = await optimizeDir(config)
    grandBefore += totalBefore
    grandAfter += totalAfter
  }

  const savedPercent = ((1 - grandAfter / grandBefore) * 100).toFixed(0)
  console.log('\n' + '═'.repeat(60))
  console.log(`✅ Итого: ${kb(grandBefore)} → ${kb(grandAfter)} (−${savedPercent}%)`)
}

main().catch(console.error)
