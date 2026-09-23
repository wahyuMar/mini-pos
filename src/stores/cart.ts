import { reactive } from 'vue'
import { cartSubtotal, type SaleLine } from '../domain/checkout'

export type CartItem = SaleLine & {
  productId: number
  name: string
}

const items = reactive<CartItem[]>([])

export function cartItems(): CartItem[] {
  return items
}

export function addToCart(product: { id: number; name: string; price: number }): void {
  const existing = items.find((item) => item.productId === product.id)
  if (existing) {
    existing.quantity += 1
    return
  }
  items.push({
    productId: product.id,
    name: product.name,
    unitPrice: product.price,
    quantity: 1,
  })
}

export function setCartQuantity(productId: number, quantity: number): void {
  const index = items.findIndex((item) => item.productId === productId)
  if (index < 0) return
  if (quantity < 1) {
    items.splice(index, 1)
    return
  }
  const item = items[index]
  if (!item) return
  item.quantity = quantity
}

export function removeFromCart(productId: number): void {
  setCartQuantity(productId, 0)
}

export function clearCart(): void {
  items.splice(0, items.length)
}

export function currentSubtotal(): number {
  return cartSubtotal(items)
}
