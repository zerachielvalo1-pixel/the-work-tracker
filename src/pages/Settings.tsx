import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useTasks } from '../lib/useTasks'
import { THEME_KEY, applyTheme } from '../lib/theme'
import type { Theme } from '../lib/theme'
import type { Session } from '../lib/types'

export default function Settings({ session }: { session: Session }) {
  const { tasks, loading, refresh } = useTasks()
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(THEME_KEY) as Theme | null) ?? 'system',
  )
  const [refreshing, setRefreshing] = useState(false)
  const [signOutBusy, setSignOutBusy] = useState(false)

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  async function handleRefresh() {
    setRefreshing(true)
    try {
      await refresh()
    } finally {
      setRefreshing(false)
    }
  }

  const open = tasks.filter((t) => t.status !== 'done' && t.status !== 'killed').length

  return (
    <div style={{ maxWidth: 680 }}>
      <div className="page__head">
        <h1 className="page__title">Settings</h1>
        <p className="page__sub">Your account and how the tracker behaves.</p>
      </div>

      <section className="card" style={{ marginBottom: 20 }}>
        <h2 className="card__title">Account</h2>
        <p className="card__sub">Signed in as</p>
        <p className="settings__value">{session?.user.email ?? 'unknown'}</p>

        <div className="btn-row" style={{ borderTop: 'none', paddingTop: 16 }}>
          <button
            type="button"
            className="btn btn--danger"
            disabled={signOutBusy}
            onClick={() => {
              setSignOutBusy(true)
              void supabase.auth.signOut()
            }}
          >
            {signOutBusy ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </section>

      <section className="card" style={{ marginBottom: 20 }}>
        <h2 className="card__title">Appearance</h2>
        <p className="card__sub">
          Follows your device by default. Dark mode is easier on the eyes at
          night and saves power on OLED screens.
        </p>
        <div className="chip-row" role="group" aria-label="Colour theme">
          {(['system', 'light', 'dark'] as Theme[]).map((t) => (
            <button
              key={t}
              type="button"
              className="chip"
              aria-pressed={theme === t}
              onClick={() => setTheme(t)}
            >
              {t === 'system' ? 'Match device' : t === 'light' ? 'Light' : 'Dark'}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="card__title">Data</h2>
        <p className="card__sub">
          {loading
            ? 'Loading…'
            : `${tasks.length} tasks loaded, ${open} still open.`}
        </p>
        <div className="btn-row" style={{ borderTop: 'none', paddingTop: 16 }}>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => void handleRefresh()}
            disabled={refreshing || loading}
          >
            {refreshing ? 'Refreshing…' : 'Refresh from server'}
          </button>
        </div>
        <p className="foot-note">
          Tasks load once and are shared between pages, so refreshing here
          updates every screen.
        </p>
      </section>
    </div>
  )
}
