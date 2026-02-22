<script setup lang="ts">
import { useProducts } from '@/composables/useProducts'
import ProductCard from '@/components/common/ProductCard.vue'

const { products } = useProducts()
</script>

<template>
  <section id="products" class="section">
    <div class="container">
      <h2 class="section-title">Каталог товаров</h2>
      <div class="product-grid">
        <ProductCard
          v-for="product in products"
          :key="product.id"
          :product="product"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
/* content-visibility: auto — браузер пропускает рендеринг секции ниже viewport */
/* contain-intrinsic-size задаёт примерную высоту для корректного скролла */
#products {
  content-visibility: auto;
  contain-intrinsic-size: auto 2000px;
}
</style>
