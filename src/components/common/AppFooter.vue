<template>
  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-columns">
        <div class="footer-col">
          <h3 class="footer-title">TechStore</h3>
          <p class="footer-text">
            Интернет-магазин электроники и гаджетов. Лучшие цены, быстрая доставка и гарантия качества.
          </p>
        </div>

        <div class="footer-col">
          <h3 class="footer-title">Навигация</h3>
          <ul class="footer-nav">
            <li><a href="#" class="footer-link">Главная</a></li>
            <li><a href="#products" class="footer-link">Каталог</a></li>
            <li><a href="#reviews" class="footer-link">Отзывы</a></li>
            <li><a href="#about" class="footer-link">О нас</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h3 class="footer-title">Контакты</h3>
          <ul class="footer-contacts">
            <li>+7 (495) 123-45-67</li>
            <li>info@techstore.ru</li>
            <li>Москва, ул. Примерная, 42</li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <p>&copy; 2024 TechStore. Все права защищены.</p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
</script>

<style scoped>
.footer {
  background: var(--color-gray-800);
  color: var(--color-white);
  padding: var(--spacing-3xl) 0 var(--spacing-lg);
}

.footer-inner {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: 0 var(--container-padding);
}

.footer-columns {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: var(--spacing-2xl);
}

.footer-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-md);
}

.footer-text {
  color: var(--color-gray-400);
  font-size: var(--font-size-sm);
  line-height: 1.6;
}

.footer-nav {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.footer-link {
  color: var(--color-gray-400);
  text-decoration: none;
  font-size: var(--font-size-sm);
  transition: color var(--transition-fast);
}

.footer-link:hover {
  color: var(--color-white);
}

.footer-contacts {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  color: var(--color-gray-400);
  font-size: var(--font-size-sm);
}

.footer-bottom {
  margin-top: var(--spacing-2xl);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-gray-700);
  text-align: center;
  color: var(--color-gray-500);
  font-size: var(--font-size-sm);
}
</style>
