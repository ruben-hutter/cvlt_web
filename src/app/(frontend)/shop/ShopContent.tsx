'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Lightbox from 'yet-another-react-lightbox'
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen'
import 'yet-another-react-lightbox/styles.css'
import { useAddressSearch, formatPhone, isValidEmail, isValidPhone } from '@/lib/forms'
import type { AddressSuggestion } from '@/lib/forms'

type Variant = {
  label: string
  sizes: string[]
  price?: number
}

type Product = {
  name: string
  edition: string
  price: number
  priceLabel?: string
  image: string
  description?: string
  variants: Variant[]
  promo?: string
}

type ProductSelection = {
  variantIndex: number
  size: string
  quantity: number
}

type CartItem = {
  productName: string
  edition: string
  variant: string
  size: string
  quantity: number
  unitPrice: number
}

const products: Product[] = [
  {
    name: 'Maglietta 100% Cotone Bio',
    edition: 'ed. 2025 — Unisex',
    price: 25,
    image: '/shop/maglietta-bio-2025.jpg',
    variants: [
      { label: 'Sapphire', sizes: ['M', 'L'] },
      { label: 'Dusty Indigo', sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
      { label: 'Royal', sizes: ['S', 'M', 'L', 'XL'] },
    ],
  },
  {
    name: 'Maglietta Tecnica',
    edition: 'ed. 2024 — Unisex',
    price: 30,
    image: '/shop/maglietta-tecnica-2024.png',
    variants: [
      { label: 'Blu (inserti bianchi)', sizes: ['S', 'L', 'XXL'] },
      { label: 'Bianca (inserti blu)', sizes: ['S', 'M', 'L', 'XXL'] },
    ],
  },
  {
    name: 'T-Shirt Uomo',
    edition: 'ed. 2023',
    price: 25,
    image: '/shop/tshirt-uomo-2023.png',
    variants: [
      { label: 'Grigia (cotone)', sizes: ['S', 'M', 'XL', 'XXL'], price: 25 },
      { label: 'Gialla (tecnica)', sizes: ['S', 'M', 'XL', 'XXL'], price: 30 },
    ],
    promo: 'Entrambi i colori: CHF 50.- invece di 55.-',
  },
  {
    name: 'T-Shirt Donna',
    edition: 'ed. 2023',
    price: 25,
    image: '/shop/tshirt-donna-2023.png',
    variants: [
      { label: 'Grigia (cotone)', sizes: ['M', 'L'], price: 25 },
      { label: 'Gialla (tecnica)', sizes: ['M', 'L'], price: 30 },
    ],
    promo: 'Entrambi i colori: CHF 50.- invece di 55.-',
  },
  {
    name: 'Giacca Fleece Uomo',
    edition: 'ed. 2023',
    price: 55,
    image: '/shop/fleece-uomo-2023.jpg',
    variants: [
      { label: 'Grigia', sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
    ],
  },
  {
    name: 'Giacca Fleece Donna',
    edition: 'ed. 2023',
    price: 55,
    image: '/shop/fleece-donna-2023.jpg',
    variants: [
      { label: 'Grigia', sizes: ['S', 'M', 'L', 'XL'] },
    ],
  },
  {
    name: 'Cappellino CVLT',
    edition: 'ed. 2021',
    price: 15,
    image: '/shop/cap-2021.jpeg',
    variants: [
      { label: 'Blu scuro', sizes: ['S/M', 'L/XL'] },
    ],
  },
]

function itemKey(item: CartItem) {
  return `${item.productName}__${item.variant}__${item.size}`
}

function formatCurrency(value: number) {
  return `CHF ${value}.-`
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


const pendingOrderTokenStorageKey = 'cvlt-shop-pending-order-token'

export function ShopContent() {
  const searchParams = useSearchParams()
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [city, setCity] = useState('')
  const [notes, setNotes] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)

  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [isPreparingCheckout, setIsPreparingCheckout] = useState(false)
  const [isConfirmingOrder, setIsConfirmingOrder] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)
  const [confirmedOrderRef, setConfirmedOrderRef] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const embedRef = useRef<HTMLDivElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const hasAttemptedAutoConfirmRef = useRef(false)

  const suggestions = useAddressSearch(address)

  const [selectionByProduct, setSelectionByProduct] = useState<Record<number, ProductSelection>>(() => {
    const initial: Record<number, ProductSelection> = {}
    products.forEach((product, index) => {
      initial[index] = {
        variantIndex: 0,
        size: product.variants[0]?.sizes[0] || '',
        quantity: 1,
      }
    })
    return initial
  })

  const total = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cartItems],
  )
  const tshirt2023Discount = useMemo(() => calculateTshirt2023Discount(cartItems), [cartItems])
  const finalTotal = useMemo(() => Math.max(total - tshirt2023Discount, 0), [total, tshirt2023Discount])
  const cartCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems])

  const canStartCheckout =
    cartItems.length > 0 &&
    !!firstName.trim() &&
    !!lastName.trim() &&
    !!email.trim() &&
    !!phone.trim() &&
    !!address.trim() &&
    !!postalCode.trim() &&
    !!city.trim() &&
    isValidEmail(email) &&
    isValidPhone(phone)

  useEffect(() => {
    setActiveSuggestionIndex(-1)
  }, [suggestions])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (!checkoutUrl || !embedRef.current) return

    const container = embedRef.current
    container.id = 'rnw-solution-embed-stpxb'

    while (container.firstChild) {
      container.firstChild.remove()
    }

    const script = document.createElement('script')
    script.type = 'module'
    script.textContent = `
      import {SolutionEmbed} from 'https://cdn.jsdelivr.net/npm/@raisenow/solution-embed@1/dist/index.js'
      SolutionEmbed.render('#rnw-solution-embed-stpxb', {
        url: ${JSON.stringify(checkoutUrl)},
        info: false,
      })
    `

    container.appendChild(script)

    return () => {
      while (container.firstChild) {
        container.firstChild.remove()
      }
    }
  }, [checkoutUrl])

  useEffect(() => {
    if (!toastMessage) return
    const timer = globalThis.setTimeout(() => {
      setToastMessage(null)
    }, 2500)

    return () => globalThis.clearTimeout(timer)
  }, [toastMessage])

  useEffect(() => {
    const { body } = document
    const previousOverflow = body.style.overflow
    if (isCartOpen) body.style.overflow = 'hidden'

    return () => {
      body.style.overflow = previousOverflow
    }
  }, [isCartOpen])

  useEffect(() => {
    const paid = searchParams.get('shop_paid') === '1'
    const failed = searchParams.get('shop_failed') === '1'

    if (failed) {
      setFeedbackError('Pagamento non completato. Puoi riprovare qui sotto.')
    }

    if (!paid || hasAttemptedAutoConfirmRef.current) return

    hasAttemptedAutoConfirmRef.current = true

    const token = localStorage.getItem(pendingOrderTokenStorageKey)
    if (!token) {
      setFeedbackError('Ordine non trovato localmente. Se hai pagato, contatta il comitato shop.')
      return
    }

    setIsConfirmingOrder(true)
    setFeedbackError(null)

    void fetch('/api/shop-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'confirm', orderToken: token }),
    })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Conferma ordine fallita')

        setConfirmedOrderRef(data.orderRef)
        if (data.providerVerified) {
          setFeedbackMessage(
            'Pagamento confermato lato RaiseNow. Ordine confermato e notificato a Barbara per spedizione.',
          )
        } else {
          setFeedbackMessage(
            'Ordine registrato e notificato a Barbara. Pagamento da verificare manualmente in RaiseNow Hub prima della spedizione.',
          )
        }
        setCheckoutUrl(null)
        setCartItems([])
        setFirstName('')
        setLastName('')
        setEmail('')
        setPhone('')
        setAddress('')
        setPostalCode('')
        setCity('')
        setNotes('')
        setIsCartOpen(false)
        localStorage.removeItem(pendingOrderTokenStorageKey)
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Conferma ordine fallita'
        setFeedbackError(message)
      })
      .finally(() => {
        setIsConfirmingOrder(false)
      })
  }, [searchParams])

  function updateSelection(index: number, update: Partial<ProductSelection>) {
    setSelectionByProduct((prev) => {
      const current = prev[index]
      if (!current) return prev
      return {
        ...prev,
        [index]: {
          ...current,
          ...update,
        },
      }
    })
  }

  function addToCart(productIndex: number) {
    const product = products[productIndex]
    const selection = selectionByProduct[productIndex]
    if (!product || !selection) return

    const variant = product.variants[selection.variantIndex]
    if (!variant || !selection.size || selection.quantity <= 0) return

    const unitPrice = variant.price || product.price
    const newItem: CartItem = {
      productName: product.name,
      edition: product.edition,
      variant: variant.label,
      size: selection.size,
      quantity: selection.quantity,
      unitPrice,
    }

    setCartItems((prev) => {
      const key = itemKey(newItem)
      const existing = prev.find((item) => itemKey(item) === key)
      if (!existing) return [...prev, newItem]

      return prev.map((item) =>
        itemKey(item) === key ? { ...item, quantity: Math.min(item.quantity + newItem.quantity, 99) } : item,
      )
    })

    setFeedbackError(null)
    setToastMessage(`Aggiunto al carrello: ${newItem.productName} (${newItem.variant}, ${newItem.size}) x${newItem.quantity}`)
  }

  function removeFromCart(item: CartItem) {
    setCartItems((prev) => prev.filter((x) => itemKey(x) !== itemKey(item)))
  }

  function increaseCartQuantity(item: CartItem) {
    setCartItems((prev) =>
      prev.map((x) => (itemKey(x) === itemKey(item) ? { ...x, quantity: Math.min(x.quantity + 1, 99) } : x)),
    )
  }

  function decreaseCartQuantity(item: CartItem) {
    setCartItems((prev) =>
      prev
        .map((x) => (itemKey(x) === itemKey(item) ? { ...x, quantity: x.quantity - 1 } : x))
        .filter((x) => x.quantity > 0),
    )
  }

  function selectAddress(suggestion: AddressSuggestion) {
    setAddress(suggestion.street)
    setPostalCode(suggestion.zip)
    setCity(suggestion.city)
    setShowSuggestions(false)
    setActiveSuggestionIndex(-1)
    setTimeout(() => emailRef.current?.focus(), 0)
  }

  function handleAddressKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveSuggestionIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveSuggestionIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
      return
    }

    if (e.key === 'Enter' && activeSuggestionIndex >= 0) {
      e.preventDefault()
      selectAddress(suggestions[activeSuggestionIndex])
      return
    }

    if (e.key === 'Escape') {
      setShowSuggestions(false)
      setActiveSuggestionIndex(-1)
    }
  }

  async function startCheckout() {
    if (!canStartCheckout || isPreparingCheckout) return

    if (!isValidEmail(email)) {
      setFeedbackError('Indirizzo email non valido.')
      return
    }

    if (!isValidPhone(phone)) {
      setFeedbackError('Numero di telefono non valido (minimo 10 cifre).')
      return
    }

    setIsPreparingCheckout(true)
    setFeedbackError(null)
    setFeedbackMessage(null)

    try {
      const res = await fetch('/api/shop-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'prepare',
          firstName,
          lastName,
          email,
          phone,
          address,
          postalCode,
          city,
          notes,
          items: cartItems,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Impossibile avviare il pagamento')

      localStorage.setItem(pendingOrderTokenStorageKey, data.orderToken)
      setCheckoutUrl(data.checkoutUrl)
      setFeedbackMessage(
        'Checkout pronto. Completa il pagamento TWINT nel modulo qui sotto; dopo il ritorno su questa pagina l\'ordine verrà confermato automaticamente.',
      )
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Impossibile avviare il pagamento'
      setFeedbackError(message)
    } finally {
      setIsPreparingCheckout(false)
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-3xl font-bold text-cvlt-gray-900">Shop</h1>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-cvlt-gray-300 bg-white px-4 py-2 text-sm font-semibold text-cvlt-gray-900 shadow-sm transition hover:border-cvlt-blue hover:text-cvlt-blue lg:hidden"
          onClick={() => setIsCartOpen(true)}
        >
          Carrello ({cartCount})
          <span className="rounded-full bg-cvlt-blue/10 px-2 py-0.5 text-xs text-cvlt-blue">{formatCurrency(finalTotal)}</span>
        </button>
      </div>

      <p className="mt-4 text-cvlt-gray-700">
        Articoli del Club Volo Libero Ticino. Seleziona articoli, completa il pagamento TWINT e la spedizione sarà
        gestita da Barbara.
      </p>

      {feedbackMessage && (
        <div className="mt-5 rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {feedbackMessage}
          {confirmedOrderRef && <div className="mt-1 font-medium">Riferimento ordine: {confirmedOrderRef}</div>}
        </div>
      )}

      {feedbackError && (
        <div className="mt-5 rounded-md border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {feedbackError}
        </div>
      )}

      <div className="mt-4 flex gap-6 sm:mt-8">
        <div className="min-w-0 flex-1">
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product, i) => {
            const selection = selectionByProduct[i]
            const selectedVariant = product.variants[selection?.variantIndex ?? 0]
            const unitPrice = selectedVariant?.price || product.price

            return (
              <div key={`${product.name}-${product.edition}`} className="overflow-hidden rounded-lg border border-cvlt-gray-200">
                <button onClick={() => setLightboxIndex(i)} className="w-full cursor-pointer">
                  <div className="aspect-square overflow-hidden bg-cvlt-gray-100">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
                    />
                  </div>
                </button>

                <div className="p-4">
                  <h2 className="text-base font-semibold text-cvlt-gray-900">{product.name}</h2>
                  <p className="text-xs text-cvlt-gray-500">{product.edition}</p>
                  <p className="mt-2 text-lg font-bold text-cvlt-blue">{formatCurrency(unitPrice)}</p>

                  <div className="mt-3 space-y-3">
                    <div>
                      <label
                        htmlFor={`variant-${i}`}
                        className="mb-1 block text-xs font-semibold uppercase tracking-wide text-cvlt-gray-500"
                      >
                        Variante
                      </label>
                      <select
                        id={`variant-${i}`}
                        className="w-full rounded border border-cvlt-gray-300 px-2 py-1.5 text-sm"
                        value={selection?.variantIndex ?? 0}
                        onChange={(event) => {
                          const variantIndex = Number(event.target.value)
                          const nextVariant = product.variants[variantIndex]
                          updateSelection(i, {
                            variantIndex,
                            size: nextVariant?.sizes[0] || '',
                          })
                        }}
                      >
                        {product.variants.map((variant, variantIndex) => {
                          const variantPrice = variant.price || product.price
                          const extra = variantPrice === product.price ? '' : ` (${formatCurrency(variantPrice)})`

                          return (
                            <option key={variant.label} value={variantIndex}>
                              {variant.label}
                              {extra}
                            </option>
                          )
                        })}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor={`size-${i}`}
                        className="mb-1 block text-xs font-semibold uppercase tracking-wide text-cvlt-gray-500"
                      >
                        Taglia
                      </label>
                      <select
                        id={`size-${i}`}
                        className="w-full rounded border border-cvlt-gray-300 px-2 py-1.5 text-sm"
                        value={selection?.size || ''}
                        onChange={(event) => updateSelection(i, { size: event.target.value })}
                      >
                        {selectedVariant?.sizes.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor={`quantity-${i}`}
                        className="mb-1 block text-xs font-semibold uppercase tracking-wide text-cvlt-gray-500"
                      >
                        Quantita
                      </label>
                      <div id={`quantity-${i}`} className="flex items-center gap-2">
                        <button
                          type="button"
                          className="rounded border border-cvlt-gray-300 px-2 py-1 text-sm"
                          onClick={() =>
                            updateSelection(i, {
                              quantity: Math.max((selection?.quantity ?? 1) - 1, 1),
                            })
                          }
                        >
                          -
                        </button>
                        <span className="min-w-8 text-center text-sm font-semibold">{selection?.quantity ?? 1}</span>
                        <button
                          type="button"
                          className="rounded border border-cvlt-gray-300 px-2 py-1 text-sm"
                          onClick={() =>
                            updateSelection(i, {
                              quantity: Math.min((selection?.quantity ?? 1) + 1, 20),
                            })
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="mt-4 w-full rounded bg-cvlt-blue px-3 py-2 text-sm font-semibold text-white transition hover:bg-cvlt-blue/90"
                    onClick={() => addToCart(i)}
                  >
                    Aggiungi al carrello
                  </button>

                  {product.promo && (
                    <p className="mt-3 rounded bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">{product.promo}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        </div>

        <aside className="hidden flex-shrink-0 lg:block lg:w-44">
          <div className="sticky top-20">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-cvlt-gray-300 bg-white px-4 py-2 text-sm font-semibold text-cvlt-gray-900 shadow-sm transition hover:border-cvlt-blue hover:text-cvlt-blue"
              onClick={() => setIsCartOpen(true)}
            >
              Carrello ({cartCount})
              <span className="rounded-full bg-cvlt-blue/10 px-2 py-0.5 text-xs text-cvlt-blue">{formatCurrency(finalTotal)}</span>
            </button>
          </div>
        </aside>
      </div>

      {isCartOpen && (
        <button
          type="button"
          aria-label="Chiudi carrello"
          className="fixed inset-0 z-40 bg-black/35"
          onClick={() => setIsCartOpen(false)}
        />
      )}

      <aside
        id="shop-cart"
        className={`fixed right-0 top-0 z-50 h-full w-[min(96vw,780px)] overflow-y-auto border-l border-cvlt-gray-200 bg-white shadow-2xl transition duration-300 ${
          isCartOpen ? 'translate-x-0' : 'pointer-events-none translate-x-full'
        }`}
      >
          <div className="flex items-center justify-between border-b border-cvlt-gray-200 px-5 py-4">
            <h2 className="text-xl font-semibold text-cvlt-gray-900">Carrello</h2>
            <button
              type="button"
              className="rounded border border-cvlt-gray-300 px-3 py-1 text-sm text-cvlt-gray-700"
              onClick={() => setIsCartOpen(false)}
            >
              Chiudi
            </button>
          </div>

          <div className="space-y-6 px-5 py-5">
          {cartItems.length === 0 ? (
            <p className="text-sm text-cvlt-gray-600">Nessun articolo nel carrello.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-cvlt-gray-200 text-left text-cvlt-gray-600">
                    <th className="py-2 pr-2">Prodotto</th>
                    <th className="py-2 pr-2">Variante</th>
                    <th className="py-2 pr-2">Taglia</th>
                    <th className="py-2 pr-2 text-right">Qta</th>
                    <th className="py-2 pr-2 text-right">Subtotale</th>
                    <th className="py-2">&nbsp;</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item) => (
                    <tr key={itemKey(item)} className="border-b border-cvlt-gray-100 align-top">
                      <td className="py-2 pr-2">
                        <div className="font-medium text-cvlt-gray-900">{item.productName}</div>
                        <div className="text-xs text-cvlt-gray-500">{item.edition}</div>
                      </td>
                      <td className="py-2 pr-2">{item.variant}</td>
                      <td className="py-2 pr-2">{item.size}</td>
                      <td className="py-2 pr-2 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            className="rounded border border-cvlt-gray-300 px-2 py-0.5 text-xs"
                            onClick={() => decreaseCartQuantity(item)}
                          >
                            -
                          </button>
                          <span className="min-w-6 text-center">{item.quantity}</span>
                          <button
                            type="button"
                            className="rounded border border-cvlt-gray-300 px-2 py-0.5 text-xs"
                            onClick={() => increaseCartQuantity(item)}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-2 pr-2 text-right">{formatCurrency(item.quantity * item.unitPrice)}</td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          className="rounded border border-cvlt-gray-300 px-2 py-1 text-xs text-cvlt-gray-700"
                          onClick={() => removeFromCart(item)}
                        >
                          Rimuovi
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="space-y-1 text-right">
            <div className="text-sm text-cvlt-gray-600">Subtotale: {formatCurrency(total)}</div>
            {tshirt2023Discount > 0 && (
              <div className="text-sm font-semibold text-emerald-700">Sconto promo T-Shirt 2023: -{formatCurrency(tshirt2023Discount)}</div>
            )}
            <div className="text-lg font-bold text-cvlt-gray-900">Totale: {formatCurrency(finalTotal)}</div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="shop-lastName" className="mb-1 block text-sm font-medium">Cognome</label>
              <input
                id="shop-lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 focus:border-cvlt-blue focus:outline-none focus:ring-1 focus:ring-cvlt-blue"
              />
            </div>
            <div>
              <label htmlFor="shop-firstName" className="mb-1 block text-sm font-medium">Nome</label>
              <input
                id="shop-firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 focus:border-cvlt-blue focus:outline-none focus:ring-1 focus:ring-cvlt-blue"
              />
            </div>
          </div>

          <div className="relative" ref={suggestionsRef}>
            <label htmlFor="shop-address" className="mb-1 block text-sm font-medium">Via e Nr.</label>
            <input
              id="shop-address"
              type="text"
              value={address}
              autoComplete="off"
              placeholder="Inizia a digitare per cercare..."
              onChange={(e) => {
                setAddress(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleAddressKeyDown}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-cvlt-blue focus:outline-none focus:ring-1 focus:ring-cvlt-blue"
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded border border-gray-200 bg-white shadow-lg">
                {suggestions.map((suggestion, index) => (
                  <li key={index}>
                    <button
                      type="button"
                      onClick={() => selectAddress(suggestion)}
                      className={`flex w-full items-baseline gap-2 px-3 py-2 text-left text-sm ${
                        index === activeSuggestionIndex ? 'bg-blue-50' : 'hover:bg-cvlt-blue-light'
                      }`}
                    >
                      <span className="font-medium">{suggestion.street}</span>
                      <span className="text-gray-400">
                        {suggestion.zip} {suggestion.city}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-[8rem_1fr]">
            <div>
              <label htmlFor="shop-postalCode" className="mb-1 block text-sm font-medium">NPA</label>
              <input
                id="shop-postalCode"
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="6500"
                className="w-full rounded border border-gray-300 px-3 py-2 focus:border-cvlt-blue focus:outline-none focus:ring-1 focus:ring-cvlt-blue"
              />
            </div>
            <div>
              <label htmlFor="shop-city" className="mb-1 block text-sm font-medium">Domicilio</label>
              <input
                id="shop-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Bellinzona"
                className="w-full rounded border border-gray-300 px-3 py-2 focus:border-cvlt-blue focus:outline-none focus:ring-1 focus:ring-cvlt-blue"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="shop-email" className="mb-1 block text-sm font-medium">Email</label>
              <input
                ref={emailRef}
                id="shop-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 focus:border-cvlt-blue focus:outline-none focus:ring-1 focus:ring-cvlt-blue"
              />
            </div>
            <div>
              <label htmlFor="shop-phone" className="mb-1 block text-sm font-medium">Telefono</label>
              <input
                id="shop-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="+41 79 123 45 67"
                className="w-full rounded border border-gray-300 px-3 py-2 focus:border-cvlt-blue focus:outline-none focus:ring-1 focus:ring-cvlt-blue"
              />
            </div>
          </div>

          <div>
            <label htmlFor="shop-notes" className="mb-1 block text-sm font-medium">Commenti o domande (opzionale)</label>
            <textarea
              id="shop-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-cvlt-blue focus:outline-none focus:ring-1 focus:ring-cvlt-blue"
              placeholder="Richieste particolari, consegna, ecc."
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={startCheckout}
              disabled={!canStartCheckout || isPreparingCheckout || isConfirmingOrder}
              className="rounded bg-cvlt-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-cvlt-blue/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPreparingCheckout ? 'Preparazione checkout...' : 'Procedi con TWINT'}
            </button>

            {isConfirmingOrder && <span className="text-sm text-cvlt-gray-600">Conferma ordine in corso...</span>}
          </div>

          {checkoutUrl && (
            <div>
              <h3 className="text-base font-semibold text-cvlt-gray-900">Pagamento TWINT</h3>
              <p className="mt-1 text-sm text-cvlt-gray-600">
                Completa qui il pagamento. Al termine RaiseNow ti riporterà su questa pagina per la conferma ordine.
              </p>
              <div ref={embedRef} className="mt-4 w-full" />
            </div>
          )}
        </div>
      </aside>

      <Lightbox
        open={lightboxIndex >= 0}
        close={() => setLightboxIndex(-1)}
        index={lightboxIndex}
        slides={products.map((p) => ({ src: p.image, alt: p.name }))}
        plugins={[Fullscreen]}
      />

      {toastMessage && (
        <div className="pointer-events-none fixed bottom-4 right-4 z-[60] w-[min(92vw,420px)] rounded-lg border border-cvlt-blue/20 bg-white px-4 py-3 text-sm text-cvlt-gray-900 shadow-xl">
          {toastMessage}
        </div>
      )}
    </main>
  )
}
