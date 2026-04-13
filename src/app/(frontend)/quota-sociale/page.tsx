import type { Metadata } from 'next'
import { TwintButton } from '../components/TwintButton'

export const metadata: Metadata = {
  title: 'Pagamento quota sociale - CVLT',
}

export default function QuotaSocialePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold text-cvlt-gray-900">Pagamento quota sociale</h1>
      <p className="mt-4 text-cvlt-gray-700">
        I soci possono versare comodamente la quota sociale tramite bonifico bancario
        o con Twint scansionando il codice QR direttamente dallo smartphone.
      </p>

      <section className="mt-8 rounded-lg border border-cvlt-gray-200 p-6">
        {/* Bank details + QR side by side */}
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="font-medium text-cvlt-gray-500">IBAN</dt>
              <dd className="mt-0.5 font-mono text-cvlt-gray-900">CH82 0900 0000 6900 0419 3</dd>
            </div>
            <div>
              <dt className="font-medium text-cvlt-gray-500">Beneficiario</dt>
              <dd className="mt-0.5 text-cvlt-gray-900">Club Volo Libero Ticino, 6500 Bellinzona</dd>
            </div>
          </dl>
          <img
            src="/qr-bill.png"
            alt="QR code per il pagamento della quota sociale"
            className="w-44 flex-shrink-0 rounded-md"
          />
        </div>

        {/* Twint divider */}
        <div className="mt-6 border-t border-cvlt-gray-200 pt-6">
          <p className="text-center text-sm font-medium text-cvlt-gray-700">
            Oppure paga direttamente con Twint:
          </p>
          <div className="mt-3 flex justify-center">
            <TwintButton solutionId="yjfqp" />
          </div>
        </div>
      </section>

      <p className="mt-8 text-center text-sm font-medium text-cvlt-gray-500">
        Grazie di cuore per il vostro sostegno!
      </p>
    </main>
  )
}
