export type CartItem = {
  productName: string
  edition: string
  variant: string
  size: string
  quantity: number
  unitPrice: number
}

export type PaymentMethod = 'twint' | 'invoice'
export type PaymentStatus = 'paid' | 'pending_invoice'

export const SHOP_PENDING_ORDER_TOKEN_STORAGE_KEY = 'cvlt-shop-pending-order-token'

const tshirt2023PromoProducts = new Set(['T-Shirt Uomo', 'T-Shirt Donna'])

export function formatCurrency(value: number) {
  return `CHF ${value.toFixed(2)}`
}

export function calculateTshirt2023Discount(items: CartItem[]) {
  let pairCount = 0

  for (const productName of tshirt2023PromoProducts) {
    let grayQty = 0
    let yellowQty = 0
    for (const item of items) {
      if (item.productName !== productName) continue
      if (item.variant.startsWith('Grigia')) grayQty += item.quantity
      if (item.variant.startsWith('Gialla')) yellowQty += item.quantity
    }
    pairCount += Math.min(grayQty, yellowQty)
  }

  return pairCount * 5
}

export function normalizeCartTotal(items: CartItem[]) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const discount = calculateTshirt2023Discount(items)
  return Math.round(Math.max(subtotal - discount, 0) * 100) / 100
}
