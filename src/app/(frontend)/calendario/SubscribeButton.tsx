'use client'

import { useState } from 'react'

export function SubscribeButton() {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const url = `${window.location.origin}/calendario.ics`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 6000)
  }

  return (
    <div className="relative">
      <button
        onClick={handleCopy}
        title="Copia URL per iscriverti al calendario"
        className="flex items-center gap-1.5 rounded-md border border-cvlt-gray-200 px-3 py-1.5 text-xs font-medium text-cvlt-gray-500 transition-colors hover:border-cvlt-blue/30 hover:text-cvlt-blue"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5"
          />
        </svg>
        {copied ? 'Copiato!' : 'Iscriviti'}
      </button>
      {copied && (
        <div className="absolute right-0 top-full z-10 mt-1 w-56 rounded-md border border-cvlt-gray-200 bg-white px-3 py-2 text-xs text-cvlt-gray-600 shadow-lg">
          URL copiato! Incollalo in Google Calendar, Apple Calendar o Outlook per sincronizzare gli eventi.
        </div>
      )}
    </div>
  )
}
