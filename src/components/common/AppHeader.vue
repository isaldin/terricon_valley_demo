<template>
  <header class="header">
    <div class="header-inner">
      <a href="#" class="logo">TechStore</a>

      <nav class="nav">
        <a href="#products" class="nav-link">Каталог</a>
        <a href="#reviews" class="nav-link">Отзывы</a>
        <a href="#about" class="nav-link">О нас</a>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
</script>

<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-height);
  background: var(--color-white);
  box-shadow: var(--shadow-md);
  z-index: 100;
}

.header-inner {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: 0 var(--container-padding);
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-primary);
  text-decoration: none;
  letter-spacing: -0.02em;
}

.nav {
  display: flex;
  gap: var(--spacing-lg);
}

.nav-link {
  color: var(--color-gray-700);
  text-decoration: none;
  font-size: var(--font-size-base);
  font-weight: 500;
  transition: color var(--transition-fast);
}

.nav-link:hover {
  color: var(--color-primary);
}
</style>
