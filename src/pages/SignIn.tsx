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
      setError(error.message)
    }
    // on success, App.tsx picks up the session change automatically
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#FAF8FF',
        fontFamily: 'system-ui',
        padding: 20,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: 380,
          background: '#fff',
          border: '1px solid #E5DDF5',
          borderRadius: 12,
          padding: 28,
          boxShadow: '0 4px 14px rgba(26,14,46,.08)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.04em' }}>
            <span style={{ fontWeight: 400 }}>the</span>
            <span
              style={{
                background: 'linear-gradient(135deg,#7C3AED,#A855F7,#D946EF)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              WORK
            </span>
          </div>
          <h2 style={{ margin: '12px 0 4px', fontSize: 20 }}>Editor Sign In</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#6B5B8E' }}>
            Sign in to manage The Work.
          </p>
        </div>

        {error && (
          <div
            style={{
              background: '#FDECEA',
              border: '1px solid #F4B8B0',
              color: '#8F1D17',
              padding: '10px 13px',
              borderRadius: 6,
              fontSize: 13,
              marginBottom: 14,
            }}
          >
            {error}
          </div>
        )}

        <label style={{ display: 'block', marginBottom: 14 }}>
          <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#3D2E5C', marginBottom: 6 }}>
            Email
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            style={{
              width: '100%', padding: '11px 13px', fontSize: 14,
              border: '1.5px solid #E5DDF5', borderRadius: 6,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </label>

        <label style={{ display: 'block', marginBottom: 20 }}>
          <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#3D2E5C', marginBottom: 6 }}>
            Password
          </span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            style={{
              width: '100%', padding: '11px 13px', fontSize: 14,
              border: '1.5px solid #E5DDF5', borderRadius: 6,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </label>

        <button
          type="submit"
          disabled={busy}
          style={{
            width: '100%', padding: '12px', fontSize: 14, fontWeight: 600,
            color: '#fff',
            background: 'linear-gradient(135deg,#7C3AED,#A855F7,#D946EF)',
            border: 'none', borderRadius: 6, cursor: busy ? 'not-allowed' : 'pointer',
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}