<script setup lang="ts">
import AppHeader from '@/components/common/AppHeader.vue'
import AppFooter from '@/components/common/AppFooter.vue'
import HeroSlider from '@/components/home/HeroSlider.vue'
import ProductsSection from '@/components/ProductsSection.vue'
import ReviewsList from '@/components/home/ReviewsList.vue'
import AboutSection from '@/components/AboutSection.vue'
</script>

<template>
  <div class="app">
    <AppHeader />
    <main class="main">
      <HeroSlider />
      <ProductsSection />
      <ReviewsList />
      <AboutSection />
    </main>
    <AppFooter />
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main {
  flex: 1;
  padding-top: var(--header-height);
}
</style>
