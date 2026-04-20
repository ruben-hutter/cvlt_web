import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { sendShopOrderNotification } from '@/lib/mail'
import { getServerUrl, requireEnv } from '@/lib/env'

type CartItem = {
  productName: string
  edition: string
  variant: string
  size: string
  quantity: number
  unitPrice: number
}

type PaymentMethod = 'twint' | 'invoice'
type PaymentStatus = 'paid' | 'pending_invoice'

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

const confirmedOrdersFile = path.join(process.cwd(), 'cache', 'shop-orders-confirmed.json')
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

async function readConfirmedRefs() {
  try {
    const content = await fs.readFile(confirmedOrdersFile, 'utf8')
    const parsed = JSON.parse(content) as string[]
    return new Set(parsed)
  } catch {
    return new Set<string>()
  }
}

async function writeConfirmedRefs(refs: Set<string>) {
  await fs.mkdir(path.dirname(confirmedOrdersFile), { recursive: true })
  await fs.writeFile(confirmedOrdersFile, JSON.stringify([...refs], null, 2), 'utf8')
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

function normalizeTotal(items: CartItem[]) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const discount = calculateTshirt2023Discount(items)
  return Math.round(Math.max(subtotal - discount, 0) * 100) / 100
}

function hasMaxTwoDecimals(value: number) {
  return Math.abs(value * 100 - Math.round(value * 100)) < 1e-8
}

function calculateTshirt2023Discount(items: CartItem[]) {
  const promoProducts = new Set(['T-Shirt Uomo', 'T-Shirt Donna'])
  let pairCount = 0

  for (const productName of promoProducts) {
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

async function handlePrepare(body: PrepareRequest) {
  const { firstName, lastName, email, phone, address, postalCode, city, notes, paymentMethod, items } = body

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

  if (!items.every(isValidCartItem)) {
    return NextResponse.json({ error: 'Carrello non valido.' }, { status: 400 })
  }

  if (paymentMethod !== 'twint' && paymentMethod !== 'invoice') {
    return NextResponse.json({ error: 'Metodo di pagamento non valido.' }, { status: 400 })
  }

  const total = normalizeTotal(items)
  if (!Number.isFinite(total) || total <= 0 || !hasMaxTwoDecimals(total)) {
    return NextResponse.json({ error: 'Totale ordine non valido.' }, { status: 400 })
  }

  const payload: OrderPayload = {
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
    const confirmedRefs = await readConfirmedRefs()
    if (confirmedRefs.has(payload.orderRef)) {
      return NextResponse.json({
        success: true,
        alreadyConfirmed: true,
        orderRef: payload.orderRef,
        paymentMethod: payload.paymentMethod,
        paymentStatus: payload.paymentStatus,
      })
    }

    try {
      await sendShopOrderNotification(payload)
    } catch (emailError) {
      console.error('Failed to send shop order email:', emailError)
    }

    confirmedRefs.add(payload.orderRef)
    await writeConfirmedRefs(confirmedRefs)

    return NextResponse.json({
      success: true,
      orderRef: payload.orderRef,
      paymentMethod: payload.paymentMethod,
      paymentStatus: payload.paymentStatus,
    })
  }

  const orderToken = signOrderPayload(payload)
  const checkoutUrl = buildCheckoutUrl(payload)

  return NextResponse.json({ success: true, checkoutUrl, orderToken, orderRef: payload.orderRef })
}

async function handleConfirm(body: ConfirmRequest) {
  const { orderToken } = body
  if (!orderToken) {
    return NextResponse.json({ error: 'Token ordine mancante.' }, { status: 400 })
  }

  const payload = verifyOrderToken(orderToken)
  const createdAtMs = new Date(payload.createdAt).getTime()
  const isExpired = Number.isNaN(createdAtMs) || Date.now() - createdAtMs > 1000 * 60 * 60 * 24

  if (isExpired) {
    return NextResponse.json({ error: 'Ordine scaduto, riprovare dal carrello.' }, { status: 400 })
  }

  const confirmedRefs = await readConfirmedRefs()
  if (confirmedRefs.has(payload.orderRef)) {
    return NextResponse.json({
      success: true,
      alreadyConfirmed: true,
      orderRef: payload.orderRef,
      paymentMethod: payload.paymentMethod,
      paymentStatus: payload.paymentStatus,
    })
  }

  try {
    await sendShopOrderNotification(payload)
  } catch (emailError) {
    console.error('Failed to send shop order email:', emailError)
  }

  confirmedRefs.add(payload.orderRef)
  await writeConfirmedRefs(confirmedRefs)

  return NextResponse.json({
    success: true,
    orderRef: payload.orderRef,
    paymentMethod: payload.paymentMethod,
    paymentStatus: payload.paymentStatus,
  })
}

export async function POST(request: Request) {
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
