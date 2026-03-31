import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { sendShopOrderNotification } from '@/lib/mail'

type CartItem = {
  productName: string
  edition: string
  variant: string
  size: string
  quantity: number
  unitPrice: number
}

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
  total: number
  createdAt: string
  items: CartItem[]
}

const confirmedOrdersFile = path.join(process.cwd(), 'cache', 'shop-orders-confirmed.json')
const paidOrdersFile = path.join(process.cwd(), 'cache', 'shop-orders-paid.json')
const preparedOrdersFile = path.join(process.cwd(), 'cache', 'shop-orders-prepared.json')

type PreparedOrderIndex = Record<string, { total: number; email: string; createdAt: string }>

function base64UrlEncode(input: string) {
  return Buffer.from(input, 'utf8').toString('base64url')
}

function base64UrlDecode(input: string) {
  return Buffer.from(input, 'base64url').toString('utf8')
}

function getOrderTokenSecret() {
  const secret = process.env.SHOP_ORDER_TOKEN_SECRET || process.env.PAYLOAD_SECRET
  if (!secret) {
    throw new Error('Missing SHOP_ORDER_TOKEN_SECRET or PAYLOAD_SECRET')
  }
  return secret
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

  const payload = JSON.parse(base64UrlDecode(encoded)) as OrderPayload
  if (!payload.orderRef || !Array.isArray(payload.items) || payload.items.length === 0) {
    throw new Error('Token payload invalid')
  }

  return payload
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

async function readPaidRefs() {
  try {
    const content = await fs.readFile(paidOrdersFile, 'utf8')
    const parsed = JSON.parse(content) as string[]
    return new Set(parsed)
  } catch {
    return new Set<string>()
  }
}

async function writePaidRefs(refs: Set<string>) {
  await fs.mkdir(path.dirname(paidOrdersFile), { recursive: true })
  await fs.writeFile(paidOrdersFile, JSON.stringify([...refs], null, 2), 'utf8')
}

async function readPreparedOrders() {
  try {
    const content = await fs.readFile(preparedOrdersFile, 'utf8')
    return JSON.parse(content) as PreparedOrderIndex
  } catch {
    return {}
  }
}

async function writePreparedOrders(index: PreparedOrderIndex) {
  await fs.mkdir(path.dirname(preparedOrdersFile), { recursive: true })
  await fs.writeFile(preparedOrdersFile, JSON.stringify(index, null, 2), 'utf8')
}

function isProviderConfirmationRequired() {
  return process.env.SHOP_REQUIRE_PROVIDER_CONFIRMATION === 'true'
}

function getWebhookSecret() {
  return process.env.SHOP_RAISENOW_WEBHOOK_SECRET || ''
}

function safeCompare(secretA: string, secretB: string) {
  const a = Buffer.from(secretA)
  const b = Buffer.from(secretB)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

function getWebhookProvidedSecret(request: Request) {
  const directHeader = request.headers.get('x-shop-webhook-secret')
  if (directHeader) return directHeader.trim()

  const authHeader = request.headers.get('authorization')
  if (!authHeader) return ''

  const match = /^bearer\s+(.+)$/i.exec(authHeader)
  return match ? match[1].trim() : ''
}

function extractOrderRefFromWebhook(body: unknown) {
  const payload = body as Record<string, unknown>
  const reference = payload.reference as Record<string, unknown> | undefined
  const payment = payload.payment as Record<string, unknown> | undefined
  const paymentReference = payment?.reference as Record<string, unknown> | undefined
  const metadata = payload.metadata as Record<string, unknown> | undefined

  const candidates = [
    payload.orderRef,
    payload.order_ref,
    payload.reference_campaign_subid,
    payload.campaign_subid,
    reference?.campaign_subid,
    paymentReference?.campaign_subid,
    metadata?.orderRef,
    metadata?.order_ref,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim()
    }
  }

  return ''
}

function extractStatusFromWebhook(body: unknown) {
  const payload = body as Record<string, unknown>
  const payment = payload.payment as Record<string, unknown> | undefined

  const statusCandidates = [
    payload.status,
    payload.state,
    payload.event,
    payload.type,
    payload.payment_status,
    payment?.status,
  ]

  for (const status of statusCandidates) {
    if (typeof status === 'string' && status.trim()) {
      return status.toLowerCase()
    }
  }

  return ''
}

function isSuccessStatus(status: string) {
  const successTokens = ['paid', 'succeeded', 'successful', 'success', 'completed', 'captured']
  const failedTokens = ['failed', 'error', 'cancel', 'decline', 'refunded', 'chargeback']

  if (!status) return false
  if (failedTokens.some((token) => status.includes(token))) return false
  return successTokens.some((token) => status.includes(token))
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
  return Math.max(subtotal - discount, 0)
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

function buildCheckoutUrl(payload: OrderPayload) {
  const baseUrl = process.env.SHOP_PAYLINK_URL || 'https://pay.raisenow.io/stpxb'
  const url = new URL(baseUrl)

  url.searchParams.set('amount.values', String(payload.total))
  url.searchParams.set('amount.custom', 'false')
  url.searchParams.set('supporter.first_name.value', payload.firstName)
  url.searchParams.set('supporter.last_name.value', payload.lastName)
  url.searchParams.set('supporter.email.value', payload.email)
  url.searchParams.set('supporter.phone.value', payload.phone)
  url.searchParams.set('supporter.street.value', payload.address)
  url.searchParams.set('supporter.zip_code.value', payload.postalCode)
  url.searchParams.set('supporter.city.value', payload.city)

  // Try to open directly on TWINT where supported by provider config.
  url.searchParams.set('payment_method.values', 'twint')
  url.searchParams.set('payment_method.custom', 'false')

  // This helps reconcile incoming payments in RaiseNow Hub.
  url.searchParams.set('reference.campaign_subid', payload.orderRef)

  return url.toString()
}

async function handlePrepare(body: PrepareRequest) {
  const { firstName, lastName, email, phone, address, postalCode, city, notes, items } = body

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

  const total = normalizeTotal(items)
  if (!Number.isInteger(total) || total <= 0) {
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
    total,
    createdAt: new Date().toISOString(),
    items,
  }

  const orderToken = signOrderPayload(payload)
  const checkoutUrl = buildCheckoutUrl(payload)

  const preparedIndex = await readPreparedOrders()
  preparedIndex[payload.orderRef] = {
    total: payload.total,
    email: payload.email,
    createdAt: payload.createdAt,
  }
  await writePreparedOrders(preparedIndex)

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
    const paidRefs = await readPaidRefs()
    return NextResponse.json({
      success: true,
      alreadyConfirmed: true,
      orderRef: payload.orderRef,
      providerVerified: paidRefs.has(payload.orderRef),
    })
  }

  const paidRefs = await readPaidRefs()
  const providerVerified = paidRefs.has(payload.orderRef)

  if (isProviderConfirmationRequired()) {
    if (!providerVerified) {
      return NextResponse.json(
        {
          error:
            'Pagamento non ancora confermato lato provider. Riprova tra pochi secondi oppure contatta il comitato shop.',
        },
        { status: 409 },
      )
    }
  }

  await sendShopOrderNotification({ ...payload, providerVerified })
  confirmedRefs.add(payload.orderRef)
  await writeConfirmedRefs(confirmedRefs)

  const preparedIndex = await readPreparedOrders()
  if (preparedIndex[payload.orderRef]) {
    delete preparedIndex[payload.orderRef]
    await writePreparedOrders(preparedIndex)
  }

  return NextResponse.json({ success: true, orderRef: payload.orderRef, providerVerified })
}

async function handleWebhook(request: Request, body: unknown) {
  const configuredSecret = getWebhookSecret()
  if (!configuredSecret) {
    return NextResponse.json({ error: 'Webhook secret non configurato.' }, { status: 503 })
  }

  const providedSecret = getWebhookProvidedSecret(request)
  if (!providedSecret || !safeCompare(providedSecret, configuredSecret)) {
    return NextResponse.json({ error: 'Non autorizzato.' }, { status: 401 })
  }

  const orderRef = extractOrderRefFromWebhook(body)
  const status = extractStatusFromWebhook(body)

  if (!orderRef) {
    return NextResponse.json({ error: 'orderRef non trovato nel payload webhook.' }, { status: 400 })
  }

  if (!isSuccessStatus(status)) {
    return NextResponse.json({ success: true, ignored: true })
  }

  const preparedIndex = await readPreparedOrders()
  if (!preparedIndex[orderRef]) {
    return NextResponse.json({ success: true, ignored: true, reason: 'ordine non in attesa' })
  }

  const paidRefs = await readPaidRefs()
  paidRefs.add(orderRef)
  await writePaidRefs(paidRefs)

  return NextResponse.json({ success: true, orderRef })
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>

    // If the request is not using the action protocol but provides webhook auth,
    // treat it as provider callback payload.
    if (typeof body.action !== 'string' && getWebhookProvidedSecret(request)) {
      return handleWebhook(request, body)
    }

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

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as unknown
    return handleWebhook(request, body)
  } catch (error) {
    console.error('Shop webhook error:', error)
    return NextResponse.json({ error: 'Errore webhook.' }, { status: 500 })
  }
}
