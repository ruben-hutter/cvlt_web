import Link from 'next/link'

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold tracking-tight">
          CVLT
        </Link>
        <ul className="flex gap-6 text-sm font-medium">
          <li>
            <Link href="/notizie" className="hover:text-blue-600">
              Notizie
            </Link>
          </li>
          <li>
            <Link href="/calendario" className="hover:text-blue-600">
              Calendario
            </Link>
          </li>
          <li>
            <Link href="/adesione" className="hover:text-blue-600">
              Adesione
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  )
}
