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

export const SHOP_RESERVATION_TTL_MS = 2 * 60 * 60 * 1000

export function formatCurrency(value: number) {
  return `CHF ${value.toFixed(2)}`
}

export function normalizeCartTotal(items: CartItem[]) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  return Math.round(Math.max(subtotal, 0) * 100) / 100
}
