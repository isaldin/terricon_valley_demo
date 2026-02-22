<script setup lang="ts">
import { onMounted, ref } from 'vue'

declare const L: any

const mapContainer = ref<HTMLDivElement | null>(null)

// Leaflet загружен глобально через CDN в index.html (blocking — anti-pattern)
onMounted(() => {
  if (typeof L !== 'undefined' && mapContainer.value) {
    const map = L.map(mapContainer.value).setView([55.7558, 37.6173], 15)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map)

    L.marker([55.7558, 37.6173])
      .addTo(map)
      .bindPopup('TechStore — Главный офис')
      .openPopup()
  }
})
</script>

<template>
  <section id="about" class="section about">
    <div class="container">
      <h2 class="section-title">О компании</h2>

      <div class="about__content">
        <div class="about__section">
          <h3>TechStore — ваш надёжный магазин электроники</h3>
          <p>
            Мы работаем на рынке электроники с 2015 года и предлагаем нашим покупателям
            только оригинальную продукцию от ведущих мировых брендов. Наша миссия —
            сделать современные технологии доступными каждому.
          </p>
          <p>
            В нашем каталоге более 10 000 товаров: смартфоны, ноутбуки, планшеты,
            наушники, умные часы и аксессуары. Мы тщательно отбираем каждый товар
            и гарантируем его качество.
          </p>
        </div>

        <div class="about__section">
          <h3>Наши преимущества</h3>
          <div class="about__features">
            <div class="feature-card">
              <div class="feature-card__icon">🚚</div>
              <h4>Быстрая доставка</h4>
              <p>Доставляем по всей России за 1-3 дня. Бесплатная доставка при заказе от 5 000 ₽.</p>
            </div>
            <div class="feature-card">
              <div class="feature-card__icon">✅</div>
              <h4>Гарантия качества</h4>
              <p>Официальная гарантия на всю продукцию. Возврат в течение 14 дней.</p>
            </div>
            <div class="feature-card">
              <div class="feature-card__icon">💬</div>
              <h4>Поддержка 24/7</h4>
              <p>Наши консультанты готовы помочь вам в любое время дня и ночи.</p>
            </div>
          </div>
        </div>

        <div class="about__section">
          <h3>Наш офис</h3>
          <div ref="mapContainer" class="about__map"></div>
        </div>

        <div class="about__section about__contacts">
          <h3>Контакты</h3>
          <div class="contacts-grid">
            <div class="contact-item">
              <strong>Адрес</strong>
              <p>г. Москва, ул. Тверская, д. 12, стр. 1</p>
            </div>
            <div class="contact-item">
              <strong>Телефон</strong>
              <p><a href="tel:+74951234567">+7 (495) 123-45-67</a></p>
            </div>
            <div class="contact-item">
              <strong>Email</strong>
              <p><a href="mailto:info@techstore.ru">info@techstore.ru</a></p>
            </div>
            <div class="contact-item">
              <strong>Режим работы</strong>
              <p>Пн-Пт: 9:00 — 21:00<br>Сб-Вс: 10:00 — 20:00</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.about__content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2xl);
}

.about__section h3 {
  margin-bottom: var(--spacing-lg);
}

.about__section p {
  color: var(--color-gray-600);
  line-height: 1.8;
  margin-bottom: var(--spacing-md);
}

.about__features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-lg);
}

.feature-card {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  text-align: center;
  box-shadow: var(--shadow-sm);
}

.feature-card__icon {
  font-size: 2.5rem;
  margin-bottom: var(--spacing-md);
}

.feature-card h4 {
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size-lg);
}

.feature-card p {
  font-size: var(--font-size-sm);
}

.about__map {
  height: 400px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.contacts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-lg);
}

.contact-item {
  background: var(--color-white);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.contact-item strong {
  display: block;
  margin-bottom: var(--spacing-sm);
  color: var(--color-gray-900);
}

.contact-item p {
  margin-bottom: 0;
}

@media (max-width: 768px) {
  .about__features {
    grid-template-columns: 1fr;
  }

  .contacts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
