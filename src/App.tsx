import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

export default function App() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) =>
      setEmail(data.session?.user.email ?? null),
    )
  }, [])

  return (
    <div style={{ padding: 40, fontFamily: 'system-ui' }}>
      {email ? <p>Signed in as {email}</p> : <p>Not signed in ✅ (this is correct)</p>}
    </div>
  )
}