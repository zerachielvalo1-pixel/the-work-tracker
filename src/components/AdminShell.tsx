import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { PanelKey } from '../lib/useHashRoute'

export type { PanelKey }

type NavItem = { key: PanelKey; label: string }

/**
 * Navigation is grouped and explicitly honest about what exists: `planned`
 * items are rendered as disabled "soon" rows rather than dead links that open
 * a blank panel.
 */
const NAV_GROUPS: { label: string; items: NavItem[]; planned?: boolean }[] = [
  {
    label: 'Workspace',
    items: [
      { key: 'overview', label: 'Overview' },
      { key: 'board', label: 'Board' },
      { key: 'list', label: 'List' },
      { key: 'calendar', label: 'Calendar' },
    ],
  },
  {
    label: 'Editorial',
    items: [
      { key: 'pitches', label: 'Pitch box' },
      { key: 'new-task', label: 'New task' },
    ],
  },
  {
    label: 'Planned',
    planned: true,
    items: [
      { key: 'issues', label: 'Issues' },
      { key: 'team', label: 'Team' },
    ],
  },
]

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export default function AdminShell({
  active,
  onNavigate,
  children,
}: {
  active: PanelKey
  onNavigate: (k: PanelKey) => void
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  function navigate(key: PanelKey) {
    onNavigate(key)
    setOpen(false)
  }

  return (
    <div className="shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <header className="shell__bar">
        <button
          type="button"
          className="shell__menu"
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          aria-expanded={open}
          aria-controls="app-sidebar"
        >
          <MenuIcon />
        </button>
        <span className="brand shell__brand" aria-hidden="true">
          <span className="brand__the">the</span>
          <span className="brand__work">WORK</span>
        </span>
      </header>

      <div
        className={open ? 'shell__scrim is-open' : 'shell__scrim'}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <aside
        id="app-sidebar"
        className={open ? 'shell__sidebar is-open' : 'shell__sidebar'}
      >
        <div className="shell__sidebar-head">
          <span className="brand" style={{ fontSize: 20 }} aria-hidden="true">
            <span className="brand__the">the</span>
            <span className="brand__work">WORK</span>
          </span>
          <button
            type="button"
            className="shell__close"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <CloseIcon />
          </button>
        </div>

        <nav className="shell__nav" aria-label="Main">
          {NAV_GROUPS.map((group) => (
            <div className="shell__group" key={group.label}>
              <div className="shell__label" id={`nav-${group.label}`}>
                {group.label}
              </div>
              <div role="group" aria-labelledby={`nav-${group.label}`}>
                {group.items.map((n) =>
                  group.planned ? (
                    <button
                      key={n.key}
                      type="button"
                      className="is-planned"
                      onClick={() => navigate(n.key)}
                      title="Not built yet — shows a placeholder"
                      aria-current={active === n.key ? 'page' : undefined}
                    >
                      {n.label}
                      <span className="shell__soon">soon</span>
                    </button>
                  ) : (
                    <button
                      key={n.key}
                      type="button"
                      className={active === n.key ? 'is-active' : undefined}
                      onClick={() => navigate(n.key)}
                      aria-current={active === n.key ? 'page' : undefined}
                    >
                      {n.label}
                    </button>
                  ),
                )}
              </div>
            </div>
          ))}
        </nav>

        <div className="shell__sidebar-foot">
          <button
            type="button"
            className={active === 'settings' ? 'shell__signout is-active' : 'shell__signout'}
            onClick={() => navigate('settings')}
            aria-current={active === 'settings' ? 'page' : undefined}
          >
            Settings
          </button>
          <button
            type="button"
            className="shell__signout"
            onClick={() => void supabase.auth.signOut()}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="shell__main" id="main-content" tabIndex={-1}>
        {children}
      </main>
    </div>
  )
}
