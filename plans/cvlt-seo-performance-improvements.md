# CVLT Website – SEO & Performance Improvements

Audit based on Google Search Console best practices and homepage analysis of [cvlt.ch](https://cvlt.ch).

---

## 1. Image Filenames with Spaces

**Problem:** Images are served with URL-encoded spaces, e.g.:
```
/api/media/file/MS%20Swiss%20Open%20Disentis%2025%20064.jpg
```
Google prefers clean, descriptive, hyphenated filenames.

**Fix:**
- Rename all media files before uploading: use hyphens instead of spaces.
- Example: `swiss-cup-ticino-2026-monte-lema.jpg` instead of `Swiss Cup Ticino 2026 Monte Lema.jpg`
- If files are programmatically uploaded or stored, sanitize filenames on ingest:
  ```js
  filename.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9.\-]/g, '')
  ```

---

## 2. Missing Alt Text on Images

**Problem:** News thumbnail `<img>` tags appear to have no `alt` attributes. Alt text is essential for Google image search and accessibility.

**Fix:** Add descriptive, keyword-rich alt text to every image.

```html
<!-- Bad -->
<img src="/api/media/file/swiss-cup-ticino-2026.jpg" />

<!-- Good -->
<img
  src="/api/media/file/swiss-cup-ticino-2026.jpg"
  alt="Piloti in decollo al Monte Lema durante Swiss Cup Ticino 2026"
/>
```

- News post thumbnails: use the post title or a description of the scene.
- Gallery images: describe the content and event name.
- Logo: `alt="CVLT – Club Volo Libero Ticino"`.

---

## 3. Structured Data (Schema.org JSON-LD)

**Problem:** No structured data is present. Google can display rich results for events, organizations, and breadcrumbs.

### 3a. Organization Schema (add to `<head>` on every page)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SportsOrganization",
  "name": "Club Volo Libero Ticino",
  "alternateName": "CVLT",
  "url": "https://cvlt.ch",
  "logo": "https://cvlt.ch/logo_CVLT.png",
  "foundingDate": "1987",
  "email": "info@cvlt.ch",
  "address": {
    "@type": "PostalAddress",
    "addressRegion": "Ticino",
    "addressCountry": "CH"
  },
  "sport": "Paragliding"
}
</script>
```

### 3b. Event Schema (add to each calendar/event page)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "Swiss Cup Ticino 2026",
  "startDate": "2026-05-01",
  "endDate": "2026-05-03",
  "location": {
    "@type": "Place",
    "name": "Monte Lema",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Miglieglia",
      "addressCountry": "CH"
    }
  },
  "organizer": {
    "@type": "Organization",
    "name": "Club Volo Libero Ticino",
    "url": "https://cvlt.ch"
  },
  "url": "https://cvlt.ch/notizie/swiss-cup-ticino-2026-monte-lema-1-3-maggio"
}
</script>
```

> **Note:** Generate this dynamically for each event page using the event's own data.

### 3c. BreadcrumbList Schema (add to inner pages)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://cvlt.ch" },
    { "@type": "ListItem", "position": 2, "name": "Notizie", "item": "https://cvlt.ch/notizie" },
    { "@type": "ListItem", "position": 3, "name": "Swiss Cup Ticino 2026", "item": "https://cvlt.ch/notizie/swiss-cup-ticino-2026-monte-lema-1-3-maggio" }
  ]
}
</script>
```

---

## 4. Logo & Static Asset Formats

**Problem:** `logo_CVLT.png` and `tmalocarno.png` are served as PNG. SVG is preferable for logos (scalable, smaller file size).

**Fix:**
- Convert logos to **SVG** if vector source is available.
- If SVG is not possible, convert to **WebP** with a PNG fallback:

```html
<picture>
  <source srcset="/logo_CVLT.webp" type="image/webp" />
  <img src="/logo_CVLT.png" alt="CVLT – Club Volo Libero Ticino" width="200" height="80" />
</picture>
```

---

## 5. Image Optimization & Core Web Vitals

**Problem:** Large or unoptimized images hurt LCP (Largest Contentful Paint) and CLS (Cumulative Layout Shift) — both Core Web Vitals scored by Google.

### 5a. Always include width and height on images
This prevents layout shift as images load:
```html
<img src="..." alt="..." width="800" height="600" />
```

### 5b. Use lazy loading for below-the-fold images
```html
<img src="..." alt="..." loading="lazy" width="800" height="600" />
```

### 5c. Serve images in WebP format
Ensure the image serving endpoint (`/api/media/file/`) returns WebP when the browser supports it (check `Accept` header), or use a `<picture>` element with WebP source.

### 5d. Preload the hero/LCP image
The logo or first hero image should be preloaded in `<head>`:
```html
<link rel="preload" as="image" href="/logo_CVLT.png" />
```

---

## 6. Meta Descriptions

**Problem:** Each page needs a unique `<meta name="description">` of ~150 characters for Google to display in search results.

**Fix:** Add unique meta descriptions to every page template. Examples:

```html
<!-- Homepage -->
<meta name="description" content="Club Volo Libero Ticino (CVLT) — associazione di parapendio e deltaplan in Ticino dal 1987. Gare, notizie, meteo e calendario eventi." />

<!-- Notizie index -->
<meta name="description" content="Ultime notizie dal Club Volo Libero Ticino: eventi, gare, condizioni meteo e aggiornamenti dalla comunità del volo libero ticinese." />

<!-- Event page (dynamic) -->
<meta name="description" content="[Event title] — [date], [location]. Scopri tutti i dettagli su cvlt.ch." />
```

Also add Open Graph tags for social sharing:
```html
<meta property="og:title" content="Swiss Cup Ticino 2026 – Monte Lema" />
<meta property="og:description" content="Gara di parapendio al Monte Lema, 1–3 maggio 2026." />
<meta property="og:image" content="https://cvlt.ch/api/media/file/swiss-cup-ticino-2026.jpg" />
<meta property="og:url" content="https://cvlt.ch/notizie/swiss-cup-ticino-2026-monte-lema-1-3-maggio" />
<meta property="og:type" content="article" />
```

---

## 7. Sitemap & Crawlability

**Problem:** Google needs to know about all pages — especially new news posts and calendar events — as quickly as possible.

**Fix:**
- Ensure `https://cvlt.ch/sitemap.xml` exists and is submitted in Google Search Console.
- The sitemap should include: all news posts, all calendar/event pages, and static pages.
- Add `<lastmod>` dates to the sitemap entries for news posts.
- Ensure `robots.txt` at `https://cvlt.ch/robots.txt` is not accidentally blocking important paths like `/notizie/` or `/calendario/`.

---

## 8. `lang` Attribute on `<html>`

**Problem:** The site is in Italian but the `<html>` element likely lacks a `lang` attribute, which affects search ranking and accessibility.

**Fix:**
```html
<html lang="it">
```

---

## Priority Order

| Priority | Task |
|----------|------|
| 🔴 High | Add `alt` text to all images |
| 🔴 High | Add `lang="it"` to `<html>` |
| 🔴 High | Add meta descriptions to all pages |
| 🔴 High | Submit sitemap in Search Console |
| 🟠 Medium | Add Organization + Event JSON-LD structured data |
| 🟠 Medium | Add `width`/`height` + `loading="lazy"` to images |
| 🟠 Medium | Sanitize image filenames on upload |
| 🟡 Low | Convert logos to SVG or WebP |
| 🟡 Low | Serve all media images as WebP |
| 🟡 Low | Add Open Graph meta tags |
| 🟡 Low | Add BreadcrumbList structured data |
