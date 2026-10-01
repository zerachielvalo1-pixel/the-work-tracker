import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type PanelKey =
  | 'overview' | 'board' | 'list' | 'calendar'
  | 'issues' | 'pitches' | 'team' | 'settings' | 'new-task'

const NAV: { key: PanelKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'board',    label: 'Board' },
  { key: 'list',     label: 'List' },
  { key: 'new-task', label: 'New task' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'issues',   label: 'Issues' },
  { key: 'pitches',  label: 'Pitch box' },
  { key: 'team',     label: 'Team' },
  { key: 'settings', label: 'Settings' },
]

function MenuIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
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

  // Close the drawer on Escape so it behaves like a real dialog
  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  // Stop the page behind the drawer from scrolling (the body-scroll-lock
  // problem that makes off-canvas menus feel broken on iOS)
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
      {/* Mobile top bar — hidden from 900px up */}
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

      {/* Tap-outside target for the drawer */}
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

        <div className="shell__label" id="app-nav-label">
          Dashboard
        </div>

        <nav className="shell__nav" aria-labelledby="app-nav-label">
          {NAV.map((n) => (
            <button
              key={n.key}
              type="button"
              className={active === n.key ? 'is-active' : undefined}
              onClick={() => navigate(n.key)}
              aria-current={active === n.key ? 'page' : undefined}
            >
              {n.label}
            </button>
          ))}
        </nav>

        <div className="shell__sidebar-foot">
          <button
            type="button"
            className="shell__signout"
            onClick={() => supabase.auth.signOut()}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="shell__main">{children}</main>
    </div>
  )
}
