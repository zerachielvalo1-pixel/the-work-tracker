import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setBusy(false)

    if (error) {
      // Supabase returns the same message for a wrong password and a missing
      // account, so give the user something they can act on.
      setError(
        error.message === 'Invalid login credentials'
          ? 'That email and password combination did not work. Check for typos, or ask an editor to send you an invite.'
          : error.message,
      )
    }
    // On success App.tsx picks up the session change; the hash route is
    // preserved, so you land back on the panel you originally asked for.
  }

  return (
    <div className="signin">
      <form className="signin__card" onSubmit={handleSubmit}>
        <div className="signin__head">
          <div className="brand signin__brand" aria-hidden="true">
            <span className="brand__the">the</span>
            <span className="brand__work">WORK</span>
          </div>
          <h1 className="signin__title">Editor Sign In</h1>
          <p className="signin__sub">Sign in to manage The Work.</p>
        </div>

        {error && (
          <div className="alert" role="alert">
            {error}
          </div>
        )}

        <div className="form-field">
          <label className="form-label" htmlFor="signin-email">
            Email
          </label>
          <input
            id="signin-email"
            className="input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            inputMode="email"
            enterKeyHint="next"
          />
        </div>

        <div className="form-field" style={{ marginBottom: 20 }}>
          <label className="form-label" htmlFor="signin-password">
            Password
          </label>
          <input
            id="signin-password"
            className="input"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            enterKeyHint="go"
          />
        </div>

        <button
          type="submit"
          className="btn btn--primary"
          style={{ width: '100%' }}
          disabled={busy}
        >
          {busy ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}
