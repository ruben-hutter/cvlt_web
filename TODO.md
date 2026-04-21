# TODOs

## Migration dev.cvlt.ch -> cvlt.ch

- [ ] Update RaiseNow Hub Shop Twint link: success and failure URLs to cvlt.ch/...
- [ ] Move cvlt.ch to old.cvlt.ch so that we can still access the old site for reference
- [ ] Add password eventually for mail login on cvlt.ch

## High priority

- [ ] Understand payload rights for "redattore" role and adjust if needed
- [x] Fix not loaded homepage background image and cvlt logo... maybe also others? Already rebuilt and reloaded but still not showing
- [x] Search in payload is probably case sensitive. Check and if so, make it case insensitive.
- [ ] Setup pipeline: push to dev branch -> test on dev.cvlt.ch -> merge to main -> deploy to cvlt.ch
    - Setup dev.cvlt.ch to pull from dev branch and cvlt.ch to pull from main branch

## Medium priority

- [ ] Add a fzf-like search over the complete website (server-side endpoint, search across news content + events + gallery)
- [ ] Extend the news search also to the content of the news.
- [ ] Aggiungere link ai siti di volo (nuovo sito FSVL)
- [~] Sezione info volo + TMA/CTR/AWY (pagina creata, da controllare contenuti)
    - [~] Controllare contenuti CTR, TMA, AWY, Zone di tranquillità
- [x] Add albums for activities in 2026
- [ ] Gallery page takes a while, maybe we can optimize what's loaded on page call and what can me loaded after (e.g. with lazy loading or pagination)
    - Optimize all pages, especially pages with more and heavier content
- [ ] In "comitato" page make persons containers "flip" on click and behing them show more info (maybe motivation or contact info)
- [ ] Multiple languages (german, french, english)
    - Maybe start with just the homepage and the news section
    - Use i18n in Next.js
    - Add language switcher in header
    - Translate just static content at first, then maybe also news and events
- [ ] Aggiungere pin cartina per luogo eventi (swisstopo API)
- [ ] Auto-post news to Instagram/Facebook
    - Instagram API requires paid tools (Zapier/Make.com); IFTTT free covers Facebook only
    - Revisit when better free options exist

## Low priority

- [ ] Extend the news search also to the content of the news (requires parsing Lexical blocks JSON into plain text).
- [ ] Database (format is not relevant i think) that keeps track of the quantity of shop items available
    - e.g. if a t-shirt in size x and color y is sold, the quantity in the db is updated and if it reaches 0, the selection of that item in the shop is not shown anymore
- [ ] Embed TMA Locarno data similar to https://www.pdcs.ch/aktuell/2026/04/13/luftraum-status-bern/
- [ ] Enforce 2FA for payload login
- [ ] Nuovo logo
    - Concorso per membri
    - Aspettare 40esimo anniversario per lanciarlo

## Done

- [x] Checkout README.md file
- [x] Search function (similar to Gallery page) also for News
- [x] Fuzzy search (Fuse.js + fzf-style sequential matching) on news, gallery, biposto pages — shared utility in src/lib/search.ts
- [x] Payload admin media search: search by alt text instead of filename (useAsTitle: 'alt')
- [x] Gallery: search bar should be big and year selector much smaller!
- [x] Fix not loaded homepage background image and cvlt logo (standalone output missing public/ copy)
- [x] Aggiungere informazioni Gana (verificare se ci sono altri simili) alla sezione info volo
- [x] Add on homepage "Ultime notizie" up to end of TMA Locarno side bar hight and do not limit to 5 news or whatever it is set to now.
- [x] Shop: fare procedi anche senza twint -> fattura per mail sul conto corrente
- [x] Add a "pin" icon to "In primo piano" news
- [x] Add a shared constants file and check also for duplicated code in the codebase. Refactor to use the shared constants and remove duplicates
- [x] Aggiungere opzione pagamento con fattura nello shop
- [x] Move shop as an own menu entry after "Info volo"
- [x] Checkout all the variables that should be set in .env and what the fallback value would be
- [x] Test shop working now? (mail, payment, failed payment no success email)
- [x] Webcams
- [x] Pagina vento — pressione (MAG–KLO) e previsione föhn Lugano–Zürich: dati MOSMIX; finestra previsione 7 giorni (allineata agli ultimi 7 giorni misurati); linee verticali tratteggiate per cambio giorno su entrambi i grafici; griglia orizzontale neutra di riferimento (stesso stile); rimossa linea «ora» sul grafico föhn (l’asse sinistro coincide già con il presente)
- [x] Pin important news (in primo piano): selector in Payload + pinned ordering in listing/home
- [x] Small counter in image viewer showing current image number and total (e.g. "3/15")
- [x] Gare page on mobile: entries clickable (not just the title)
- [x] Replace broken calendario subscribe icon with a proper calendar icon
- [x] Expand info-volo webcams section with direct mountain feeds and fallbacks
- [x] Payment confirmation mail after shop purchase (with order details) to customer and shop manager
- [x] Shop return URL after RaiseNow payment (configured in RaiseNow Hub)
- [x] Update .env on server with latest email variables (follow .env.example)
- [x] Import all photos from old website into gallery with correct albums
- [x] Global cursor:pointer for buttons, calendar backup date clicking, shop checkout UX
- [x] Check password reset
- [x] Dropdown / submenu per sezioni Vento, Gare, Info volo con anchor links
- [x] Live pressure chart (MAG-KLO) + föhn forecast (DWD MOSMIX Lugano-Zürich)
- [x] TMA Locarno image on homepage sidebar and info volo page
- [x] Verify vento data matches the old vento.cvlt.ch page
- [x] Slug-based URLs for events + Payload migration
- [x] Gare page (CCC, Hike & Fly, Regio Sud)
- [x] Event description on detail page
- [x] Video support in gallery
- [x] Vento & Meteo page: progressive loading, direct API calls (no more vento.cvlt.ch proxy)
- [x] Calendario: eventi su più giorni come barra continua, mostrare data di riserva nel calendario, legenda colori
- [x] Preview bozze (notizie) con live preview panel in Payload admin
- [x] Cambiare indirizzo mail in `.env` a quello di Roti per production (formulario d'adesione)
- [x] Rotate keys following guide (`.env` hardened, PAYLOAD_SECRET rotated)
- [x] Include on the website https://vento.cvlt.ch/ - native /vento page with live data
- [x] Why is package.json so complicated? - documented build steps
- [x] Design with three columns: center-align last row (comitato page)
- [x] Vento & Meteo page: native dashboard with live data from vento.cvlt.ch (wind stations, flight forecast, pressure, lakes)
- [x] Comitato grid: center-align last row (flexbox)
- [x] Comitato page with committee members grid
- [x] Fix build: ISR with try/catch for non-dynamic pages, empty generateStaticParams for dynamic routes
- [x] Remove custom LogoutLink (Payload has built-in logout)
- [x] Build-time warning for missing NEXT_PUBLIC_SERVER_URL
- [x] Fresh-start script (`scripts/fresh-start.sh`) for clean DB setup on server
- [x] News: listing + article pages with Payload CMS
- [x] Events / Calendar: calendar UI, event detail pages
- [x] Membership form with email confirmation via Infomaniak SMTP
- [x] Photo gallery with year/event filters, lightbox, bulk upload
- [x] Homepage: hero, news teaser, events sidebar, gallery teaser, Twint donations
- [x] News tags: event tag pill badges on news, gallery, homepage
- [x] Pagina quota sociale con cedolino QR e Twint
- [x] Logo in header/hero, hero background image, favicon
- [x] Social links in footer (WhatsApp, Instagram, Facebook)
- [x] WhatsApp community: approvazione admin per nuovi membri
- [x] Check before pull on server, that the last changes (2FA) did not alter the db
- [x] Update style on mobile for "Vento" page
- [x] News cards fully clickable/touchable on mobile
- [x] Checkout errors that Nico told me on Signal (font preload warnings - known Next.js behavior)
- [x] Zone di tranquillità content from old site
- [x] Full screen gallery view with F key shortcut
- [x] Pagina "Voli in Biposto" + riorg. menu principale (Club dropdown)
- [x] Mobile menu overlay with expandable submenus
- [x] Slug regeneration bug fix (only regenerate when title changes)
- [x] Gallery cursor pointer on hover
- [x] 2025 CCC Hall of Fame + year selector dropdown
- [x] Replace unicode dashes with HTML entities
- [x] localStorage caching + hash anchor scrolling for vento page
- [x] Hide reset TOTP checkbox on user creation screen
- [x] RSS feed + iCal calendar subscription
- [x] Shop (product images, order API, redirect checkout, email notifications)
- [x] Contact form (page, API, email notifications)
- [x] Mobile-friendly shop cart (full-screen overlay, card layout)
- [x] Mobile-friendly H&F calendar (card layout) + colored Open/Fun badges
- [x] Consistent max-w-5xl layout across all pages
