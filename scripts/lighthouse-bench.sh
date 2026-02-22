#!/usr/bin/env bash
set -euo pipefail

# ─── Lighthouse Benchmark — замер текущей ветки ───
# Использование:
#   ./scripts/lighthouse-bench.sh [--runs=N] [--https]
#
# Билдит проект, запускает сервер, прогоняет Lighthouse N раз,
# сохраняет медиану в benchmark-results/<branch>.json

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PORT=3000
RUNS=3
USE_HTTPS=false
SERVER_PID=""

# Временная директория для метрик текущего запуска
TMPDIR_METRICS=$(mktemp -d /tmp/lh-bench-XXXXXX)

# ─── Маппинг branch → label ───
get_label() {
  case "$1" in
    main)              echo "Baseline" ;;
    iter-1-splitting)  echo "+ Splitting" ;;
    iter-2-loading)    echo "+ Loading" ;;
    iter-3-rendering)  echo "+ Rendering" ;;
    iter-4-caching)    echo "+ Caching" ;;
    *)                 echo "$1" ;;
  esac
}

# ─── Аргументы ───
for arg in "$@"; do
  case "$arg" in
    --runs=*) RUNS="${arg#--runs=}" ;;
    --https)  USE_HTTPS=true ;;
  esac
done

# ─── Kill server ───
kill_server() {
  if [ -n "$SERVER_PID" ]; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
    SERVER_PID=""
  fi
  lsof -ti:"$PORT" | xargs kill -9 2>/dev/null || true
}

# ─── Cleanup (EXIT trap) ───
cleanup() {
  kill_server
  rm -rf "$TMPDIR_METRICS"
}
trap cleanup EXIT INT TERM

# ─── Preflight ───
BRANCH=$(git -C "$ROOT" branch --show-current)
LABEL=$(get_label "$BRANCH")

if ! command -v lighthouse &>/dev/null; then
  echo "❌ lighthouse CLI не найден. Установите: npm install -g lighthouse"
  exit 1
fi

echo "🚀 Lighthouse Benchmark"
echo "   Ветка:    $BRANCH ($LABEL)"
echo "   Прогонов: $RUNS"
echo "   HTTPS:    $USE_HTTPS"
echo "───────────────────────────────────────"

# ─── 1. Build ───
echo "📦 npm run build..."
(cd "$ROOT" && npm run build) > /dev/null 2>&1

# ─── 2. Start server ───
echo "🖥️  Запуск сервера..."
kill_server  # убиваем предыдущий, если есть
(cd "$ROOT" && node server.js) &
SERVER_PID=$!

# ─── 3. Ждём сервер ───
if [ "$USE_HTTPS" = true ]; then
  URL="https://localhost:${PORT}"
  CURL_FLAGS="-k"
else
  URL="http://localhost:${PORT}"
  CURL_FLAGS=""
fi

echo "⏳ Ожидание $URL..."
for i in $(seq 1 30); do
  if curl -s -o /dev/null -w '' $CURL_FLAGS "$URL" 2>/dev/null; then
    echo "   ✅ Сервер готов"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "❌ Сервер не ответил за 30 попыток"
    exit 1
  fi
  sleep 0.5
done

# ─── 4. Lighthouse runs ───
CHROME_FLAGS=""
if [ "$USE_HTTPS" = true ]; then
  CHROME_FLAGS='--chrome-flags=--ignore-certificate-errors'
fi

for run in $(seq 1 "$RUNS"); do
  LH_TMPFILE="$TMPDIR_METRICS/lh-raw-${run}.json"
  METRICS_FILE="$TMPDIR_METRICS/run-${run}.json"

  echo "🔍 Прогон $run/$RUNS..."
  lighthouse "$URL" \
    --output=json \
    --output-path="$LH_TMPFILE" \
    --only-categories=performance \
    --preset=perf \
    --form-factor=mobile \
    --throttling-method=simulate \
    --quiet \
    $CHROME_FLAGS 2>/dev/null || true

  # Извлекаем метрики из Lighthouse JSON → компактный JSON-файл
  node -e "
    const fs = require('fs');
    const lhFile = process.argv[1];
    const outFile = process.argv[2];
    try {
      const lhr = JSON.parse(fs.readFileSync(lhFile, 'utf-8'));
      const a = lhr.audits || {};
      const s = lhr.categories?.performance?.score;
      const metrics = {
        score: s != null ? Math.round(s * 100) : null,
        fcp: a['first-contentful-paint']?.numericValue ?? null,
        lcp: a['largest-contentful-paint']?.numericValue ?? null,
        tbt: a['total-blocking-time']?.numericValue ?? null,
        cls: a['cumulative-layout-shift']?.numericValue ?? null,
        si: a['speed-index']?.numericValue ?? null
      };
      fs.writeFileSync(outFile, JSON.stringify(metrics));
      console.log('   Score: ' + metrics.score + ' | FCP: ' + Math.round(metrics.fcp || 0) + ' | LCP: ' + Math.round(metrics.lcp || 0));
    } catch(e) {
      fs.writeFileSync(outFile, JSON.stringify({score:null,fcp:null,lcp:null,tbt:null,cls:null,si:null}));
      console.log('   ⚠️  Не удалось извлечь метрики');
    }
  " "$LH_TMPFILE" "$METRICS_FILE"

  rm -f "$LH_TMPFILE"
done

# ─── 5. Медиана + сохранение результата (один Node-скрипт) ───
OUTDIR="$ROOT/benchmark-results"
mkdir -p "$OUTDIR"
OUTFILE="$OUTDIR/${BRANCH}.json"

node -e "
  const fs = require('fs');
  const path = require('path');
  const metricsDir = process.argv[1];
  const outFile = process.argv[2];
  const branch = process.argv[3];
  const label = process.argv[4];
  const runs = parseInt(process.argv[5], 10);

  // Читаем все прогоны
  const allRuns = [];
  for (let i = 1; i <= runs; i++) {
    const f = path.join(metricsDir, 'run-' + i + '.json');
    try {
      allRuns.push(JSON.parse(fs.readFileSync(f, 'utf-8')));
    } catch {}
  }

  // Медиана
  function median(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  const keys = ['score', 'fcp', 'lcp', 'tbt', 'cls', 'si'];
  const metrics = {};
  for (const key of keys) {
    const vals = allRuns.map(r => r[key]).filter(v => v !== null && v !== undefined);
    metrics[key] = vals.length > 0 ? median(vals) : null;
  }

  // Вывод
  function fmtMs(v) { return v == null ? 'N/A' : v >= 1000 ? (v/1000).toFixed(1)+'s' : Math.round(v)+'ms'; }
  console.log('');
  console.log('📊 Медиана (' + runs + ' прогонов):');
  console.log('   Score: ' + metrics.score + ' | FCP: ' + fmtMs(metrics.fcp) + ' | LCP: ' + fmtMs(metrics.lcp) + ' | TBT: ' + fmtMs(metrics.tbt) + ' | CLS: ' + (metrics.cls != null ? metrics.cls.toFixed(3) : 'N/A') + ' | SI: ' + fmtMs(metrics.si));

  // Сохраняем
  const result = {
    branch,
    label,
    timestamp: new Date().toISOString(),
    runs,
    metrics,
    allRuns
  };
  fs.writeFileSync(outFile, JSON.stringify(result, null, 2));
  console.log('');
  console.log('💾 Сохранено: ' + outFile);
" "$TMPDIR_METRICS" "$OUTFILE" "$BRANCH" "$LABEL" "$RUNS"
