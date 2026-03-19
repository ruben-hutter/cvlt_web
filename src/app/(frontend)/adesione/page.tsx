import { MembershipForm } from './MembershipForm'

export const metadata = {
  title: 'Aderire al club — CVLT',
}

export default function MembershipPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold">Aderire al club</h1>

      <div className="mt-6 space-y-4 text-gray-700">
        <p>
          Sei interessato a far parte del nostro club? Compila il modulo sottostante per
          inviare la tua richiesta di adesione. La richiesta sarà visionata dal comitato
          e verrai ricontattato al più presto.
        </p>
        <p>
          Per ulteriori informazioni leggi lo{' '}
          <a href="/statuto" className="text-blue-600 hover:underline">statuto del club</a>{' '}
          o scrivici a{' '}
          <a href="mailto:info@cvlt.ch" className="text-blue-600 hover:underline">info@cvlt.ch</a>.
        </p>
      </div>

      <div className="mt-6 rounded border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
        <p className="font-medium text-gray-700">Quote annuali:</p>
        <ul className="mt-2 space-y-1">
          <li className="flex justify-between sm:justify-start sm:gap-6">
            <span>Soci attivi</span>
            <span className="font-medium text-gray-800">CHF 40.–</span>
          </li>
          <li className="flex justify-between sm:justify-start sm:gap-6">
            <span>Famiglie</span>
            <span className="font-medium text-gray-800">CHF 45.–</span>
          </li>
          <li className="flex justify-between sm:justify-start sm:gap-6">
            <span>Sostenitori</span>
            <span className="font-medium text-gray-800">Contributo libero</span>
          </li>
        </ul>
      </div>

      <p className="mt-6 text-gray-600">
        Compilate il modulo seguente e vi contatteremo al più presto.
      </p>

      <div className="mt-6">
        <MembershipForm />
      </div>
    </main>
  )
}
