<template>
  <div class="product-card">
    <div class="image-wrapper">
      <!-- loading="lazy" + width/height предотвращают CLS и откладывают загрузку -->
      <img
        :src="product.image"
        :alt="product.name"
        class="product-image"
        loading="lazy"
        decoding="async"
        width="400"
        height="300"
      />
      <span v-if="product.bestseller" class="badge-hit">Хит</span>
    </div>

    <div class="card-body">
      <span class="product-name">{{ product.name }}</span>

      <div class="price-row">
        <span class="price">{{ formatPrice(product.price) }}</span>
        <span v-if="product.oldPrice" class="old-price">{{ formatPrice(product.oldPrice) }}</span>
      </div>

      <button class="btn-cart">В корзину</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Product } from '@/types'

defineProps<{
  product: Product
}>()

function formatPrice(price: number): string {
  return price.toLocaleString('ru-RU') + ' \u20BD'
}
</script>

<style scoped>
.product-card {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: box-shadow var(--transition-base);
  display: flex;
  flex-direction: column;
}

.product-card:hover {
  box-shadow: var(--shadow-md);
}

.image-wrapper {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: var(--color-gray-100);
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.badge-hit {
  position: absolute;
  top: var(--spacing-sm);
  left: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-accent);
  color: var(--color-white);
  font-size: var(--font-size-xs);
  font-weight: 600;
  border-radius: var(--radius-sm);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.card-body {
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  flex: 1;
}

.product-name {
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--color-gray-900);
  line-height: 1.4;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-sm);
  margin-top: auto;
}

.price {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-gray-900);
}

.old-price {
  font-size: var(--font-size-sm);
  color: var(--color-gray-400);
  text-decoration: line-through;
}

.btn-cart {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.btn-cart:hover {
  background: var(--color-primary-dark);
}
</style>
