export interface Product {
  id: number
  name: string
  category: string
  price: number
  oldPrice?: number
  image: string
  images: string[]
  specs: Record<string, string>
  description: string
  inStock: boolean
  bestseller: boolean
}

export interface Category {
  id: number
  slug: string
  name: string
  productCount: number
  image: string
}

export interface Review {
  id: number
  name: string
  avatar: string
  rating: number
  text: string
  date: string
}