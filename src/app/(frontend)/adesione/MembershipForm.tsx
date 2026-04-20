'use client'

import { useState, useEffect, useRef } from 'react'
import { useAddressSearch, formatPhone, isValidEmail, isValidPhone } from '@/lib/forms'
import type { AddressSuggestion } from '@/lib/forms'
import { uiFieldClass, uiPrimaryButtonClass } from '@/lib/ui'

type FormData = {
  firstName: string
  lastName: string
  address: string
  zip: string
  city: string
  email: string
  phone: string
  membershipType: string
  notes: string
}

const initialData: FormData = {
  firstName: '',
  lastName: '',
  address: '',
  zip: '',
  city: '',
  email: '',
  phone: '',
  membershipType: '',
  notes: '',
}


export function MembershipForm() {
  const [data, setData] = useState<FormData>(initialData)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)

  const suggestions = useAddressSearch(data.address)

  function update(field: keyof FormData, value: string) {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  function selectAddress(suggestion: AddressSuggestion) {
    setData((prev) => ({
      ...prev,
      address: suggestion.street,
      zip: suggestion.zip,
      city: suggestion.city,
    }))
    setShowSuggestions(false)
    setActiveIndex(-1)
    setTimeout(() => emailRef.current?.focus(), 0)
  }

  function handleAddressKeyDown(e: React.KeyboardEvent) {
    if (!showSuggestions || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      selectAddress(suggestions[activeIndex])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setActiveIndex(-1)
    }
  }

  // Reset active index when suggestions change
  useEffect(() => {
    setActiveIndex(-1)
  }, [suggestions])

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!isValidEmail(data.email)) {
      setStatus('error')
      setErrorMsg('Indirizzo email non valido.')
      return
    }

    if (!isValidPhone(data.phone)) {
      setStatus('error')
      setErrorMsg('Numero di telefono non valido (minimo 10 cifre).')
      return
    }

    setStatus('submitting')
    setErrorMsg('')

    try {
      const res = await fetch('/api/membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          city: `${data.zip} ${data.city}`.trim(),
        }),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Errore durante l\'invio.')
      }

      setStatus('success')
      setData(initialData)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Si è verificato un errore.')
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center">
        <h2 className="text-xl font-bold text-green-800">Richiesta inviata!</h2>
        <p className="mt-2 text-green-700">
          Grazie per il tuo interesse nel Club Volo Libero Ticino.
          Ti contatteremo al più presto.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-4 text-sm text-cvlt-blue underline hover:text-cvlt-blue-dark"
        >
          Invia un&apos;altra richiesta
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {status === 'error' && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="lastName" className="mb-1 block text-sm font-medium">
            Cognome <span className="text-red-500">*</span>
          </label>
          <input
            id="lastName"
            type="text"
            required
            value={data.lastName}
            onChange={(e) => update('lastName', e.target.value)}
            className={uiFieldClass}
          />
        </div>
        <div>
          <label htmlFor="firstName" className="mb-1 block text-sm font-medium">
            Nome <span className="text-red-500">*</span>
          </label>
          <input
            id="firstName"
            type="text"
            required
            value={data.firstName}
            onChange={(e) => update('firstName', e.target.value)}
            className={uiFieldClass}
          />
        </div>
      </div>

      <div className="relative" ref={suggestionsRef}>
        <label htmlFor="address" className="mb-1 block text-sm font-medium">
          Via e Nr. <span className="text-red-500">*</span>
        </label>
        <input
          id="address"
          type="text"
          required
          autoComplete="off"
          placeholder="Inizia a digitare per cercare..."
          value={data.address}
          onChange={(e) => {
            update('address', e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleAddressKeyDown}
          className={uiFieldClass}
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded border border-gray-200 bg-white shadow-lg">
            {suggestions.map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => selectAddress(s)}
                  className={`flex w-full items-baseline gap-2 px-3 py-2 text-left text-sm ${
                    i === activeIndex ? 'bg-blue-50' : 'hover:bg-cvlt-blue-light'
                  }`}
                >
                  <span className="font-medium">{s.street}</span>
                  <span className="text-gray-400">{s.zip} {s.city}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-[8rem_1fr]">
        <div>
          <label htmlFor="zip" className="mb-1 block text-sm font-medium">
            NPA <span className="text-red-500">*</span>
          </label>
          <input
            id="zip"
            type="text"
            required
            placeholder="6900"
            value={data.zip}
            onChange={(e) => update('zip', e.target.value)}
            className={uiFieldClass}
          />
        </div>
        <div>
          <label htmlFor="city" className="mb-1 block text-sm font-medium">
            Domicilio <span className="text-red-500">*</span>
          </label>
          <input
            id="city"
            type="text"
            required
            placeholder="Lugano"
            value={data.city}
            onChange={(e) => update('city', e.target.value)}
            className={uiFieldClass}
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            ref={emailRef}
            id="email"
            type="email"
            required
            value={data.email}
            onChange={(e) => update('email', e.target.value)}
            className={uiFieldClass}
          />
        </div>
        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium">
            Telefono <span className="text-red-500">*</span>
          </label>
          <input
            id="phone"
            type="tel"
            required
            placeholder="+41 79 123 45 67"
            value={data.phone}
            onChange={(e) => update('phone', formatPhone(e.target.value))}
            className={uiFieldClass}
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Tipo di iscrizione <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {[
            { value: 'active', label: 'Socio attivo', price: 'CHF 40.–' },
            { value: 'family', label: 'Famiglia', price: 'CHF 45.–' },
            { value: 'supporter', label: 'Sostenitore', price: 'contributo libero' },
          ].map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-3 rounded border px-4 py-3 transition-colors ${
                data.membershipType === option.value
                  ? 'border-cvlt-blue bg-cvlt-blue-light'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="membershipType"
                value={option.value}
                required
                checked={data.membershipType === option.value}
                onChange={(e) => update('membershipType', e.target.value)}
                className="accent-cvlt-blue"
              />
              <span className="font-medium">{option.label}</span>
              <span className="text-sm text-gray-500">&mdash; {option.price}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="mb-1 block text-sm font-medium">
          Osservazioni
        </label>
        <textarea
          id="notes"
          rows={3}
          value={data.notes}
          onChange={(e) => update('notes', e.target.value)}
          className={uiFieldClass}
        />
      </div>

      <button
        type="submit"
        disabled={status === 'submitting'}
        className={`${uiPrimaryButtonClass} w-full px-6 py-3 sm:w-auto`}
      >
        {status === 'submitting' ? 'Invio in corso...' : 'Invia richiesta'}
      </button>
    </form>
  )
}
