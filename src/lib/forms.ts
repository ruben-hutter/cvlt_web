'use client'

import { useState, useEffect, useRef } from 'react'

export type AddressSuggestion = {
  label: string
  street: string
  zip: string
  city: string
}

export function useAddressSearch(query: string) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([])
      return
    }

    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api3.geo.admin.ch/rest/services/api/SearchServer?searchText=${encodeURIComponent(query)}&type=locations&origins=address&limit=20`,
        )
        const data = await res.json()
        const seen = new Set<string>()
        const results: AddressSuggestion[] = []
        for (const r of data.results || []) {
          if (results.length >= 5) break
          const label = (r.attrs?.label || '') as string
          const match = /^(.+?)\s*<b>(\d+)\s+(.+?)<\/b>/.exec(label)
          if (!match) continue
          const street = match[1].trim().replace(/\s*#\s*$/, '')
          const zip = match[2]
          const city = match[3].trim()
          const key = `${street}|${zip}|${city}`
          if (seen.has(key)) continue
          seen.add(key)
          results.push({ label: `${street} ${zip} ${city}`, street, zip, city })
        }
        setSuggestions(results)
      } catch {
        setSuggestions([])
      }
    }, 300)

    return () => clearTimeout(timeoutRef.current)
  }, [query])

  return suggestions
}

export function formatPhone(value: string): string {
  const hasPlus = value.startsWith('+')
  const digits = value.replaceAll(/\D/g, '')

  if (digits.length === 0) return hasPlus ? '+' : ''

  if (digits.startsWith('41') && digits.length <= 11) {
    const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 7), digits.slice(7, 9), digits.slice(9, 11)]
    return '+' + parts.filter(Boolean).join(' ')
  }

  if (digits.startsWith('0') && digits.length <= 10) {
    const parts = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 8), digits.slice(8, 10)]
    return parts.filter(Boolean).join(' ')
  }

  if (hasPlus) return '+' + digits
  return digits
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidPhone(phone: string): boolean {
  const digits = phone.replaceAll(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15
}
