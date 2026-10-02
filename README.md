# the-work-tracker

Editorial task tracker for The Work — pitches, stories, photos and layouts in
one place. React 19 + TypeScript + Vite (Rolldown) + Supabase.

## Getting started

```bash
npm install
npm run dev      # dev server, exposed on the LAN so you can test on a phone
npm run build    # typecheck (tsc -b) + production build into dist/
npm run preview  # serve the production build locally
npm run lint
```

Create a `.env` file (never committed) with:

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

## Responsive design

The layout is **mobile-first**. One stylesheet, `src/index.css`, holds all
layout and component styles; components use class names rather than inline
`style={{…}}` objects, because CSS media queries cannot be expressed inline.

Three breakpoints, chosen for real device classes:

| Width | Target | Behaviour |
| --- | --- | --- |
| base (≥320px) | phones | Off-canvas nav drawer + sticky top bar; 2-up stat cards; each task is a labelled card |
| `560px` | large phones / small tablets | Two-column form fields; row layouts put the date on the right |
| `900px` | tablet / desktop | Permanent 230px sidebar; 4-up stat cards; the task list becomes a real `<table>` |

### Mobile specifics that were deliberate

- **Task table → cards.** Below 900px each `<tr>` becomes a card and each cell
  gets its label from a `data-label` attribute, so there is no sideways
  scrolling and no cut-off columns.
- **`font-size: 16px` on every input.** iOS Safari zooms the whole page when a
  focused input is smaller than 16px. This is the single most common cause of
  "the site feels broken on iPhone".
- **44px minimum touch targets** on nav items and buttons.
- **`100svh` instead of `100vh`** for full-height surfaces, so the mobile URL
  bar appearing/disappearing doesn't jump the layout.
- **`viewport-fit=cover` + `env(safe-area-inset-*)`** so content clears the
  notch, the home indicator and rounded corners.
- **Off-canvas drawer** locks body scroll while open, closes on `Escape`, on
  scrim tap and on navigation, and uses `visibility: hidden` when closed so it
  stays out of the tab order and the accessibility tree.
- **`prefers-reduced-motion`** disables the drawer transition, the sheet
  animation and the loading shimmer.
- **Native controls are themed explicitly.** Rather than relying on the OS, the
  stylesheet sets `color-scheme` per theme, so `<select>`, date and number
  inputs are never drawn dark-on-white.

## Screens

| Panel | State | Notes |
| --- | --- | --- |
| Overview | shipped | Stat cards, overdue callout, next six deadlines |
| Board | shipped | Kanban by workflow status with a one-tap "Next" advance |
| List | shipped | Table on desktop, labelled cards on phones, search + status filter + sort |
| Calendar | shipped | Month grid from 720px, chronological agenda on phones |
| Pitch box | shipped | Everything still at `pitched`, with descriptions |
| New task | shipped | The full pitch form |
| Settings | shipped | Account, theme, manual refresh |
| Issues | planned | Needs issue records; `tasks.issue_id` already exists |
| Team | planned | Needs `assignee_id` on tasks and a role on profiles — neither column exists |

Planned panels are labelled "soon" in the sidebar and explain what they are
missing rather than showing a blank screen.

## Architecture

- **`src/lib/types.ts`** — domain model. The column lists are *verified against
  the live database*, not assumed. `assignee_id`, `tags` and `notes` look
  plausible but do not exist, so they are deliberately absent. If you add a
  column, update `TASK_COLUMNS` and the `Task` type together.
- **`src/lib/useTasks.ts` + `src/components/TaskProvider.tsx`** — one shared
  task store. The app loads tasks and sections once; every panel reads from it,
  so a change on the board is instantly visible in the list and counts.
  Mutations are optimistic and roll back on failure, so the UI never shows
  unsaved state as saved.
- **`src/lib/useHashRoute.ts`** — panel selection lives in the URL hash.
  Refreshing keeps your place, the back button works, and `#/board` is a
  shareable link.
- **`src/components/ErrorBoundary.tsx`** — a render error shows a message and a
  retry instead of a blank page.
- **`src/components/TaskDrawer.tsx`** — the detail sheet. It surfaces fields the
  app stores but previously never displayed (description, word count, external
  links, completion date).

## Theming

Three options in Settings: **Match device**, **Light**, **Dark**. The choice is
stored in `localStorage` under `tw-tracker-theme` and applied by `initTheme()`
in `main.tsx` before React renders, so there is no flash of the wrong theme.
`data-theme` on `<html>` drives the CSS variables; with "Match device" the
variables follow `prefers-color-scheme`.

## Performance

- Vendor splitting puts React and Supabase in their own long-lived chunks, so
  phones that already visited don't re-download them on an app deploy.
  Configured via `build.rollupOptions.output.codeSplitting.groups` — note that
  Vite 8 bundles with **Rolldown**, where the object form of `manualChunks` no
  longer exists.
- Supabase's origin is injected as `<link rel="preconnect">` /
  `dns-prefetch` at build time from `VITE_SUPABASE_URL`, so the first auth call
  doesn't pay for DNS + TLS first.
- `theme-color` and an inline background colour in `index.html` prevent a white
  flash before the stylesheet loads on a slow connection.
- Current production output:

  | Asset | Raw | Gzip |
  | --- | --- | --- |
  | `index.js` (app) | ~12.8 kB | ~4.0 kB |
  | `index.css` | ~12.5 kB | ~3.4 kB |
  | `react.js` | ~219 kB | ~68 kB |
  | `supabase.js` | ~214 kB | ~55 kB |

  The two vendor chunks dominate. If initial load ever needs to be smaller,
  lazy-loading `@supabase/supabase-js` behind the sign-in screen is the next
  step worth taking.

## Deployment

Config is committed for all three hosts; they are independent, so delete the
ones you don't use.

- **Netlify** — `netlify.toml`: SPA fallback plus immutable caching on
  `/assets/*` and `must-revalidate` on `index.html`.
- **Vercel** — `vercel.json`: same caching policy, SPA rewrites.
- **Cloudflare Pages** — `wrangler.toml`. Pages already serves SPAs when no
  `404.html` exists, so no catch-all rewrite is declared (it would shadow real
  files).

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the host's environment
variables for the build step.

## Local responsive verification

`verify/` holds throwaway tooling that checks the layout in a real browser via
the Chrome DevTools Protocol with exact viewport emulation. It is not part of
the app and is safe to delete. Screenshots it produces are gitignored because
they are regenerated on every run.

```bash
npm run build                  # the previews load the built stylesheet

# one-off: start the preview server and a headless Chrome
node verify/serve.mjs                                                    # :4319
chrome --headless=new --remote-debugging-port=9222 --user-data-dir=verify/chrome-profile about:blank

# then, whenever layout changes:
node verify/check-all.mjs 9222 light   # 16 page/viewport combos, both themes
node verify/check-all.mjs 9222 dark
node verify/probe.mjs                  # grid geometry: is anything clipped?
powershell -File verify/fix-previews.ps1   # re-point previews at the new CSS hash
```

`check-all.mjs` fails loudly on horizontal overflow, undersized touch targets,
and any element whose computed overdue colour does not match `--danger`.

The preview pages (`verify/*-preview.html`) are static markup rendered against
the real compiled stylesheet. They deliberately do **not** exercise Supabase, so
they verify layout, theming and responsive behaviour — not data flow. Anything
involving real records has to be checked in the running app.

Note: `verify/fix-previews.ps1` is pure ASCII on purpose. Windows PowerShell
reads `.ps1` files as ANSI unless they carry a UTF-8 BOM, so non-ASCII
characters in a script get mangled before it runs; Unicode is emitted with
`[char]0x....` instead.

