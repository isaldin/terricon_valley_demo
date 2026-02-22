import type { Product, Category } from '@/types'
import productsData from '@/data/products.json'
import categoriesData from '@/data/categories.json'

export function useProducts() {
  const products = productsData as unknown as Product[]
  const categories = categoriesData as unknown as Category[]

  function getById(id: number | string): Product | undefined {
    return products.find(p => p.id === Number(id))
  }

  function getBestsellers(): Product[] {
    return products.filter(p => p.bestseller)
  }

  function getByCategory(categorySlug: string | null): Product[] {
    if (!categorySlug) return products
    return products.filter(p => p.category === categorySlug)
  }

  function getSimilar(product: Product, limit = 4): Product[] {
    return products
      .filter(p => p.category === product.category && p.id !== product.id)
      .slice(0, limit)
  }

  function getByPriceRange(items: Product[], min: number | null, max: number | null): Product[] {
    return items.filter(p => {
      if (min && p.price < min) return false
      if (max && p.price > max) return false
      return true
    })
  }

  return {
    products,
    categories,
    getById,
    getBestsellers,
    getByCategory,
    getSimilar,
    getByPriceRange
  }
}
