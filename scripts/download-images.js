#!/usr/bin/env node

/**
 * Скрипт загрузки реальных фотографий устройств с Pexels API.
 *
 * Использование:
 *   PEXELS_API_KEY=your_key node scripts/download-images.js
 *   PEXELS_API_KEY=your_key node scripts/download-images.js --force   # перезаписать существующие
 */

import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Config ──────────────────────────────────────────────────────────────────

const API_KEY = process.env.PEXELS_API_KEY;
if (!API_KEY) {
  console.error('Error: PEXELS_API_KEY environment variable is required.');
  console.error('Get a free key at https://www.pexels.com/api/');
  process.exit(1);
}

const FORCE = process.argv.includes('--force');
const RATE_LIMIT_MS = 200;
const MAX_RETRIES = 3;

const PRODUCTS_DIR = path.join(__dirname, '..', 'public', 'images', 'products');
const HERO_DIR = path.join(__dirname, '..', 'public', 'images', 'hero');

// ── Search queries per product ──────────────────────────────────────────────

const PRODUCT_QUERIES = [
  // Smartphones (1–8)
  { id: 1, query: 'Samsung Galaxy S24 smartphone' },
  { id: 2, query: 'iPhone 15 Pro' },
  { id: 3, query: 'Xiaomi smartphone' },
  { id: 4, query: 'Samsung Galaxy smartphone' },
  { id: 5, query: 'Google Pixel phone' },
  { id: 6, query: 'Xiaomi Redmi smartphone' },
  { id: 7, query: 'Honor smartphone' },
  { id: 8, query: 'smartphone dark background' },
  // Laptops (9–14)
  { id: 9, query: 'MacBook Air laptop' },
  { id: 10, query: 'gaming laptop RGB' },
  { id: 11, query: 'Lenovo laptop' },
  { id: 12, query: 'thin laptop silver' },
  { id: 13, query: 'ultrabook OLED laptop' },
  { id: 14, query: 'Acer gaming laptop' },
  // Tablets (15–19)
  { id: 15, query: 'iPad Pro tablet' },
  { id: 16, query: 'Samsung Galaxy Tab' },
  { id: 17, query: 'Android tablet' },
  { id: 18, query: 'iPad Air' },
  { id: 19, query: 'tablet digital' },
  // Headphones (20–25)
  { id: 20, query: 'Sony headphones wireless' },
  { id: 21, query: 'AirPods Pro earbuds' },
  { id: 22, query: 'JBL headphones' },
  { id: 23, query: 'wireless earbuds case' },
  { id: 24, query: 'Sennheiser headphones' },
  { id: 25, query: 'wireless earbuds white' },
  // Watches (26–30)
  { id: 26, query: 'Apple Watch smartwatch' },
  { id: 27, query: 'Samsung Galaxy Watch' },
  { id: 28, query: 'smartwatch round face' },
  { id: 29, query: 'Huawei smartwatch' },
  { id: 30, query: 'Garmin smartwatch fitness' },
];

// Fallback queries by category range
const CATEGORY_FALLBACKS = {
  smartphone: 'smartphone device',
  laptop: 'laptop computer',
  tablet: 'tablet device',
  headphones: 'headphones audio',
  watch: 'smartwatch wearable',
};

function getCategoryForId(id) {
  if (id <= 8) return 'smartphone';
  if (id <= 14) return 'laptop';
  if (id <= 19) return 'tablet';
  if (id <= 25) return 'headphones';
  return 'watch';
}

const HERO_QUERIES = [
  { file: 'hero-1.jpg', query: 'electronics store modern' },
  { file: 'hero-2.jpg', query: 'laptop workspace technology' },
  { file: 'hero-3.jpg', query: 'gadgets technology devices' },
];

// ── HTTP helpers ─────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return httpsGet(res.headers.location, headers).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error(`Timeout for ${url}`));
    });
  });
}

async function searchPexels(query, perPage = 5, orientation = 'landscape') {
  const params = new URLSearchParams({ query, per_page: String(perPage), orientation });
  const url = `https://api.pexels.com/v1/search?${params}`;
  const data = await httpsGet(url, { Authorization: API_KEY });
  return JSON.parse(data.toString());
}

async function downloadFile(url, destPath) {
  const data = await httpsGet(url);
  fs.writeFileSync(destPath, data);
  return data.length;
}

async function downloadWithRetry(url, destPath, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await downloadFile(url, destPath);
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`  Retry ${attempt}/${retries} for ${path.basename(destPath)}: ${err.message}`);
      await sleep(500 * attempt);
    }
  }
}

// ── Main logic ───────────────────────────────────────────────────────────────

async function downloadProductImages(product, progress) {
  const suffixes = ['', '-1', '-2', '-3']; // main + 3 gallery
  const files = suffixes.map((s) => `product-${product.id}${s}.jpg`);

  // Check if all exist already (skip unless --force)
  if (!FORCE) {
    const allExist = files.every((f) => fs.existsSync(path.join(PRODUCTS_DIR, f)));
    if (allExist) {
      console.log(`  [${progress}] Product ${product.id}: skipped (already exists)`);
      return files.length;
    }
  }

  // Search Pexels
  let result = await searchPexels(product.query);
  await sleep(RATE_LIMIT_MS);

  // Fallback to broader query if not enough results
  if (result.photos.length < 4) {
    const fallbackQuery = CATEGORY_FALLBACKS[getCategoryForId(product.id)];
    console.log(`  Few results for "${product.query}", trying "${fallbackQuery}"...`);
    result = await searchPexels(fallbackQuery, 8);
    await sleep(RATE_LIMIT_MS);
  }

  if (result.photos.length === 0) {
    console.error(`  ERROR: No photos found for product ${product.id} ("${product.query}")`);
    return 0;
  }

  // Pick up to 4 different photos
  const photos = result.photos.slice(0, 4);
  let downloaded = 0;

  for (let i = 0; i < suffixes.length; i++) {
    const photo = photos[i % photos.length]; // cycle if <4 results
    const fileName = files[i];
    const destPath = path.join(PRODUCTS_DIR, fileName);

    if (!FORCE && fs.existsSync(destPath)) {
      downloaded++;
      continue;
    }

    const imageUrl = photo.src.large2x;
    try {
      const size = await downloadWithRetry(imageUrl, destPath);
      const sizeKB = Math.round(size / 1024);
      console.log(`  [${progress}] ${fileName} — ${sizeKB} KB`);
      downloaded++;
    } catch (err) {
      console.error(`  FAILED: ${fileName} — ${err.message}`);
    }
    await sleep(RATE_LIMIT_MS);
  }

  return downloaded;
}

async function downloadHeroImages(progress) {
  let downloaded = 0;

  for (const hero of HERO_QUERIES) {
    const destPath = path.join(HERO_DIR, hero.file);

    if (!FORCE && fs.existsSync(destPath)) {
      console.log(`  [${progress}] ${hero.file}: skipped (already exists)`);
      downloaded++;
      progress = incrementProgress(progress);
      continue;
    }

    const result = await searchPexels(hero.query, 3);
    await sleep(RATE_LIMIT_MS);

    if (result.photos.length === 0) {
      console.error(`  ERROR: No photos found for hero "${hero.query}"`);
      progress = incrementProgress(progress);
      continue;
    }

    const photo = result.photos[0];
    const imageUrl = photo.src.large2x;

    try {
      const size = await downloadWithRetry(imageUrl, destPath);
      const sizeKB = Math.round(size / 1024);
      console.log(`  [${progress}] ${hero.file} — ${sizeKB} KB`);
      downloaded++;
    } catch (err) {
      console.error(`  FAILED: ${hero.file} — ${err.message}`);
    }
    await sleep(RATE_LIMIT_MS);
    progress = incrementProgress(progress);
  }

  return downloaded;
}

function incrementProgress(progress) {
  const [current, total] = progress.split('/').map(Number);
  return `${current + 1}/${total}`;
}

async function main() {
  const totalImages = PRODUCT_QUERIES.length * 4 + HERO_QUERIES.length; // 120 + 3 = 123
  console.log(`\nPexels Image Downloader`);
  console.log(`======================`);
  console.log(`Total images to download: ${totalImages}`);
  console.log(`Force overwrite: ${FORCE}`);
  console.log(`Products dir: ${PRODUCTS_DIR}`);
  console.log(`Hero dir: ${HERO_DIR}\n`);

  // Ensure directories exist
  fs.mkdirSync(PRODUCTS_DIR, { recursive: true });
  fs.mkdirSync(HERO_DIR, { recursive: true });

  let totalDownloaded = 0;
  let imageIndex = 1;

  // Download product images
  console.log('--- Product Images ---');
  for (const product of PRODUCT_QUERIES) {
    const progress = `${imageIndex}/${totalImages}`;
    const count = await downloadProductImages(product, progress);
    totalDownloaded += count;
    imageIndex += 4;
  }

  // Download hero images
  console.log('\n--- Hero Images ---');
  const heroProgress = `${imageIndex}/${totalImages}`;
  const heroCount = await downloadHeroImages(heroProgress);
  totalDownloaded += heroCount;

  console.log(`\n======================`);
  console.log(`Done! Downloaded ${totalDownloaded}/${totalImages} images.`);

  // Size check
  const productFiles = fs.readdirSync(PRODUCTS_DIR).filter((f) => f.endsWith('.jpg'));
  const sizes = productFiles.map((f) => fs.statSync(path.join(PRODUCTS_DIR, f)).size);
  const avgKB = Math.round(sizes.reduce((a, b) => a + b, 0) / sizes.length / 1024);
  const minKB = Math.round(Math.min(...sizes) / 1024);
  const maxKB = Math.round(Math.max(...sizes) / 1024);
  console.log(`Product image sizes — avg: ${avgKB} KB, min: ${minKB} KB, max: ${maxKB} KB`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
