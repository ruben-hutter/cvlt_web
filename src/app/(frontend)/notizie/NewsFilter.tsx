'use client'

import { useState } from 'react'
import { fuzzySearch } from '@/lib/search'
import { NewsCard } from '../components/NewsCard'
import { SearchYearFilter } from '../components/SearchYearFilter'

type Article = {
  id: string | number
  title: string
  slug: string
  publishDate: string
  thumbnailUrl: string | null
  tag: string | null
  relatedEvent: { title: string } | null
}

export function NewsFilter({ articles }: { articles: Article[] }) {
  const [search, setSearch] = useState('')
  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  const years = [...new Set(articles.map((a) => new Date(a.publishDate).getFullYear()))].sort(
    (a, b) => b - a,
  )

  const matched = search
    ? fuzzySearch(articles, search, ['title'])
    : articles

  const filtered = matched.filter((a) => {
    const year = new Date(a.publishDate).getFullYear()
    if (selectedYear && year !== selectedYear) return false
    return true
  })

  return (
    <div>
      <SearchYearFilter
        search={search}
        onSearchChange={setSearch}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        years={years}
        searchPlaceholder="Cerca notizia..."
      />

      {filtered.length === 0 ? (
        <p className="mt-8 text-cvlt-gray-500">Nessuna notizia trovata.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((article) => (
            <NewsCard key={article.id} variant="grid" {...article} />
          ))}
        </div>
      )}
    </div>
  )
}
