#!/usr/bin/env bash
set -euo pipefail

# ─── Lighthouse Report — сводная таблица по всем веткам ───
# Читает benchmark-results/*.json и выводит ASCII-таблицу с дельтами

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RESULTS_DIR="$ROOT/benchmark-results"

# Порядок отображения веток
BRANCH_ORDER="main iter-1-splitting iter-2-loading iter-3-rendering iter-4-caching"

# Проверяем наличие результатов
shopt -s nullglob
FILES=("$RESULTS_DIR"/*.json)
shopt -u nullglob

if [ ${#FILES[@]} -eq 0 ]; then
  echo "❌ Нет результатов в $RESULTS_DIR/"
  echo "   Сначала запустите: ./scripts/lighthouse-bench.sh"
  exit 1
fi

echo "📊 Lighthouse Benchmark — сводная таблица"
echo ""

# Собираем данные в упорядоченный JSON-массив
node -e "
  const fs = require('fs');
  const path = require('path');
  const dir = '$RESULTS_DIR';
  const order = '$BRANCH_ORDER'.split(' ');

  // Читаем все JSON-файлы
  const data = {};
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== '.gitkeep');
  for (const f of files) {
    try {
      const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
      data[d.branch] = d;
    } catch {}
  }

  // Упорядочиваем
  const results = [];
  for (const branch of order) {
    if (data[branch]) results.push(data[branch]);
    delete data[branch];
  }
  // Добавляем остальные (неизвестные ветки) в конец
  for (const d of Object.values(data)) {
    results.push(d);
  }

  if (results.length === 0) {
    console.log('Нет данных для отображения.');
    process.exit(0);
  }

  // ─── Форматирование ───
  function fmtMs(ms) {
    if (ms === null || ms === undefined) return '  N/A ';
    if (ms >= 1000) return ((ms / 1000).toFixed(1) + 's').padStart(6);
    return (Math.round(ms) + 'ms').padStart(6);
  }

  function fmtCls(val) {
    if (val === null || val === undefined) return ' N/A ';
    return val.toFixed(3).padStart(5);
  }

  function fmtScore(val) {
    if (val === null || val === undefined) return ' N/A';
    return String(val).padStart(4);
  }

  function fmtDelta(current, baseline, lowerIsBetter) {
    if (current === null || baseline === null || baseline === 0) return '      ';
    const pct = ((current - baseline) / baseline) * 100;
    const sign = lowerIsBetter ? (pct <= 0 ? '\\x1b[32m' : '\\x1b[31m') : (pct >= 0 ? '\\x1b[32m' : '\\x1b[31m');
    const reset = '\\x1b[0m';
    const str = pct <= 0 ? pct.toFixed(0) + '%' : '+' + pct.toFixed(0) + '%';
    return sign + str.padStart(5) + reset;
  }

  function fmtScoreDelta(current, baseline) {
    if (current === null || baseline === null) return '      ';
    const diff = current - baseline;
    const sign = diff >= 0 ? '\\x1b[32m' : '\\x1b[31m';
    const reset = '\\x1b[0m';
    const str = diff >= 0 ? '+' + diff : '' + diff;
    return sign + str.toString().padStart(4) + reset;
  }

  // ─── Таблица метрик ───
  const top    = '┌──────────────────┬───────┬────────┬────────┬────────┬───────┬────────┐';
  const header = '│ Iteration        │ Score │  FCP   │  LCP   │  TBT   │  CLS  │   SI   │';
  const sep    = '├──────────────────┼───────┼────────┼────────┼────────┼───────┼────────┤';
  const bottom = '└──────────────────┴───────┴────────┴────────┴────────┴───────┴────────┘';

  console.log(top);
  console.log(header);
  console.log(sep);

  for (const r of results) {
    const label = r.label.padEnd(16);
    const m = r.metrics;
    const line = '│ ' + label + ' │' + fmtScore(m.score) + '   │' + fmtMs(m.fcp) + '  │' + fmtMs(m.lcp) + '  │' + fmtMs(m.tbt) + '  │' + fmtCls(m.cls) + ' │' + fmtMs(m.si) + '  │';
    console.log(line);
  }

  console.log(bottom);

  // ─── Дельты ───
  if (results.length >= 2) {
    const baseline = results[0].metrics;

    console.log('');
    console.log('Дельта относительно ' + results[0].label + ' (' + results[0].branch + '):');
    console.log('');

    const dtop    = '┌──────────────────┬────────┬────────┬────────┬────────┬────────┬────────┐';
    const dheader = '│ Iteration        │ Score  │  FCP   │  LCP   │  TBT   │  CLS   │   SI   │';
    const dsep    = '├──────────────────┼────────┼────────┼────────┼────────┼────────┼────────┤';
    const dbottom = '└──────────────────┴────────┴────────┴────────┴────────┴────────┴────────┘';

    console.log(dtop);
    console.log(dheader);
    console.log(dsep);

    for (let i = 1; i < results.length; i++) {
      const r = results[i];
      const m = r.metrics;
      const label = r.label.padEnd(16);
      const line = '│ ' + label + ' │ '
        + fmtScoreDelta(m.score, baseline.score) + ' │ '
        + fmtDelta(m.fcp, baseline.fcp, true) + ' │ '
        + fmtDelta(m.lcp, baseline.lcp, true) + ' │ '
        + fmtDelta(m.tbt, baseline.tbt, true) + ' │ '
        + fmtDelta(m.cls, baseline.cls, true) + ' │ '
        + fmtDelta(m.si, baseline.si, true) + ' │';
      console.log(line);
    }

    console.log(dbottom);
  }

  // ─── Мета ───
  console.log('');
  for (const r of results) {
    const ts = new Date(r.timestamp).toLocaleString('ru-RU');
    console.log('  ' + r.branch.padEnd(20) + ' ' + r.runs + ' прогон(ов)  ' + ts);
  }
"
