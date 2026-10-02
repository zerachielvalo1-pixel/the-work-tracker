import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

/**
 * Catches render errors in the tree below it. Without this, one bad row of
 * data blanks the entire app with no way back; here the user gets a message
 * and a retry that simply re-renders.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error:', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="boot" role="alert">
        <div className="card" style={{ maxWidth: 460, textAlign: 'left' }}>
          <h1 className="card__title">Something went wrong</h1>
          <p className="card__sub">
            This screen failed to render. Your data is safe — it lives in the
            database, not in this page.
          </p>
          <pre className="error-detail">{error.message}</pre>
          <div className="btn-row" style={{ borderTop: 'none', paddingTop: 12 }}>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => this.setState({ error: null })}
            >
              Try again
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    )
  }
}
