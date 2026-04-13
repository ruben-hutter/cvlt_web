# CVLT Web - Project Context for Claude

## What is this?
A full rebuild of the paragliding club website [cvlt.ch](https://cvlt.ch) for **Club Volo Libero Ticino**.
Deployed at `dev.cvlt.ch` during development. Built by Ruben with Claude.

## Tech Stack (decided, not negotiable)
| Layer | Tech |
|:---|:---|
| Framework | **Next.js** (latest, App Router) |
| CMS | **Payload 3.0** (embedded in Next.js - this is its primary use case) |
| Database | **SQLite** via `@payloadcms/db-sqlite` |
| Styling | **Tailwind CSS** |
| Runtime | **Node.js 24 LTS** |
| Email | **Nodemailer** via Infomaniak SMTP (transactional, for membership form) |
| Hosting | **Infomaniak** shared hosting (one Node.js process per site) - this is why Astro was dropped |

> Astro was considered and dropped. Single Next.js + Payload app is the right fit for Infomaniak shared hosting.

## Priority Features (build in this order)
1. **News** - listing + article pages, with Payload CMS for editors
2. **Events / Calendar** - proper calendar UI (not a list), managed via Payload
3. **Membership form** - with email confirmation via Resend (current WP form broken due to Caldera Forms + SMTP failure)
4. **Photo gallery** - single page with year/event filters (NOT one page per year like the old site) - lower priority
5. **Flying info section** - much more concise than old site, mostly links to SHV and official sources - lower priority

## What is NOT being ported
- "Chi è in volo?" (live flight tracker) - dropped entirely
- CTR/TMA/AWY as separate pages - will be one page with collapsable sections (low priority)
- All old WordPress plugins, Caldera Forms, Elementor

## Language
Italian only for now. Multilingual is possible in the future but not a priority.

## Payload Collections to build
- **News**: title, slug, content (RichText), date, thumbnail, category (featured/archive/activities), author
- **Events**: title, date (start + end), location/meeting point, backup date, external link
- **MembershipForm**: stores form submissions + triggers email via Resend

## Key Architecture Notes
- Payload admin panel lives at `/admin`
- SQLite DB is a file on disk - make sure it's in `.gitignore` and backed up separately
- Photos are stored on Infomaniak, accessible via `dev.cvlt.ch` subdomain (same hosting account as `cvlt.ch`)
- Photo gallery storage cleanup is pending (years of mess)

## Repo & Hosting
- GitHub repo: `cvlt_web` (private, Ruben's account)
- Infomaniak install method: **Git** (paste HTTPS clone URL in Infomaniak panel)
- Infomaniak plan: Web hosting 250GB / 20 sites / ~130 CHF/year

## Design Direction
Modern, clean, fast. Tailwind utility classes. No WordPress aesthetic.
The old site is at cvlt.ch - use it as a content reference, not a design reference.
