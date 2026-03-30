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
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m9.86-2.822a4.5 4.5 0 0 0-1.242-7.244l-4.5-4.5a4.5 4.5 0 0 0-6.364 6.364L4.94 8.438" />
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
