# Plate Watch

A static single-page site showing Hyderabad restaurants, their FSSAI hygiene ratings, and public food-safety enforcement findings. No backend, no server, no running costs.

## How it fits together

```
data/entries.json      <- source of truth (edit this by hand)
      |
      |  npm run collect  (runs automatically before every build)
      v
public/data.json       <- generated; the SPA fetches this
      |
      v
Vite build  ->  dist/  ->  Cloudflare Pages / GitHub Pages
```

Two kinds of listing are supported: voluntary **FSSAI hygiene ratings** and **enforcement findings** from food-safety task-force drives. The card UI tags each so they're never conflated.

## Run it locally

```bash
npm install        # first time: creates package-lock.json — commit it
npm run dev        # generates data.json, then starts the dev server
```

Build the production bundle:

```bash
npm run build      # prebuild regenerates data.json, then Vite builds to dist/
npm run preview    # serve the built site locally to check it
```

## Add or update a listing

Edit `data/entries.json` and add an object. Schema (see `scripts/schema.mjs`):

```json
{
  "id": "unique-slug",
  "name": "Restaurant name",
  "area": "Locality",
  "cuisine": "Optional",
  "type": "rating | enforcement",
  "metric": { "kind": "percent | stars", "value": 92 },
  "status": "Rated | Improvement Notice | Notice served | ...",
  "inspectedOn": "YYYY-MM-DD",
  "source": "FSSAI Hygiene Rating | CFS Telangana | GHMC Food Safety",
  "sourceUrl": "https://...",
  "notes": "One-line finding."
}
```

`metric.value` may be `null` when no score was published. Every listing should keep a `sourceUrl` — attaching enforcement findings to named businesses without provenance carries defamation risk, so the UI always links back to the source.

## Deploy — Cloudflare Pages (recommended)

1. Push this repo to a personal GitHub/GitLab repo.
2. In the Cloudflare dashboard: **Workers & Pages -> Create -> Pages -> Connect to Git**.
3. Build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Deploy. You get an HTTPS URL at `your-project.pages.dev`, redeployed on every push.

Because the site serves from the domain root, leave `base: '/'` in `vite.config.js`.

## Deploy — GitHub Pages (alternative)

1. Set `base: '/plate-watch/'` in `vite.config.js` (project sites live under a subpath).
2. Build and publish `dist/` (via a Pages action or by pushing `dist/` to a `gh-pages` branch).
3. Site serves at `https://<username>.github.io/plate-watch/`.

## Automated ingestion (optional)

`.github/workflows/ingest.yml` runs weekly, calls the adapters in `scripts/sources.mjs`, merges any new entries into `data/entries.json`, and commits them — which triggers a Pages rebuild. On a **public** repo the Action minutes are free.

The adapters ship as documented stubs. The honest reality for a solo project:

- **FSSAI** exposes only a single-record lookup, no bulk/city endpoint.
- **@cfs_telangana** lives on X, whose API is paywalled and whose scraping breaks its ToS.
- **GHMC** findings appear in press coverage you'd have to parse per-article.

So the dependable path is curating `data/entries.json` yourself as reports come in; wire up an adapter only if/when you have a reliable source. Either way the same build-and-publish pipeline carries it live.
