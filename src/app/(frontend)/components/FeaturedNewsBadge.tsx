export function FeaturedNewsBadge() {
  return (
    <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
      <svg
        className="h-3 w-3"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3h6l-1 6 3 3v1H7v-1l3-3-1-6Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 13v8" />
      </svg>
      In primo piano
    </span>
  )
}
