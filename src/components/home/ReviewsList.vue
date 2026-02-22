<script setup lang="ts">
import type { Review } from '@/types'
import reviewsData from '@/data/reviews.json'

const reviews = reviewsData as Review[]

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function renderStars(rating: number): string {
  const filled = '★'.repeat(rating)
  const empty = '☆'.repeat(5 - rating)
  return filled + empty
}
</script>

<template>
  <section id="reviews" class="section">
    <div class="container">
      <h2 class="section-title">Отзывы покупателей</h2>
      <div class="reviews-grid">
        <article
          v-for="review in reviews"
          :key="review.id"
          class="review-card"
        >
          <div class="review-card__header">
            <img
              :src="review.avatar"
              :alt="review.name"
              class="review-card__avatar"
              loading="lazy"
              decoding="async"
              width="48"
              height="48"
            >
            <div class="review-card__info">
              <span class="review-card__name">{{ review.name }}</span>
              <span class="stars">{{ renderStars(review.rating) }}</span>
            </div>
          </div>
          <p class="review-card__text">{{ review.text }}</p>
          <time class="review-card__date" :datetime="review.date">
            {{ formatDate(review.date) }}
          </time>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* content-visibility: auto — браузер пропускает рендеринг секции ниже viewport */
#reviews {
  content-visibility: auto;
  contain-intrinsic-size: auto 600px;
}

.reviews-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

.review-card {
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.review-card__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.review-card__avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  object-fit: cover;
  flex-shrink: 0;
}

.review-card__info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.review-card__name {
  font-weight: 600;
  font-size: var(--font-size-base);
  color: var(--color-gray-900);
}

.review-card__text {
  font-size: var(--font-size-sm);
  color: var(--color-gray-600);
  line-height: 1.6;
}

.review-card__date {
  font-size: var(--font-size-xs);
  color: var(--color-gray-400);
  margin-top: auto;
}
</style>
