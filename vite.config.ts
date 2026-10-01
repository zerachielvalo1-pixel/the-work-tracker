import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import type { Plugin } from 'vite'

/**
 * Opens the TLS + HTTP/2 connection to Supabase while the HTML is still being
 * parsed, so the first `supabase.auth.getSession()` does not have to pay for
 * DNS + handshake first. A cheap win on high-latency mobile networks.
 *
 * The origin is read from VITE_SUPABASE_URL at build time, so it stays correct
 * per environment without hard-coding a host anywhere.
 */
function supabasePreconnect(supabaseUrl: string): Plugin {
  let origin: string | null = null
  try {
    origin = new URL(supabaseUrl).origin
  } catch {
    origin = null
  }

  return {
    name: 'supabase-preconnect',
    transformIndexHtml() {
      if (!origin) return []
      return [
        {
          tag: 'link',
          attrs: { rel: 'preconnect', href: origin, crossorigin: '' },
          injectTo: 'head-prepend' as const,
        },
        {
          tag: 'link',
          attrs: { rel: 'dns-prefetch', href: origin },
          injectTo: 'head-prepend' as const,
        },
      ]
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    plugins: [react(), supabasePreconnect(env.VITE_SUPABASE_URL ?? '')],

    build: {
      // es2020 is the sweet spot: modern output (no legacy downlevelling),
      // still safe for Safari 14+ / Chrome 87+ / Firefox 78+.
      target: 'es2020',

      // Inline anything under 4 KB straight into the HTML/CSS rather than
      // spending a mobile round-trip on it.
      assetsInlineLimit: 4096,

      // Vite warns past 500 KB; the Supabase client is legitimately large,
      // so raise the bar instead of printing noise on every build.
      chunkSizeWarningLimit: 800,

      // Source maps only when a deploy actually asks for them.
      sourcemap: false,

      rollupOptions: {
        output: {
          // Split the two heavy, rarely-changing dependencies into their own
          // files. They then stay cached across app deploys instead of being
          // re-downloaded by every phone that already visited.
          //
          // Note: Vite 8 bundles with Rolldown, where the object form of
          // `manualChunks` no longer exists — `codeSplitting.groups` replaces
          // it. Path separators use [\\/] so this also matches on Windows.
          codeSplitting: {
            groups: [
              {
                name: 'react',
                test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              },
              {
                name: 'supabase',
                test: /node_modules[\\/]@supabase[\\/]/,
              },
            ],
          },
        },
      },
    },

    server: {
      // Exposes the dev server on the LAN so you can test on a real phone.
      host: true,
    },

    preview: {
      host: true,
    },
  }
})
