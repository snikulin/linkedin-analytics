# LinkedIn Analytics — Local PWA

Private-first analytics for LinkedIn export files. Runs fully in the browser as a PWA with no servers or external APIs. Upload your XLSX/ODS/CSV, map the columns, and explore dashboards for overview, timing, and content performance.

---

## Technology Stack

- React + Vite: fast, lightweight build and DX (TypeScript optional).
- shadcn/ui + Tailwind CSS: accessible, composable UI components.
- Charts: ECharts (flexible, performant) — Recharts acceptable as fallback.
- Compute: Web Worker + JS analytics (d3-array or Arquero) for group-bys, medians, and summaries. Optional DuckDB-WASM later for heavier workloads.
- Storage: IndexedDB (via Dexie) for local persistence; export/import bundles (JSON; optional Arrow/Parquet in Phase 2).
- PWA: Service Worker (Workbox via `vite-plugin-pwa`) for offline use and caching.
  - Note: PWA is enabled only in production builds to avoid dev SW issues.

---

## High-Level Architecture

- UI Layer (React + shadcn/ui): routing, uploads, dashboards, mapping wizard, filters.
- Compute Layer (Web Worker): JS-based analytics (d3-array/Arquero) for aggregations and stats; keeps the UI thread responsive. Optional DuckDB-WASM behind a feature flag.
- Data Access: Dexie-based repository for datasets, schema mappings, and saved views; JSON/typed arrays in-memory; optional Arrow/Parquet only for export/import in Phase 2.
- PWA Shell: service worker caches app shell and assets; offline-first with versioned cache; no network calls by default.
- Export Pipeline: `html-to-image` for PNG, `jsPDF` for PDFs capturing applied filters and timestamps.

Data Flow
1) User uploads file(s) → 2) Header promotion + column mapping → 3) Coercion and derived fields → 4) In-memory tables to Worker compute (d3-array/Arquero) → 5) Dashboards render charts/tables → 6) Save to IndexedDB and/or export bundle (JSON; optional Parquet + config).

Privacy & Offline
- 100% local by default: no telemetry, no external requests, no LinkedIn API.
- Optional consented features (future): model downloads for NLP classifiers — disabled by default.

Performance Targets
- 300–1,500 posts and 90–180 daily rows load and render in <3s on modern laptops.
- Memory safeguards with chunked parsing and typed arrays.

---

## Functionality Overview

Ingestion & Cleaning
- Accept XLSX/ODS/CSV (SheetJS `xlsx`).
- Auto-detect title/header rows; promote headers for inner-header sheets.
- Column mapping UI for common LinkedIn fields (Impressions, Likes, Comments, Reposts, Engagement rate, Post title, Post link, Post type, Created date).
- Robust parsing (numbers with commas/percent, dates, de-duplication).
- Derived fields: ER recalculation, external-link flag, hashtag/mention flags, text length bins, DOW/Week/Month with Europe/Berlin default.

Dashboards
- Overview: KPI tiles (totals, medians), time series (impressions, ER) with 7-day MA and optional anomaly flags.
- Timing: Day-of-week medians for impressions and ER; simple seasonality over weeks.
- Content: ER and impressions by Content Type; text length vs ER scatter/bins; link vs no-link comparison and estimated penalty.
- Experiments (Phase 2): hooks/emoji analysis; suggested experiments.
- Reports: PNG/PDF export; weekly digest as a local export.

Insight Cards (auto-generated, Phase 2)
- Examples: link penalty, format performance, day-of-week strengths with guardrails for small samples.

---

## Analytics Methods

- Medians and interquartile summaries for robust comparisons.
- Bin-wise estimates for text length; optional LOWESS trend.
- Group comparisons with sample-size badges and simple CIs.
- Optional anomaly detection (STL/ESD) on daily metrics.

Metrics Dictionary
- Impressions: total views.
- Engagement rate (ER): (Likes + Comments + Reposts [+ Clicks if present]) / Impressions.
- Link penalty: % delta for “has external link” vs baseline.
- Share amplification: additional impressions per repost (approximate).

---

## Project Plan

Sprint 1 — MVP (app shell + core dashboards)
- Scaffold Vite + React app; configure Tailwind and shadcn/ui.
- Enable PWA (vite-plugin-pwa) with offline app shell and assets.
- File upload and parsing (SheetJS); header promotion and column mapping UI.
- Data model with Dexie (datasets, mappings, derived fields, saved views skeleton).
- Worker compute using d3-array/Arquero for medians, group-bys, and comparisons.
- Dashboards: Overview, Timing, Content (medians, deltas, filters).
- PNG/PDF export with applied filters and timestamps.

Sprint 2 — Insights and depth
- Enhanced content analysis with link penalty and length-vs-ER analysis.
- Saved views (persisted filters/queries), shareable local bundle export/import.
- Insight cards generation with thresholds and de-duplication logic.
- Basic anomaly flags on daily series; data health panel (missing types, small-N).

Sprint 3 — Enrichment (optional)
- Hashtags table and topic hints; lightweight content-type auto-classifier for blanks.
- Seasonality heatmap; short-horizon forecast (optional).
- Polishing: accessibility pass, color contrast, keyboard navigation, i18n.

Acceptance Criteria (MVP)
- Upload XLSX/ODS/CSV → automatic header detection with manual override.
- Metrics parity: totals/medians within 1–2% of source exports.
- Dashboards render under 3s for target dataset sizes.
- Link/no-link and content-type comparisons show medians, counts, and low-sample badges.
- Exports mirror on-screen filters and include timestamps.
- Zero network calls; data persisted in IndexedDB; project bundle export/import works.

Risks & Mitigations
- Browser memory/CPU: use Web Worker + typed arrays and chunked parsing.
- Header edge cases (merged rows): manual override step in mapping wizard.
- Small-N statistics: show counts and CIs; gate insights with thresholds.
- Export fidelity: visual regression check for PNG/PDF on key dashboards.

Open Questions
- Max expected file size/count? Decide when to prompt “lite mode” vs full engine.
- Charting choice: ECharts vs Recharts tradeoffs (interactivity vs footprint).
- Classifier approach: regex rules vs tiny model; accuracy target and opt-in.

---

## Proposed Repo Structure

```
/src
  /app            # routes, layout, PWA shell
  /components     # shadcn/ui wrappers, charts, tables
  /features       # upload, mapping, dashboards, reports
  /data           # Dexie schema, repositories, adapters
  /workers        # compute worker, message contracts
  /lib            # utils: dates, stats, coercion, formatters
  /styles         # tailwind config and globals
```

---

## Getting Started (dev)

- Prereqs: Node 18+, pnpm or npm.
- Create app: `pnpm create vite` (React) → add Tailwind and shadcn/ui.
- Add PWA: `vite-plugin-pwa` with Workbox; configure cache and versioning.
- Add data libs: `xlsx`, `dexie`, `d3-array` (or `arquero`), `html-to-image`, `jspdf`.
- Optional (Phase 2): `duckdb-wasm`, `apache-arrow`, `parquet-wasm` for heavier datasets and Parquet bundles.
- Run: `pnpm dev` for local, `pnpm build && pnpm preview` for PWA check.
  - Tip: If you previously ran a PWA on `localhost:5173`, clear site data or unregister service workers in DevTools (Application → Service Workers) if the page appears stuck.

### Local Dev with devenv.sh

- Overview: This repo includes `devenv.nix` to provision a reproducible shell with Node.js 22, npm, pnpm, and dotenv support — fully local, no global Node required.
- Install Nix: follow the official Nix installer for your OS.
- Install devenv: `nix profile install github:cachix/devenv/latest` (or see devenv.sh docs).
- Enter shell: run `devenv shell` in the project root.
- What you get: Node 22 (`node -v`), npm, pnpm, `dotenv-cli`, and JavaScript language support.
- .env support: `.env` files are auto-loaded (via `dotenv.enable = true` in `devenv.nix`).
- Common commands inside the shell:
  - Install deps: `pnpm install` (or `npm ci`)
  - Start dev: `pnpm dev` (or `npm run dev`)
  - Build: `pnpm build` and preview: `pnpm preview`
- Tasks: list with `devenv tasks list`.
  - `devenv tasks run app:install`
  - `devenv tasks run app:dev`
  - `devenv tasks run app:build`
  - `devenv tasks run app:preview`
  - `devenv tasks run app:typecheck` / `app:lint` / `app:format`

No servers required. Everything runs locally in your browser.
