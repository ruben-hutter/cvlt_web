import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-cvlt-navy text-gray-300">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-3">
          {/* Club info */}
          <div>
            <h3 className="text-lg font-bold text-white">CVLT</h3>
            <p className="mt-2 text-sm leading-relaxed">
              Club Volo Libero Ticino
              <br />
              Parapendio in Ticino dal 1988
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Navigazione
            </h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/notizie" className="transition-colors hover:text-white">
                  Notizie
                </Link>
              </li>
              <li>
                <Link href="/calendario" className="transition-colors hover:text-white">
                  Calendario
                </Link>
              </li>
              <li>
                <Link href="/adesione" className="transition-colors hover:text-white">
                  Adesione
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Contatto
            </h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a href="mailto:info@cvlt.ch" className="transition-colors hover:text-white">
                  info@cvlt.ch
                </a>
              </li>
              <li>
                <a
                  href="https://cvlt.ch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-white"
                >
                  cvlt.ch
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-700 pt-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Club Volo Libero Ticino
        </div>
      </div>
    </footer>
  )
}
