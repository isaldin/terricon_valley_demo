<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Slide {
  id: number
  image: string
  title: string
  subtitle: string
}

const slides: Slide[] = [
  {
    id: 1,
    image: '/images/hero/hero-1.jpg',
    title: 'Новинки сезона',
    subtitle: 'Лучшая электроника по выгодным ценам'
  },
  {
    id: 2,
    image: '/images/hero/hero-2.jpg',
    title: 'Ноутбуки для работы',
    subtitle: 'Производительность без компромиссов'
  },
  {
    id: 3,
    image: '/images/hero/hero-3.jpg',
    title: 'Умные гаджеты',
    subtitle: 'Технологии будущего уже сегодня'
  }
]

const currentSlide = ref(0)
let intervalId: ReturnType<typeof setInterval> | null = null

function goToSlide(index: number) {
  currentSlide.value = index
}

function startAutoRotate() {
  intervalId = setInterval(() => {
    currentSlide.value = (currentSlide.value + 1) % slides.length
  }, 5000)
}

onMounted(() => {
  startAutoRotate()
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})
</script>

<template>
  <section class="hero-slider">
    <!-- Убран eager preload всех слайдов — загружаем только активный -->
    <div class="hero-slider__track">
      <div
        v-for="(slide, index) in slides"
        :key="slide.id"
        class="hero-slider__slide"
        :class="{ 'hero-slider__slide--active': index === currentSlide }"
      >
        <!-- fetchpriority="high" на первом слайде (LCP), lazy на остальных -->
        <img
          :src="slide.image"
          :alt="slide.title"
          class="hero-slider__image"
          width="1280"
          height="500"
          decoding="async"
          :fetchpriority="index === 0 ? 'high' : 'low'"
          :loading="index === 0 ? 'eager' : 'lazy'"
        >
        <div class="hero-slider__overlay">
          <div class="container hero-slider__content">
            <h1 class="hero-slider__title">{{ slide.title }}</h1>
            <p class="hero-slider__subtitle">{{ slide.subtitle }}</p>
            <a href="#products" class="btn btn-primary btn-lg hero-slider__cta">
              Смотреть каталог
            </a>
          </div>
        </div>
      </div>
    </div>

    <div class="hero-slider__dots">
      <button
        v-for="(slide, index) in slides"
        :key="'dot-' + slide.id"
        class="hero-slider__dot"
        :class="{ 'hero-slider__dot--active': index === currentSlide }"
        :aria-label="`Перейти к слайду ${index + 1}`"
        @click="goToSlide(index)"
      />
    </div>
  </section>
</template>

<style scoped>
.hero-slider {
  position: relative;
  height: 500px;
  overflow: hidden;
}

.hero-slider__track {
  position: relative;
  height: 100%;
}

.hero-slider__slide {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity var(--transition-slow);
}

/* img вместо background-image — позволяет использовать loading/fetchpriority/decoding */
.hero-slider__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-slider__slide--active {
  opacity: 1;
}

.hero-slider__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to right,
    rgba(0, 0, 0, 0.7) 0%,
    rgba(0, 0, 0, 0.4) 50%,
    rgba(0, 0, 0, 0.2) 100%
  );
  display: flex;
  align-items: center;
}

.hero-slider__content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-md);
}

.hero-slider__title {
  font-size: var(--font-size-4xl);
  color: var(--color-white);
  font-weight: 600;
}

.hero-slider__subtitle {
  font-size: var(--font-size-xl);
  color: var(--color-gray-200);
  max-width: 480px;
}

.hero-slider__cta {
  margin-top: var(--spacing-sm);
}

.hero-slider__dots {
  position: absolute;
  bottom: var(--spacing-xl);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: var(--spacing-sm);
}

.hero-slider__dot {
  width: 12px;
  height: 12px;
  border-radius: var(--radius-full);
  background-color: rgba(255, 255, 255, 0.4);
  border: none;
  cursor: pointer;
  transition: background-color var(--transition-fast);
  padding: 0;
}

.hero-slider__dot:hover {
  background-color: rgba(255, 255, 255, 0.7);
}

.hero-slider__dot--active {
  background-color: var(--color-white);
}
</style>
