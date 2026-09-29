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
    if (!session) {
      setFullName('')
      return
    }
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
      <div style={{ padding: 40, fontFamily: 'system-ui', color: '#666' }}>
        Loading…
      </div>
    )
  }

  if (!session) return <SignIn />

  return (
    <AdminShell active={panel} onNavigate={setPanel}>
      {panel === 'overview' && <Overview userName={fullName} />}

      {panel === 'list' && <List />}

      {panel !== 'overview' && panel !== 'list' && (
        <div>
          <h1 style={{
            fontFamily: 'Georgia, serif',
            fontSize: 26,
            fontWeight: 900,
            textTransform: 'capitalize',
          }}>
            {panel}
          </h1>
          <p style={{ color: '#6B5B8E', fontSize: 14 }}>
            This panel is coming in a future milestone.
          </p>
        </div>
      )}
    </AdminShell>
  )
}