'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

type SubLink = { href: string; label: string }
type NavLink = { href: string; label: string; subLinks?: SubLink[] }

const navLinks: NavLink[] = [
  { href: '/notizie', label: 'Notizie' },
  { href: '/calendario', label: 'Calendario' },
  { href: '/galleria', label: 'Galleria' },
  { href: '/vento', label: 'Vento', subLinks: [
    { href: '/vento#stazioni-meteoswiss', label: 'Stazioni MeteoSwiss' },
    { href: '/vento#altre-stazioni', label: 'Altre stazioni' },
    { href: '/vento#pressione', label: 'Pressione' },
    { href: '/vento#laghi', label: 'Laghi' },
    { href: '/vento#radiosondaggi', label: 'Radiosondaggi' },
  ]},
  { href: '/gare', label: 'Gare', subLinks: [
    { href: '/gare#ccc', label: 'CCC' },
    { href: '/gare#hike-and-fly', label: 'Hike & Fly' },
    { href: '/gare#regio-sud', label: 'Regio Sud' },
  ]},
  { href: '/info-volo', label: 'Info volo', subLinks: [
    { href: '/info-volo#spazio-aereo', label: 'Spazio aereo' },
    { href: '/info-volo#meteo-vento', label: 'Meteo & Vento' },
    { href: '/info-volo#link-meteo', label: 'Link meteo' },
    { href: '/info-volo#webcam', label: 'Webcam' },
    { href: '/info-volo#link-utili', label: 'Link utili' },
  ]},
  { href: '/comitato', label: 'Comitato' },
  { href: '/adesione', label: 'Adesione' },
]

export function Header() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-cvlt-gray-200 bg-white/95 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
          <img
            src="/logo_CVLT.png"
            alt="CVLT"
            className="h-10 w-auto"
          />
        </Link>

        {/* Desktop nav */}
        <ul className="hidden gap-1 sm:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <li key={link.href} className={link.subLinks ? 'group relative' : ''}>
                <Link
                  href={link.href}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-cvlt-blue-light text-cvlt-blue-dark'
                      : 'text-cvlt-gray-700 hover:bg-cvlt-gray-50 hover:text-cvlt-blue'
                  }`}
                >
                  {link.label}
                </Link>
                {link.subLinks && (
                  <div className="invisible absolute left-0 top-full z-50 pt-1 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                    <ul className="min-w-[180px] rounded-lg border border-cvlt-gray-200 bg-white py-1 shadow-lg">
                      {link.subLinks.map((sub) => (
                        <li key={sub.href}>
                          <Link
                            href={sub.href}
                            className="block px-4 py-2 text-sm text-cvlt-gray-700 transition-colors hover:bg-cvlt-gray-50 hover:text-cvlt-blue"
                          >
                            {sub.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            )
          })}
        </ul>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-md p-2 text-cvlt-gray-700 hover:bg-cvlt-gray-50 sm:hidden"
          aria-label="Menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-cvlt-gray-200 bg-white px-4 pb-4 sm:hidden">
          <ul className="space-y-1 pt-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-cvlt-blue-light text-cvlt-blue-dark'
                        : 'text-cvlt-gray-700 hover:bg-cvlt-gray-50'
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </header>
  )
}
