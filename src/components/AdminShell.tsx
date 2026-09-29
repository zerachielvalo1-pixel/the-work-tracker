import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'

export type PanelKey =
  | 'overview' | 'board' | 'list' | 'calendar'
  | 'issues' | 'pitches' | 'team' | 'settings'

const NAV: { key: PanelKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'board',    label: 'Board' },
  { key: 'list',     label: 'List' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'issues',   label: 'Issues' },
  { key: 'pitches',  label: 'Pitch box' },
  { key: 'team',     label: 'Team' },
  { key: 'settings', label: 'Settings' },
]

export default function AdminShell({
  active,
  onNavigate,
  children,
}: {
  active: PanelKey
  onNavigate: (k: PanelKey) => void
  children: ReactNode
}) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '230px 1fr',
      minHeight: '100vh',
      background: '#FAF8FF',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <aside style={{
        background: '#fff',
        borderRight: '1px solid #E5DDF5',
        padding: '24px 14px',
      }}>
        <div style={{
          fontFamily: 'Georgia, serif',
          fontSize: 20,
          fontWeight: 900,
          letterSpacing: '-0.04em',
          marginBottom: 24,
          paddingLeft: 10,
        }}>
          <span style={{ fontWeight: 400, color: '#1A0E2E' }}>the</span>
          <span style={{
            background: 'linear-gradient(135deg,#7C3AED,#A855F7,#D946EF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>WORK</span>
        </div>

        <div style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.13em',
          textTransform: 'uppercase',
          color: '#9A8EB8',
          padding: '0 10px',
          marginBottom: 12,
        }}>
          Dashboard
        </div>

        <nav style={{ display: 'grid', gap: 2 }}>
          {NAV.map((n) => {
            const on = active === n.key
            return (
              <button
                key={n.key}
                onClick={() => onNavigate(n.key)}
                style={{
                  padding: '10px 12px',
                  textAlign: 'left',
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  background: on
                    ? 'linear-gradient(135deg,#7C3AED,#A855F7,#D946EF)'
                    : 'transparent',
                  color: on ? '#fff' : '#3D2E5C',
                }}
              >
                {n.label}
              </button>
            )
          })}
        </nav>

        <div style={{ height: 1, background: '#E5DDF5', margin: '16px 0' }} />

        <button
          onClick={() => supabase.auth.signOut()}
          style={{
            width: '100%',
            padding: '10px 12px',
            textAlign: 'left',
            fontSize: 13,
            fontWeight: 600,
            borderRadius: 6,
            border: 'none',
            background: 'transparent',
            color: '#8F1D17',
            cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      </aside>

      <main style={{ padding: 32, maxWidth: 1120 }}>{children}</main>
    </div>
  )
}