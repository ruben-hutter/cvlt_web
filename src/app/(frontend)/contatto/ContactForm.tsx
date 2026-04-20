'use client'

import { useState } from 'react'
import { isValidEmail } from '@/lib/forms'
import { uiFieldClass, uiPrimaryButtonClass } from '@/lib/ui'

export function ContactForm() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!isValidEmail(email)) {
      setStatus('error')
      setErrorMsg('Indirizzo email non valido.')
      return
    }

    setStatus('submitting')
    setErrorMsg('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, message }),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Errore durante l\'invio.')
      }

      setStatus('success')
      setFirstName('')
      setLastName('')
      setEmail('')
      setMessage('')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Si è verificato un errore.')
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center">
        <h2 className="text-xl font-bold text-green-800">Messaggio inviato!</h2>
        <p className="mt-2 text-green-700">
          Grazie per averci contattato. Ti risponderemo al più presto.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-4 text-sm text-cvlt-blue underline hover:text-cvlt-blue-dark"
        >
          Invia un altro messaggio
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
          <label htmlFor="contact-lastName" className="mb-1 block text-sm font-medium">
            Cognome <span className="text-red-500">*</span>
          </label>
          <input
            id="contact-lastName"
            type="text"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={uiFieldClass}
          />
        </div>
        <div>
          <label htmlFor="contact-firstName" className="mb-1 block text-sm font-medium">
            Nome <span className="text-red-500">*</span>
          </label>
          <input
            id="contact-firstName"
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={uiFieldClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-email" className="mb-1 block text-sm font-medium">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          id="contact-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={uiFieldClass}
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-1 block text-sm font-medium">
          Messaggio <span className="text-red-500">*</span>
        </label>
        <textarea
          id="contact-message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={uiFieldClass}
        />
      </div>

      <button
        type="submit"
        disabled={status === 'submitting'}
        className={`${uiPrimaryButtonClass} w-full px-6 py-3 sm:w-auto`}
      >
        {status === 'submitting' ? 'Invio in corso...' : 'Invia messaggio'}
      </button>
    </form>
  )
}
