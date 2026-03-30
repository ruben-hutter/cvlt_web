# TODOs

## High priority

- [x] RSS feed + iCal calendar subscription
- [ ] Shop
    - Checkout Saferpay or similar (Raisenow also possible? I already have an account there)
    - T-Shirt uomo e donna assieme con più immagini e selezione sesso
    - Uguale per Giacca Fleece

## Medium priority

- [~] Import (if possible in an automated way) all the photos from the old website (gallery only, not all pictures)
    - If possible already put them in the right albums
- [~] Sezione info volo + TMA/CTR/AWY (pagina creata, da controllare contenuti)
    - [~] Controllare contenuti CTR, TMA, AWY, Zone di tranquillità
- [ ] Webcams

## Low priority

- [ ] Enforce 2FA for payload login
- [ ] In "comitato" page make persons containers "flip" on click and behing them show more info (maybe motivation or contact info)
- [ ] Nuovo logo
    - Concorso per membri
    - Aspettare 40esimo anniversario per lanciarlo
- [ ] Aggiungere sezione "sponsor" con i loghi degli sponsor
- [ ] Add possibility for users to add pictures to the gallery (with admin approval)
    - Limit uploaded images
    - DDOS protection
- [ ] Multiple languages (german, french, english)
    - Maybe start with just the homepage and the news section
    - Use i18n in Next.js
    - Add language switcher in header
    - Translate just static content at first, then maybe also news and events
- [ ] Aggiungere pin cartina per luogo eventi
- [ ] Auto-post news to Instagram/Facebook
    - Instagram API requires paid tools (Zapier/Make.com); IFTTT free covers Facebook only
    - Revisit when better free options exist

## Done

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
- [x] Include on the website https://vento.cvlt.ch/ — native /vento page with live data
- [x] Why is package.json so complicated? — documented build steps
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
- [x] Checkout errors that Nico told me on Signal (font preload warnings — known Next.js behavior)
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
