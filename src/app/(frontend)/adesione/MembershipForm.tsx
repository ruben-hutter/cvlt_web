'use client'

import { useState } from 'react'

type FormData = {
  firstName: string
  lastName: string
  address: string
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

  function update(field: keyof FormData, value: string) {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')

    try {
      const res = await fetch('/api/membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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
          className="mt-4 text-sm text-green-600 underline hover:text-green-800"
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
            className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="address" className="mb-1 block text-sm font-medium">
          Via e Nr. <span className="text-red-500">*</span>
        </label>
        <input
          id="address"
          type="text"
          required
          value={data.address}
          onChange={(e) => update('address', e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="city" className="mb-1 block text-sm font-medium">
          NPA e Domicilio <span className="text-red-500">*</span>
        </label>
        <input
          id="city"
          type="text"
          required
          value={data.city}
          onChange={(e) => update('city', e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            required
            value={data.email}
            onChange={(e) => update('email', e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            value={data.phone}
            onChange={(e) => update('phone', e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  ? 'border-blue-500 bg-blue-50'
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
                className="accent-blue-600"
              />
              <span className="font-medium">{option.label}</span>
              <span className="text-sm text-gray-500">— {option.price}</span>
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
          className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full rounded bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400 sm:w-auto"
      >
        {status === 'submitting' ? 'Invio in corso...' : 'Invia richiesta'}
      </button>
    </form>
  )
}
