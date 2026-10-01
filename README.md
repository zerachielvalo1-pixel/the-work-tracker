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
- **`prefers-reduced-motion`** disables the drawer transition and spinner.
- **`color-scheme: light`** is declared explicitly. The app paints a light UI,
  so without this an OS in dark mode draws native `<select>`, date and number
  controls dark-on-white and they become unreadable.

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

`verify/` holds throwaway tooling used to check the responsive work in a real
browser (Chrome DevTools Protocol with exact viewport emulation). It is not part
of the app and is safe to delete.

```bash
node verify/serve.mjs          # serves the project + dist assets on :4319
node verify/capture.mjs 9222   # screenshots + overflow / touch-target metrics
node verify/measure.mjs 9222   # confirm all content shares one column edge
node verify/drawer.mjs 9222    # drawer open-state assertions
```

The `9222` scripts expect a headless Chrome started with
`--remote-debugging-port=9222`.
