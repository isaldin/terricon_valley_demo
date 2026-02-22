import { createServer } from 'http';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import { PDFDocument } from 'pdf-lib';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..', 'presentation');
const OUTPUT = join(ROOT, 'slides.pdf');
const PORT = 9876;

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

// Простой статический сервер для presentation/
const server = createServer((req, res) => {
  let url = req.url.split('?')[0];
  if (url === '/') url = '/index.html';

  const filePath = join(ROOT, url);
  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = extname(filePath);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  res.end(readFileSync(filePath));
});

async function exportPdf() {
  return new Promise((resolve, reject) => {
    server.listen(PORT, async () => {
      console.log(`Сервер запущен на http://localhost:${PORT}`);
      console.log('Экспорт в PDF...');

      let browser;
      try {
        browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 2 });

        // Загружаем презентацию в обычном режиме (без ?print-pdf)
        await page.goto(`http://localhost:${PORT}/index.html`, {
          waitUntil: 'load',
          timeout: 60_000,
        });

        // Ждём инициализацию reveal.js
        await page.waitForFunction(
          () => typeof Reveal !== 'undefined' && Reveal.isReady(),
          { timeout: 30_000 },
        );
        await new Promise((r) => setTimeout(r, 2000));

        // Отключаем переходы для чистых скриншотов
        await page.evaluate(() => {
          Reveal.configure({ transition: 'none', backgroundTransition: 'none' });
        });

        // Получаем количество слайдов
        const totalSlides = await page.evaluate(() => {
          const indices = Reveal.getSlides().map((s) => Reveal.getIndices(s));
          return indices;
        });

        console.log(`Слайдов: ${totalSlides.length}`);

        // Скриншот каждого слайда → собираем PDF
        const pdf = await PDFDocument.create();

        for (let i = 0; i < totalSlides.length; i++) {
          const { h, v } = totalSlides[i];
          await page.evaluate(
            (hh, vv) => {
              Reveal.slide(hh, vv);
              // Показываем все фрагменты на текущем слайде
              Reveal.getSlides()[Reveal.getIndices().h]
                ?.querySelectorAll('.fragment')
                .forEach((f) => {
                  f.classList.add('visible', 'current-fragment');
                });
            },
            h,
            v,
          );
          await new Promise((r) => setTimeout(r, 300));

          const screenshot = await page.screenshot({ type: 'png' });

          const image = await pdf.embedPng(screenshot);
          const pdfPage = pdf.addPage([1280, 720]);
          pdfPage.drawImage(image, {
            x: 0,
            y: 0,
            width: 1280,
            height: 720,
          });

          process.stdout.write(`\r  ${i + 1}/${totalSlides.length}`);
        }

        const pdfBytes = await pdf.save();
        writeFileSync(OUTPUT, pdfBytes);

        console.log(`\nPDF сохранён: ${OUTPUT}`);
        resolve();
      } catch (e) {
        console.error('Ошибка экспорта:', e.message);
        reject(e);
      } finally {
        if (browser) await browser.close();
        server.close();
      }
    });
  });
}

try {
  await exportPdf();
} catch {
  process.exit(1);
}
