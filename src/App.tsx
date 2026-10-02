import { useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase'
import { useHashRoute } from './lib/useHashRoute'
import type { PanelKey } from './lib/useHashRoute'
import type { Session } from './lib/types'
import SignIn from './pages/SignIn'
import AdminShell from './components/AdminShell'
import TaskProvider from './components/TaskProvider'
import ErrorBoundary from './components/ErrorBoundary'
import Overview from './pages/Overview'
import Board from './pages/Board'
import List from './pages/List'
import Calendar from './pages/Calendar'
import Pitches from './pages/Pitches'
import NewTask from './pages/NewTask'
import Settings from './pages/Settings'

/** Copy for panels that are navigable but deliberately not built yet. */
const PLANNED: Partial<Record<PanelKey, { title: string; blurb: string }>> = {
  issues: {
    title: 'Issues',
    blurb:
      'Tracking problems and blockers per issue number. The tasks table already has an issue_id column, so this is mostly a matter of creating the issue records and filtering by them.',
  },
  team: {
    title: 'Team',
    blurb:
      'Who is working on what. This needs an assignment column on tasks (for example assignee_id) and a role field on profiles — neither exists in the database yet, so there is nothing honest to show here until those are added.',
  },
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [fullName, setFullName] = useState('')
  const { panel, navigate } = useHashRoute()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return

    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) =>
        setFullName(data?.full_name || session.user.email || 'there'),
      )
  }, [session])

  const planned = useMemo(() => PLANNED[panel], [panel])

  if (loading) {
    return (
      <div className="boot" role="status" aria-live="polite">
        <span className="boot__spinner" aria-hidden="true" />
        <span>Loading…</span>
      </div>
    )
  }

  if (!session) return <SignIn />

  return (
    <ErrorBoundary>
      <TaskProvider>
        <AdminShell active={panel} onNavigate={navigate}>
          {panel === 'overview' && (
            <Overview
              userName={fullName}
              onNewTask={() => navigate('new-task')}
              onOpenBoard={() => navigate('board')}
            />
          )}

          {panel === 'board' && <Board />}
          {panel === 'list' && <List />}
          {panel === 'calendar' && <Calendar />}
          {panel === 'pitches' && <Pitches />}
          {panel === 'settings' && <Settings session={session} />}
          {panel === 'new-task' && <NewTask onSaved={() => navigate('list')} />}

          {planned && (
            <div style={{ maxWidth: 640 }}>
              <div className="page__head">
                <h1 className="page__title">{planned.title}</h1>
                <p className="page__sub">Not built yet.</p>
              </div>
              <div className="card">
                <p className="muted-note" style={{ fontSize: 14 }}>
                  {planned.blurb}
                </p>
                <div className="btn-row" style={{ borderTop: 'none', paddingTop: 16 }}>
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => navigate('board')}
                  >
                    Go to the board
                  </button>
                </div>
              </div>
            </div>
          )}
        </AdminShell>
      </TaskProvider>
    </ErrorBoundary>
  )
}
