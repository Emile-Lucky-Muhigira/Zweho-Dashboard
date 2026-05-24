import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, DEV_HINTS } from '../lib/auth'

export default function LoginView() {
  const navigate = useNavigate()
  const { loginStep1, verifyOtp, resendOtp, devLogin } = useAuth()

  const [step, setStep] = useState('credentials') // 'credentials' | 'otp'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showDev, setShowDev] = useState(false)

  // OTP state
  const [otpLength, setOtpLength] = useState(6)
  const [secondsLeft, setSecondsLeft] = useState(0)

  const handleCredentials = async (e) => {
    e?.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }
    setBusy(true)
    try {
      const res = await loginStep1({ email: email.trim(), password })
      setOtpLength(res.otpLength || 6)
      setSecondsLeft(res.expiresIn || 300)
      setStep('otp')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleVerify = async (code) => {
    setError('')
    setBusy(true)
    try {
      const result = await verifyOtp({ email: email.trim(), code })
      if (result.mustChangePassword) {
        // Freshly invited staff using their default password —
        // send them to create a new one before entering the app.
        navigate('/create-password')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleResend = async () => {
    setError('')
    try {
      await resendOtp({ email: email.trim() })
      setSecondsLeft(300)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDevLogin = (devEmail, devPassword) => {
    setError('')
    try {
      devLogin({ email: devEmail, password: devPassword })
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--zp-bg)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: 'var(--zp-primary)' }}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="5" height="5" fill="#F4F0E8" />
              <rect x="9" y="2" width="5" height="5" fill="#F4F0E8" />
              <rect x="2" y="9" width="5" height="5" fill="#F4F0E8" />
              <rect x="9" y="9" width="5" height="5" fill="#F4F0E8" />
            </svg>
          </div>
          <div className="font-display text-xl" style={{ color: 'var(--zp-ink)' }}>
            Zweho<span style={{ color: 'var(--zp-accent)' }}>.</span>Park
          </div>
        </div>

        {/* Card */}
        <div className="zp-card p-6">
          {step === 'credentials' && (
            <>
              <div className="zp-eyebrow">Dashboard access</div>
              <h1 className="font-display text-2xl mt-1" style={{ color: 'var(--zp-ink)' }}>Sign in</h1>
              <p className="text-[12px] mt-1.5" style={{ color: 'var(--zp-ink-2)' }}>
                Enter the credentials sent to your email. A verification code will be sent to your phone.
              </p>

              <form onSubmit={handleCredentials} className="mt-5 space-y-3">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: 'var(--zp-ink-3)' }}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full mt-1 px-3 py-2.5 text-[13px] rounded-md outline-none"
                    style={{ background: 'var(--zp-surface-2)', border: '1px solid var(--zp-line)', color: 'var(--zp-ink)' }}
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: 'var(--zp-ink-3)' }}>Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full mt-1 px-3 py-2.5 text-[13px] rounded-md outline-none"
                    style={{ background: 'var(--zp-surface-2)', border: '1px solid var(--zp-line)', color: 'var(--zp-ink)' }}
                  />
                </div>

                {error && <ErrorNote text={error} />}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-2.5 text-[12px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
                  style={{ background: 'var(--zp-primary)', color: '#fff', opacity: busy ? 0.6 : 1 }}
                >
                  {busy ? 'Checking…' : 'Continue'}
                </button>
              </form>
            </>
          )}

          {step === 'otp' && (
            <OtpStep
              email={email}
              length={otpLength}
              secondsLeft={secondsLeft}
              setSecondsLeft={setSecondsLeft}
              busy={busy}
              error={error}
              onVerify={handleVerify}
              onResend={handleResend}
              onBack={() => { setStep('credentials'); setError('') }}
            />
          )}
        </div>

        {/* Developer access — TEMPORARY, remove before launch */}
        <div className="mt-4">
          <button
            onClick={() => setShowDev(!showDev)}
            className="w-full text-center font-mono text-[10px] uppercase tracking-[0.16em] py-2"
            style={{ color: 'var(--zp-ink-3)' }}
          >
            {showDev ? '▴ Hide developer access' : '▾ Developer access'}
          </button>

          {showDev && (
            <div className="zp-card p-4 mt-1">
              <div className="zp-eyebrow">Developer access · temporary</div>
              <p className="text-[11px] mt-1.5 mb-3" style={{ color: 'var(--zp-ink-2)' }}>
                For team review before the authentication backend is live. Bypasses OTP. To be removed before launch.
              </p>
              <div className="space-y-1.5">
                {DEV_HINTS.map(h => (
                  <button
                    key={h.email}
                    onClick={() => handleDevLogin(h.email, h.password)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-md text-left transition-colors"
                    style={{ background: 'var(--zp-surface-2)', border: '1px solid var(--zp-line)' }}
                  >
                    <div>
                      <div className="text-[12px] font-semibold" style={{ color: 'var(--zp-ink)' }}>{h.name}</div>
                      <div className="font-mono text-[10px]" style={{ color: 'var(--zp-ink-3)' }}>{h.email}</div>
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{ background: 'var(--zp-primary-soft)', color: 'var(--zp-primary)' }}>
                      {h.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-center font-mono text-[10px] mt-5" style={{ color: 'var(--zp-ink-3)' }}>
          Zweho Park · SmartPark Amahoro · Kigali
        </p>
      </div>
    </div>
  )
}

/* ── OTP step ──────────────────────────────────────────────── */
function OtpStep({ email, length, secondsLeft, setSecondsLeft, busy, error, onVerify, onResend, onBack }) {
  const [digits, setDigits] = useState(Array(length).fill(''))
  const inputs = useRef([])

  // Countdown
  useEffect(() => {
    if (secondsLeft <= 0) return
    const id = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [secondsLeft, setSecondsLeft])

  useEffect(() => { inputs.current[0]?.focus() }, [])

  const setDigit = (i, val) => {
    const clean = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[i] = clean
    setDigits(next)
    if (clean && i < length - 1) inputs.current[i + 1]?.focus()
    // Auto-submit when all filled
    if (next.every(d => d !== '')) onVerify(next.join(''))
  }

  const onKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputs.current[i - 1]?.focus()
  }

  const onPaste = (e) => {
    const text = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, length)
    if (!text) return
    e.preventDefault()
    const next = Array(length).fill('')
    text.split('').forEach((d, i) => { next[i] = d })
    setDigits(next)
    if (next.every(d => d !== '')) onVerify(next.join(''))
  }

  const mins = Math.floor(secondsLeft / 60)
  const secs = String(secondsLeft % 60).padStart(2, '0')

  return (
    <>
      <div className="zp-eyebrow">Two-step verification</div>
      <h1 className="font-display text-2xl mt-1" style={{ color: 'var(--zp-ink)' }}>Enter the code</h1>
      <p className="text-[12px] mt-1.5" style={{ color: 'var(--zp-ink-2)' }}>
        We sent a {length}-digit code by SMS to the phone registered to <strong style={{ color: 'var(--zp-ink)' }}>{email}</strong>.
      </p>

      {/* OTP boxes */}
      <div className="flex gap-2 mt-5" onPaste={onPaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={el => (inputs.current[i] = el)}
            value={d}
            onChange={e => setDigit(i, e.target.value)}
            onKeyDown={e => onKeyDown(i, e)}
            inputMode="numeric"
            maxLength={1}
            className="flex-1 aspect-square text-center font-mono text-xl font-bold rounded-md outline-none"
            style={{ background: 'var(--zp-surface-2)', border: '1px solid var(--zp-line)', color: 'var(--zp-ink)' }}
          />
        ))}
      </div>

      {error && <div className="mt-3"><ErrorNote text={error} /></div>}

      {/* Expiry + resend */}
      <div className="flex items-center justify-between mt-4">
        <span className="font-mono text-[11px]" style={{ color: 'var(--zp-ink-3)' }}>
          {secondsLeft > 0 ? `Code expires in ${mins}:${secs}` : 'Code expired'}
        </span>
        <button
          onClick={onResend}
          className="font-mono text-[11px] uppercase tracking-[0.12em] font-semibold"
          style={{ color: 'var(--zp-primary)' }}
        >
          Resend code
        </button>
      </div>

      {busy && (
        <div className="mt-4 text-center font-mono text-[11px]" style={{ color: 'var(--zp-ink-3)' }}>
          Verifying…
        </div>
      )}

      <button
        onClick={onBack}
        className="w-full mt-4 py-2 text-[11px] font-mono uppercase tracking-[0.12em] rounded-md font-semibold"
        style={{ background: 'var(--zp-surface-2)', color: 'var(--zp-ink-2)', border: '1px solid var(--zp-line)' }}
      >
        ← Back
      </button>
    </>
  )
}

function ErrorNote({ text }) {
  return (
    <div
      className="px-3 py-2 rounded-md text-[12px]"
      style={{ background: 'var(--zp-full-soft)', color: 'var(--zp-full)' }}
    >
      {text}
    </div>
  )
}