import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import SignIn from './pages/SignIn'
import AdminShell from './components/AdminShell'
import type { PanelKey } from './components/AdminShell'
import Overview from './pages/Overview'
import List from './pages/List'

export type Session = Awaited<
  ReturnType<typeof supabase.auth.getSession>
>['data']['session']

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [panel, setPanel] = useState<PanelKey>('overview')
  const [fullName, setFullName] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setSession(s),
    )
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    // No session means no profile to load. Clearing `fullName` here would be a
    // synchronous setState inside an effect (cascading render); it is not
    // needed either, because signing out unmounts the shell and this state
    // with it.
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
    <AdminShell active={panel} onNavigate={setPanel}>
      {panel === 'overview' && <Overview userName={fullName} />}

      {panel === 'list' && <List />}

      {panel !== 'overview' && panel !== 'list' && (
        <div className="page__head">
          <h1 className="page__title" style={{ textTransform: 'capitalize' }}>
            {panel}
          </h1>
          <p className="page__sub">This panel is coming in a future milestone.</p>
        </div>
      )}
    </AdminShell>
  )
}
