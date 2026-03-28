'use client'

import { useState } from 'react'

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-5 w-5 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  )
}

function Section({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-cvlt-gray-200 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left text-lg font-semibold text-cvlt-gray-900 transition-colors hover:text-cvlt-blue"
      >
        {title}
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm leading-relaxed text-cvlt-gray-700">{children}</div>
      )}
    </div>
  )
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-medium text-cvlt-blue transition-colors hover:text-cvlt-blue-dark"
    >
      {children}
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-4.5-6H18m0 0v4.5m0-4.5L10.5 13.5" />
      </svg>
    </a>
  )
}

function LinkCard({
  title,
  description,
  href,
}: {
  title: string
  description: string
  href: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-3 rounded-lg border border-cvlt-gray-200 p-4 transition-all hover:border-cvlt-blue/30 hover:shadow-md"
    >
      <div className="flex-1">
        <h3 className="font-semibold text-cvlt-gray-900 group-hover:text-cvlt-blue">{title}</h3>
        <p className="mt-0.5 text-sm text-cvlt-gray-500">{description}</p>
      </div>
      <svg
        className="mt-0.5 h-4 w-4 flex-shrink-0 text-cvlt-gray-400 transition-colors group-hover:text-cvlt-blue"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-4.5-6H18m0 0v4.5m0-4.5L10.5 13.5" />
      </svg>
    </a>
  )
}

export function InfoVoloContent() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-cvlt-gray-900">Informazioni di volo</h1>
      <p className="mt-4 text-cvlt-gray-700">
        Una panoramica sullo spazio aereo ticinese, le fonti meteo e i link utili per volare in sicurezza.
        Le informazioni ufficiali e aggiornate si trovano sempre sul sito della{' '}
        <ExternalLink href="https://www.shv-fsvl.ch">FSVL</ExternalLink>.
      </p>

      {/* Spazio aereo */}
      <div id="spazio-aereo" className="mt-10">
        <h2 className="text-xl font-bold text-cvlt-gray-900">Spazio aereo</h2>
        <p className="mt-2 text-sm text-cvlt-gray-600">
          Il Ticino presenta diverse zone regolamentate. Prima di ogni volo consulta il{' '}
          <strong>DABS</strong> (Daily Airspace Bulletin): riporta le restrizioni giornaliere
          dello spazio aereo, incluse attivazioni TMA, zone di tiro, manifestazioni aeree e
          voli militari speciali. Le ore sono in <strong>UTC</strong> (aggiungere 1h in inverno,
          2h in estate).
        </p>
        <p className="mt-3">
          <ExternalLink href="https://www.skybriefing.com/it/dabs">
            Consulta il DABS su skybriefing.com
          </ExternalLink>
        </p>

        <div className="mt-6 rounded-lg border border-cvlt-gray-200">
          <Section title="Zone di controllo (CTR)" defaultOpen>
            <p>
              Attorno agli aeroporti di <strong>Locarno-Magadino</strong> e{' '}
              <strong>Lugano-Agno</strong> esistono zone di controllo (CTR) in cui il volo
              libero richiede l&apos;autorizzazione della torre di controllo.
            </p>
            <ul className="mt-3 list-inside list-disc space-y-1">
              <li>Contattare la torre via radio prima di entrare nella CTR</li>
              <li>Rispettare le frequenze e le procedure pubblicate</li>
              <li>Verificare lo stato di attivazione sul DABS</li>
            </ul>
          </Section>

          <Section title="Regioni terminali (TMA)">
            <p>
              Le TMA si estendono sopra le CTR e limitano l&apos;altitudine massima di volo.
            </p>
            <ul className="mt-3 list-inside list-disc space-y-1">
              <li>
                <strong>TMA Locarno-Magadino</strong> — temporanea, attivata solo durante gli
                orari operativi dell&apos;aeroporto. Quando attiva limita il volo sopra una
                certa quota.
              </li>
              <li>
                <strong>TMA Milano</strong> — permanente, può limitare la quota nel
                Sottoceneri (zona Lugano/Mendrisio). Verificare le altitudini sul DABS.
              </li>
            </ul>
            <p className="mt-3">
              Si può volare sotto la TMA senza autorizzazione, ma mai al suo interno senza
              permesso.
            </p>

            <div className="mt-5 rounded-lg border border-cvlt-gray-200 bg-cvlt-gray-50 p-4">
              <a
                href="https://www.facebook.com/TMA-Locarno-1037676889614177/"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <img
                  src="/tmalocarno.png"
                  alt="TMA Locarno"
                  className="mx-auto w-full max-w-xs rounded"
                />
              </a>
              <p className="mt-3 text-sm">
                Su{' '}
                <ExternalLink href="https://www.facebook.com/TMA-Locarno-1037676889614177/">
                  Facebook
                </ExternalLink>{' '}
                è possibile consultare la pianificazione settimanale della TMA di Locarno.
              </p>
              <p className="mt-2 text-xs text-cvlt-gray-500">
                La pagina FB ha una valenza puramente informativa e non vincolante.
                Consultare sempre l&apos;ATIS ({' '}
                <a href="tel:+41918161744" className="font-medium text-cvlt-blue hover:underline">
                  +41 91 816 17 44
                </a>
                ) prima di decollare.
              </p>
            </div>
          </Section>

          <Section title="Aerovie (AWY)">
            <p>
              Diverse aerovie attraversano lo spazio aereo ticinese. I corridoi aerei hanno
              limiti inferiori che variano:
            </p>
            <ul className="mt-3 list-inside list-disc space-y-1">
              <li>
                <strong>Durante orari militari (HX)</strong> — limite inferiore FL 130
                (~3950 m)
              </li>
              <li>
                <strong>Al di fuori degli orari militari</strong> — limite inferiore FL 150
                (~4550 m)
              </li>
            </ul>
            <p className="mt-3">
              Il transito attraverso un&apos;aerovia sopra il limite inferiore richiede
              un&apos;autorizzazione.
            </p>
          </Section>

          <Section title="Zone di tranquillità">
            <p>
              Zone di protezione della fauna con divieto di sorvolo sotto 200 m AGL (sopra il
              livello del suolo). Attenzione alle restrizioni stagionali:
            </p>
            <ul className="mt-3 list-inside list-disc space-y-1">
              <li>
                <strong>ZT.02 Capolago</strong> — 15 febbraio – 15 agosto
              </li>
              <li>
                <strong>ZT.20 Pizzo d&apos;Orgnana</strong> — 1 gennaio – 31 marzo
              </li>
              <li>
                <strong>ZT.27 Brogoldone</strong> — 1 gennaio – 31 marzo
              </li>
            </ul>
            <p className="mt-3">
              <ExternalLink href="https://map.geo.admin.ch/?layers=ch.bafu.wrz-wildruhezonen_portal">
                Mappa zone di tranquillità
              </ExternalLink>
            </p>
          </Section>
        </div>
      </div>

      {/* Vento CVLT */}
      <div id="meteo-vento" className="mt-10">
        <h2 className="text-xl font-bold text-cvlt-gray-900">Meteo &amp; Vento</h2>
        <a
          href="/vento"
          className="group mt-4 flex items-center gap-4 rounded-lg border-2 border-cvlt-blue/20 bg-cvlt-blue-light p-5 transition-all hover:border-cvlt-blue/40 hover:shadow-md"
        >
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-cvlt-blue text-white">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-cvlt-gray-900 group-hover:text-cvlt-blue">
              Vento CVLT
            </h3>
            <p className="text-sm text-cvlt-gray-600">
              Stazioni meteo, radiosondaggi, pressione e dati BAFU/MCH in tempo reale per il Sud delle Alpi.
            </p>
          </div>
          <svg
            className="h-5 w-5 flex-shrink-0 text-cvlt-gray-400 transition-colors group-hover:text-cvlt-blue"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </a>
      </div>

      {/* Altri link meteo */}
      <div id="link-meteo" className="mt-10">
        <h2 className="text-xl font-bold text-cvlt-gray-900">Altri link meteo</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <LinkCard
            title="MeteoSvizzera"
            description="Previsioni federali ufficiali"
            href="https://www.meteosvizzera.admin.ch"
          />
          <LinkCard
            title="SHV / FSVL Meteo"
            description="Previsioni meteo della federazione"
            href="https://www.meteo-shv.ch/"
          />
          <LinkCard
            title="Soaring Meteo"
            description="Previsioni per il volo termodinamico"
            href="https://soaringmeteo.org/v2/model=wrf&zone=central-alps"
          />
          <LinkCard
            title="Meteo-Parapente"
            description="Previsioni specifiche per il parapendio"
            href="https://meteo-parapente.com"
          />
          <LinkCard
            title="XCtherm"
            description="Mappa termica per il volo libero"
            href="https://xctherm.com/map"
          />
          <LinkCard
            title="burnair Map"
            description="Mappa interattiva siti e condizioni"
            href="https://map.burnair.cloud/"
          />
        </div>
      </div>

      {/* Webcams */}
      <div id="webcam" className="mt-10">
        <h2 className="text-xl font-bold text-cvlt-gray-900">Webcam</h2>
        <p className="mt-2 text-sm text-cvlt-gray-700">
          Webcam utili per valutare le condizioni di volo in Ticino.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <LinkCard
            title="Cimetta (Cardada)"
            description="Vista sul Lago Maggiore"
            href="https://www.cardada.ch/it/webcam"
          />
          <LinkCard
            title="Monte Tamaro"
            description="Vista verso sud"
            href="https://www.montetamaro.ch/it/webcam/"
          />
          <LinkCard
            title="Monte Lema"
            description="Panoramica Malcantone"
            href="https://www.montelema.ch/en/webcam/"
          />
          <LinkCard
            title="Monte Generoso"
            description="Vista sul Mendrisiotto"
            href="https://www.montegeneroso.ch/it/webcam"
          />
        </div>
      </div>

      {/* Link utili */}
      <div id="link-utili" className="mt-10">
        <h2 className="text-xl font-bold text-cvlt-gray-900">Link utili</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <LinkCard
            title="FSVL / SHV"
            description="Federazione svizzera di volo libero"
            href="https://www.shv-fsvl.ch"
          />
          <LinkCard
            title="FAI / CIVL"
            description="Federazione aeronautica internazionale"
            href="https://www.fai.org/commission/civl"
          />
          <LinkCard
            title="UFAC / BAZL"
            description="Ufficio federale dell'aviazione civile"
            href="https://www.bazl.admin.ch"
          />
          <LinkCard
            title="Skybriefing"
            description="NOTAM, DABS e carte aeronautiche"
            href="https://www.skybriefing.com"
          />
          <LinkCard
            title="XContest"
            description="Classifica voli e tracce GPS"
            href="https://www.xcontest.org"
          />
          <LinkCard
            title="burnair"
            description="Informazioni siti di volo Svizzera"
            href="https://www.burnair.ch"
          />
        </div>
      </div>
    </main>
  )
}
