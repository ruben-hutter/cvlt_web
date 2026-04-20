'use client'

type SearchYearFilterProps = {
  search: string
  onSearchChange: (value: string) => void
  selectedYear: number | null
  onYearChange: (year: number | null) => void
  years: number[]
  searchPlaceholder?: string
}

export function SearchYearFilter({
  search,
  onSearchChange,
  selectedYear,
  onYearChange,
  years,
  searchPlaceholder = 'Cerca...',
}: SearchYearFilterProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
      <div className="relative flex-1">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cvlt-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 pl-10 text-sm text-cvlt-gray-900 placeholder:text-cvlt-gray-400 focus:border-cvlt-blue focus:outline-none focus:ring-1 focus:ring-cvlt-blue"
        />
      </div>
      <select
        value={selectedYear ?? ''}
        onChange={(e) => onYearChange(e.target.value ? Number(e.target.value) : null)}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-cvlt-gray-900 focus:border-cvlt-blue focus:outline-none focus:ring-1 focus:ring-cvlt-blue sm:w-32"
      >
        <option value="">Tutti gli anni</option>
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  )
}
