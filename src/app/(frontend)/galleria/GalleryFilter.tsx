'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SearchYearFilter } from '../components/SearchYearFilter'

type Album = {
  id: string | number
  title: string
  date: string
  coverUrl: string | null
  coverIsVideo: boolean
  photoCount: number
}

export function GalleryFilter({ albums }: { albums: Album[] }) {
  const [search, setSearch] = useState('')
  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  // Collect all years
  const years = [...new Set(albums.map((a) => new Date(a.date).getFullYear()))].sort((a, b) => b - a)

  // Filter albums
  const filtered = albums.filter((a) => {
    const year = new Date(a.date).getFullYear()
    if (selectedYear && year !== selectedYear) return false
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // Group by year
  const grouped = new Map<number, Album[]>()
  for (const album of filtered) {
    const year = new Date(album.date).getFullYear()
    if (!grouped.has(year)) grouped.set(year, [])
    grouped.get(year)!.push(album)
  }
  const sortedYears = [...grouped.keys()].sort((a, b) => b - a)

  return (
    <div>
      <SearchYearFilter
        search={search}
        onSearchChange={setSearch}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        years={years}
        searchPlaceholder="Cerca album..."
      />

      {/* Results */}
      {filtered.length === 0 ? (
        <p className="mt-8 text-cvlt-gray-500">Nessun album trovato.</p>
      ) : (
        <div className="mt-8 space-y-12">
          {sortedYears.map((year) => {
            const yearAlbums = grouped.get(year)!
            return (
              <section key={year}>
                <h2 className="text-xl font-bold text-cvlt-gray-900">{year}</h2>
                <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {yearAlbums.map((album) => (
                    <Link
                      key={album.id}
                      href={`/galleria/${album.id}`}
                      className="group overflow-hidden rounded-lg border border-cvlt-gray-200 transition-all hover:border-cvlt-blue/30 hover:shadow-lg"
                    >
                      {album.coverUrl ? (
                        <div className="relative aspect-[16/10] overflow-hidden bg-cvlt-gray-100">
                          {album.coverIsVideo ? (
                            <>
                              <video
                                src={album.coverUrl}
                                muted
                                preload="metadata"
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white">
                                  <svg className="h-5 w-5 translate-x-0.5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                </div>
                              </div>
                            </>
                          ) : (
                            <img
                              src={album.coverUrl}
                              alt={album.title}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          )}
                        </div>
                      ) : (
                        <div className="flex aspect-[16/10] items-center justify-center bg-cvlt-gray-100">
                          <svg className="h-10 w-10 text-cvlt-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                          </svg>
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="text-base font-semibold text-cvlt-gray-900 group-hover:text-cvlt-blue">
                          {album.title}
                        </h3>
                        <div className="mt-1 flex items-center gap-2 text-xs text-cvlt-gray-500">
                          <time>
                            {new Date(album.date).toLocaleDateString('it-CH', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </time>
                          <span>&middot;</span>
                          <span>{album.photoCount} foto</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
