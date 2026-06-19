import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { getPayload } from 'payload'
import config from '@payload-config'
import { sendShopOrderNotification } from '@/lib/mail'
import { getServerUrl, requireEnv } from '@/lib/env'
import { rateLimit } from '@/lib/rate-limit'
import { extractClientIp, isBlockedEmailDomain, validateAntispamFields } from '@/lib/antispam'
import {
  normalizeCartTotal,
  type CartItem,
  type PaymentMethod,
  type PaymentStatus,
} from '@/lib/shop'

type PrepareRequest = {
  action: 'prepare'
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  postalCode: string
  city: string
  notes?: string
  paymentMethod: PaymentMethod
  items: CartItem[]
  website?: string
  renderTs?: number | string
}

type ConfirmRequest = {
  action: 'confirm'
  orderToken: string
}

type OrderPayload = {
  orderRef: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  postalCode: string
  city: string
  notes?: string
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  total: number
  createdAt: string
  items: CartItem[]
}

const allowedPaylinkHosts = new Set(['pay.raisenow.io'])

function base64UrlEncode(input: string) {
  return Buffer.from(input, 'utf8').toString('base64url')
}

function base64UrlDecode(input: string) {
  return Buffer.from(input, 'base64url').toString('utf8')
}

function getOrderTokenSecret() {
  return requireEnv('SHOP_ORDER_TOKEN_SECRET')
}

function signOrderPayload(payload: OrderPayload) {
  const serialized = JSON.stringify(payload)
  const encoded = base64UrlEncode(serialized)
  const signature = crypto.createHmac('sha256', getOrderTokenSecret()).update(encoded).digest('base64url')
  return `${encoded}.${signature}`
}

function verifyOrderToken(token: string) {
  const parts = token.split('.')
  if (parts.length !== 2) throw new Error('Token format invalid')

  const [encoded, signature] = parts
  const expected = crypto.createHmac('sha256', getOrderTokenSecret()).update(encoded).digest('base64url')

  const valid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  if (!valid) throw new Error('Token signature invalid')

  const payload = JSON.parse(base64UrlDecode(encoded)) as Partial<OrderPayload>
  if (!payload.orderRef || !Array.isArray(payload.items) || payload.items.length === 0) {
    throw new Error('Token payload invalid')
  }

  return {
    ...payload,
    paymentMethod: payload.paymentMethod === 'invoice' ? 'invoice' : 'twint',
    paymentStatus: payload.paymentStatus === 'pending_invoice' ? 'pending_invoice' : 'paid',
  } as OrderPayload
}

async function isOrderConfirmed(orderRef: string): Promise<boolean> {
  const payload = await getPayload({ config })
  const existing = await payload.find({
    collection: 'shop-orders',
    where: { orderRef: { equals: orderRef } },
    limit: 1,
  })
  return existing.totalDocs > 0
}

function isValidCartItem(item: CartItem) {
  return (
    typeof item.productName === 'string' &&
    item.productName.length > 0 &&
    typeof item.edition === 'string' &&
    item.edition.length > 0 &&
    typeof item.variant === 'string' &&
    item.variant.length > 0 &&
    typeof item.size === 'string' &&
    item.size.length > 0 &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0 &&
    item.quantity <= 20 &&
    Number.isFinite(item.unitPrice) &&
    item.unitPrice > 0
  )
}

function hasMaxTwoDecimals(value: number) {
  return Math.abs(value * 100 - Math.round(value * 100)) < 1e-8
}

function isProductionLikeRuntime() {
  return process.env.NODE_ENV === 'production'
}

function getValidatedServerUrl() {
  const parsed = new URL(getServerUrl())
  if (isProductionLikeRuntime() && parsed.hostname === 'localhost') {
    throw new Error('NEXT_PUBLIC_SERVER_URL must not use localhost in production runtime')
  }
  return parsed
}

function getValidatedPaylinkUrl() {
  let parsed: URL
  try {
    parsed = new URL(requireEnv('SHOP_PAYLINK_URL'))
  } catch {
    throw new Error('Invalid SHOP_PAYLINK_URL')
  }

  if (!allowedPaylinkHosts.has(parsed.hostname)) {
    throw new Error(`Invalid SHOP_PAYLINK_URL host: ${parsed.hostname}`)
  }

  return parsed
}

function buildCheckoutUrl(payload: OrderPayload) {
  const serverUrl = getValidatedServerUrl()
  const url = getValidatedPaylinkUrl()

  url.searchParams.set('amount.values', payload.total.toFixed(2))
  url.searchParams.set('amount.custom', 'false')
  url.searchParams.set('supporter.first_name.value', payload.firstName)
  url.searchParams.set('supporter.last_name.value', payload.lastName)
  url.searchParams.set('supporter.email.value', payload.email)
  url.searchParams.set('supporter.phone.value', payload.phone)
  url.searchParams.set('supporter.street.value', payload.address)
  url.searchParams.set('supporter.zip_code.value', payload.postalCode)
  url.searchParams.set('supporter.city.value', payload.city)

  url.searchParams.set('payment_method.values', 'twint')
  url.searchParams.set('payment_method.custom', 'false')

  url.searchParams.set('reference.campaign_subid', payload.orderRef)

  console.info('[shop-order] checkout prepared', {
    orderRef: payload.orderRef,
    total: payload.total,
    paylinkHost: url.host,
    paylinkPath: url.pathname,
    nodeEnv: process.env.NODE_ENV ?? 'undefined',
    serverUrlHost: serverUrl.host,
  })

  return url.toString()
}

async function saveOrderToDb(order: OrderPayload) {
  const payload = await getPayload({ config })
  await payload.create({
    collection: 'shop-orders',
    data: {
      orderRef: order.orderRef,
      firstName: order.firstName,
      lastName: order.lastName,
      email: order.email,
      phone: order.phone,
      address: order.address,
      postalCode: order.postalCode,
      city: order.city,
      notes: order.notes || '',
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      total: order.total,
      items: order.items,
    },
  })
}

async function handlePrepare(body: PrepareRequest) {
  const { firstName, lastName, email, phone, address, postalCode, city, notes, paymentMethod, items, website, renderTs } = body

  const antispam = validateAntispamFields({ honeypot: website, renderTs })
  if (!antispam.ok) {
    if (antispam.reason === 'honeypot') {
      return NextResponse.json({ success: true, orderRef: crypto.randomUUID(), paymentMethod: 'invoice', paymentStatus: 'pending_invoice' })
    }
    return NextResponse.json({ error: 'Verifica anti-spam non superata. Ricarica la pagina e riprova.' }, { status: 400 })
  }

  if (
    !firstName ||
    !lastName ||
    !email ||
    !phone ||
    !address ||
    !postalCode ||
    !city ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return NextResponse.json({ error: 'Dati ordine incompleti.' }, { status: 400 })
  }

  if (isBlockedEmailDomain(email)) {
    return NextResponse.json({ error: 'Indirizzo email non valido.' }, { status: 400 })
  }

  if (!items.every(isValidCartItem)) {
    return NextResponse.json({ error: 'Carrello non valido.' }, { status: 400 })
  }

  if (paymentMethod !== 'twint' && paymentMethod !== 'invoice') {
    return NextResponse.json({ error: 'Metodo di pagamento non valido.' }, { status: 400 })
  }

  const total = normalizeCartTotal(items)
  if (!Number.isFinite(total) || total <= 0 || !hasMaxTwoDecimals(total)) {
    return NextResponse.json({ error: 'Totale ordine non valido.' }, { status: 400 })
  }

  const order: OrderPayload = {
    orderRef: crypto.randomUUID(),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim(),
    phone: phone.trim(),
    address: address.trim(),
    postalCode: postalCode.trim(),
    city: city.trim(),
    notes: notes?.trim() || '',
    paymentMethod,
    paymentStatus: paymentMethod === 'twint' ? 'paid' : 'pending_invoice',
    total,
    createdAt: new Date().toISOString(),
    items,
  }

  if (paymentMethod === 'invoice') {
    if (await isOrderConfirmed(order.orderRef)) {
      return NextResponse.json({
        success: true,
        alreadyConfirmed: true,
        orderRef: order.orderRef,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
      })
    }

    await saveOrderToDb(order)

    try {
      await sendShopOrderNotification(order)
    } catch (emailError) {
      console.error('Failed to send shop order email:', emailError)
    }

    return NextResponse.json({
      success: true,
      orderRef: order.orderRef,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
    })
  }

  const orderToken = signOrderPayload(order)
  const checkoutUrl = buildCheckoutUrl(order)

  return NextResponse.json({ success: true, checkoutUrl, orderToken, orderRef: order.orderRef })
}

async function handleConfirm(body: ConfirmRequest) {
  const { orderToken } = body
  if (!orderToken) {
    return NextResponse.json({ error: 'Token ordine mancante.' }, { status: 400 })
  }

  const order = verifyOrderToken(orderToken)
  const createdAtMs = new Date(order.createdAt).getTime()
  const isExpired = Number.isNaN(createdAtMs) || Date.now() - createdAtMs > 1000 * 60 * 60 * 24

  if (isExpired) {
    return NextResponse.json({ error: 'Ordine scaduto, riprovare dal carrello.' }, { status: 400 })
  }

  if (await isOrderConfirmed(order.orderRef)) {
    return NextResponse.json({
      success: true,
      alreadyConfirmed: true,
      orderRef: order.orderRef,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
    })
  }

  await saveOrderToDb(order)

  try {
    await sendShopOrderNotification(order)
  } catch (emailError) {
    console.error('Failed to send shop order email:', emailError)
  }

  return NextResponse.json({
    success: true,
    orderRef: order.orderRef,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
  })
}

export async function POST(request: Request) {
  const ip = extractClientIp(request)
  const { allowed } = rateLimit({ key: `shop-order:${ip}`, limit: 3, windowMs: 60_000 })
  if (!allowed) {
    return NextResponse.json({ error: 'Troppe richieste. Riprova più tardi.' }, { status: 429 })
  }

  try {
    const body = (await request.json()) as Record<string, unknown>

    if (body.action === 'prepare') {
      return handlePrepare(body as PrepareRequest)
    }

    if (body.action === 'confirm') {
      return handleConfirm(body as ConfirmRequest)
    }

    return NextResponse.json({ error: 'Azione non valida.' }, { status: 400 })
  } catch (error) {
    console.error('Shop order error:', error)
    return NextResponse.json({ error: 'Si è verificato un errore. Riprova più tardi.' }, { status: 500 })
  }
}
