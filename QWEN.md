# Project Context for Qwen Code

This document provides an overview of the `linkedin-analytics` project for use by Qwen Code during future interactions.

## Project Overview

This is a **React-based Progressive Web App (PWA)** designed for **private-first analytics of LinkedIn export data**. The core principle is complete client-side processing with no server or external API calls. Users upload their LinkedIn data files (XLSX/ODS/CSV), map the columns, and explore dashboards for insights.

### Key Technologies

*   **Framework:** React with Vite for fast development and building.
*   **UI:** Tailwind CSS for styling and shadcn/ui for accessible components.
*   **Charts:** ECharts (via `echarts-for-react`).
*   **Data Processing:** SheetJS (`xlsx`) for file parsing, `d3-array` for analytics calculations, and a Web Worker for heavy computations to keep the UI responsive.
*   **Storage:** Dexie.js (a wrapper for IndexedDB) for local data persistence.
*   **PWA:** `vite-plugin-pwa` and Workbox for offline capabilities.
*   **Build Tool:** Vite.
*   **Package Manager:** pnpm (configurable via `devenv.nix`).
*   **Dev Environment:** Nix-based `devenv` for reproducible local development setup.

## Repository Structure

The project follows a feature-oriented structure within the `src` directory:

```
/src
  /app            # Main application shell and routing (App.jsx)
  /components     # Reusable UI components (shadcn/ui wrappers, charts, tables)
  /features       # Feature-specific logic and pages (upload, dashboards, reports)
  /data           # Data access layer (Dexie schema, repositories)
  /workers        # Web Workers for client-side computation
  /lib            # Utility functions (dates, stats, coercion, formatters)
  /styles         # Tailwind CSS configuration and global styles
  main.jsx        # Application entry point
```

## Building and Running

This is a client-side application. All commands are run locally.

### Prerequisites

*   Nix (for devenv) OR Node.js 18+, pnpm/npm installed globally.

### Using devenv (Recommended)

1.  Enter the reproducible development shell: `devenv shell`
2.  Install dependencies: `pnpm install` (or `devenv tasks run app:install`)
3.  Start the development server: `pnpm dev` (or `devenv tasks run app:dev`)
4.  Build for production: `pnpm build` (or `devenv tasks run app:build`)
5.  Preview the production build locally: `pnpm preview` (or `devenv tasks run app:preview`)

### Standard Node.js Workflow

1.  Install dependencies: `pnpm install` (or `npm install`)
2.  Start the development server: `pnpm dev` (or `npm run dev`)
3.  Build for production: `pnpm build` (or `npm run build`)
4.  Preview the production build locally: `pnpm preview` (or `npm run preview`)

**Note on PWA:** The PWA functionality (service worker) is only active in production builds (`pnpm build` followed by `pnpm preview` or deployment). This avoids service worker interference during development.

## Development Practices

*   **Local First:** All processing and storage happen in the browser. No data leaves the user's device.
*   **Client-Side Computation:** Heavy analytics are offloaded to a Web Worker using `d3-array` or potentially `arquero`.
*   **State Management:** Likely uses React's built-in state/hooks and Dexie for persistent state.
*   **Styling:** Tailwind CSS is used extensively for styling components.
*   **UI Components:** shadcn/ui components are used for building the interface.
*   **Testing:** No specific testing setup is mentioned in the core files.
*   **Type Checking/Linting:** Not currently configured (`typecheck`, `lint`, `format` scripts are placeholders in `package.json`).

## Key Features (Planned/MVP)

1.  **File Upload & Parsing:** Handle XLSX/ODS/CSV uploads using SheetJS.
2.  **Column Mapping:** UI to map file columns to standard LinkedIn metrics.
3.  **Data Processing:** Derive fields (like Engagement Rate) and clean data.
4.  **Analytics Dashboards:**
    *   Overview (KPIs, time series)
    *   Timing (Day-of-week analysis)
    *   Content (Performance by type, link impact)
    *   Leaderboards (Top posts)
5.  **Local Persistence:** Store datasets and settings using IndexedDB/Dexie.
6.  **Export:** Export dashboards as PNG/PDF.
7.  **PWA:** Work offline after the initial load.
