import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // In production: send to Sentry / your error tracker
    console.error('[ErrorBoundary]', error, info)
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-lg text-center">
            <div className="font-display text-7xl text-[var(--accent)] mb-4">✕</div>
            <h2 className="font-display text-2xl text-zinc-100 mb-3">Something went wrong</h2>
            <p className="text-[14px] text-[var(--text-secondary)] mb-4">
              The dashboard hit an unexpected error. The team has been notified automatically.
            </p>

            {this.state.error && (
              <div className="bg-[var(--bg-panel)] border border-[var(--border)] rounded-sm p-3 mb-6 text-left">
                <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--text-muted)] mb-1">Error</div>
                <div className="text-[12px] font-mono text-red-400 break-all">
                  {this.state.error.toString()}
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={this.reset}
                className="px-4 py-2 text-[12px] font-mono uppercase tracking-[0.15em] bg-[var(--bg-elevated)] hover:bg-zinc-700 border border-[var(--border)] rounded-sm"
              >Try again</button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 text-[12px] font-mono uppercase tracking-[0.15em] bg-[var(--accent)] text-zinc-900 rounded-sm font-semibold"
              >Go to dashboard</button>
            </div>

            <div className="mt-6 text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--text-muted)]">
              If this keeps happening, contact <span className="text-zinc-300">Emile Muhigira</span>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}