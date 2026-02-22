#!/bin/bash
# Скрипт для загрузки placeholder-изображений с picsum.photos
# Заменить на реальные фото с Unsplash/Pexels перед докладом

BASEDIR="$(cd "$(dirname "$0")/.." && pwd)/public/images"
mkdir -p "$BASEDIR/hero" "$BASEDIR/products" "$BASEDIR/reviews"

echo "Загрузка hero-изображений (1920x800)..."
for i in 1 2 3; do
  curl -sL "https://picsum.photos/seed/hero${i}/1920/800" -o "$BASEDIR/hero/hero-${i}.jpg"
  echo "  hero-${i}.jpg ✓"
done

echo "Загрузка основных фото товаров (800x800)..."
for i in $(seq 1 30); do
  curl -sL "https://picsum.photos/seed/product${i}/800/800" -o "$BASEDIR/products/product-${i}.jpg"
  echo "  product-${i}.jpg ✓"
done

echo "Загрузка галерейных фото (800x800)..."
for i in $(seq 1 30); do
  for j in 1 2 3; do
    curl -sL "https://picsum.photos/seed/product${i}g${j}/800/800" -o "$BASEDIR/products/product-${i}-${j}.jpg"
  done
  echo "  product-${i} gallery ✓"
done

echo "Загрузка аватаров (200x200)..."
for i in $(seq 1 8); do
  curl -sL "https://picsum.photos/seed/avatar${i}/200/200" -o "$BASEDIR/reviews/avatar-${i}.jpg"
  echo "  avatar-${i}.jpg ✓"
done

echo ""
echo "Готово! Загружено:"
echo "  - 3 hero-изображения"
echo "  - 30 фото товаров"
echo "  - 90 галерейных фото"
echo "  - 8 аватаров"
