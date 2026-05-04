# CVLT Web - Project Context for Claude

## What is this?
The paragliding club website [cvlt.ch](https://cvlt.ch) for **Club Volo Libero Ticino**.
The site is live in production. Current work is iterating on details and adding features following `TODO.md` and `plans/`.

## Production Setup
- **Production**: `cvlt.ch` — pulls from `main` branch
- **Staging**: `dev.cvlt.ch` — pulls from `dev` branch
- Both run on the same Infomaniak hosting account

## Tech Stack (not negotiable)
| Layer | Tech |
|:---|:---|
| Framework | **Next.js** (latest, App Router) |
| CMS | **Payload 3.0** (embedded in Next.js) |
| Database | **SQLite** via `@payloadcms/db-sqlite` |
| Styling | **Tailwind CSS** |
| Runtime | **Node.js 24 LTS** |
| Email | **Nodemailer** via Infomaniak SMTP (transactional) |
| Hosting | **Infomaniak** shared hosting (one Node.js process per site) |

## Site Sections (all live)
- **Homepage** — hero, latest news, events sidebar, TMA Locarno, Twint donations
- **News** (`/notizie`) — listing + article pages, search, pinned news
- **Events / Calendar** (`/calendario`) — calendar UI, event detail pages, iCal subscription
- **Gallery** (`/galleria`) — single page with year/album filters, lightbox, video support
- **Vento & Meteo** (`/vento`) — live wind stations, pressure chart, föhn forecast
- **Info volo** (`/info-volo`) — airspace info, webcams, useful links
- **Comitato** (`/comitato`) — committee members grid
- **Shop** (`/shop`) — products, Twint + invoice payment, email notifications
- **Gare** (`/gare`) — CCC Hall of Fame, Hike & Fly, Regio Sud calendars
- **Voli in Biposto** (`/biposto`) — tandem flight info
- **Contact** (`/contatto`) — contact form with email notification
- **Membership** (`/adesione`) — membership form with email confirmation

## Payload Collections
- **News**: title, slug, content (RichText), date, thumbnail, category, author, pinned
- **Events**: title, slug, date (start + end), location, backup date, description, external link
- **Media**: images + video, alt text, admin search by alt
- **PhotoAlbums**: title, slug, year, images, thumbnail
- **MembershipForm**: form submissions + triggers email
- **ShopOrders**: order tracking + email notifications

## Key Architecture Notes
- Payload admin panel at `/admin`
- SQLite DB file on disk — in `.gitignore`, backed up via prebuild script (keeps last 30)
- Analytics: GoatCounter (privacy-friendly, no cookies)
- Security: CSP headers, rate limiting, 2FA on all admin users, XSS escaping
- Pipeline: push to `dev` → test on `dev.cvlt.ch` → merge to `main` → deploy to `cvlt.ch`

## Language
Italian only. Multilingual possible in the future (see TODO.md).

## Repo & Hosting
- GitHub repo: `cvlt_web` (private, Ruben's account)
- Infomaniak install method: **Git** (HTTPS clone URL in Infomaniak panel)
- Infomaniak plan: Web hosting 250GB / 20 sites / ~130 CHF/year

## Design Direction
Modern, clean, fast. Tailwind utility classes.

## Working Conventions
- Follow `TODO.md` for current priorities and `plans/` for planned features
- The `plans/` directory contains research/plan documents for upcoming work
