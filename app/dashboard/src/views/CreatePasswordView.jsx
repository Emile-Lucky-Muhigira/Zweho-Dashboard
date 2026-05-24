import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function CreatePasswordView() {
  const navigate = useNavigate()
  const { pendingPasswordChange, setNewPassword, confirmNewPassword } = useAuth()

  // If someone lands here without a pending change, send them to login.
  useEffect(() => {
    if (!pendingPasswordChange) navigate('/login')
  }, [pendingPasswordChange, navigate])

  const email = pendingPasswordChange?.email || ''

  const [step, setStep] = useState('password') // 'password' | 'otp'
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [otpLength, setOtpLength] = useState(6)
  const [secondsLeft, setSecondsLeft] = useState(0)

  // Password rules
  const rules = [
    { ok: pw.length >= 8,            label: 'At least 8 characters' },
    { ok: /[A-Z]/.test(pw),          label: 'One uppercase letter' },
    { ok: /[a-z]/.test(pw),          label: 'One lowercase letter' },
    { ok: /[0-9]/.test(pw),          label: 'One number' },
  ]
  const allRulesOk = rules.every(r => r.ok)
  const matches = pw.length > 0 && pw === pw2

  const handleSetPassword = async (e) => {
    e?.preventDefault()
    setError('')
    if (!allRulesOk) { setError('Password does not meet all requirements.'); return }
    if (!matches)   { setError('The two passwords do not match.'); return }
    setBusy(true)
    try {
      const res = await setNewPassword({ email, newPassword: pw })
      setOtpLength(res.otpLength || 6)
      setSecondsLeft(res.expiresIn || 300)
      setStep('otp')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleConfirm = async (code) => {
    setError('')
    setBusy(true)
    try {
      await confirmNewPassword({ email, code })
      navigate('/')   // login complete
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
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

        <div className="zp-card p-6">
          {step === 'password' && (
            <>
              <div className="zp-eyebrow">First sign-in · step 1 of 2</div>
              <h1 className="font-display text-2xl mt-1" style={{ color: 'var(--zp-ink)' }}>Create your password</h1>
              <p className="text-[12px] mt-1.5" style={{ color: 'var(--zp-ink-2)' }}>
                Welcome to Zweho Park. For security, you must replace the default password that was emailed to you.
              </p>

              <form onSubmit={handleSetPassword} className="mt-5 space-y-3">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: 'var(--zp-ink-3)' }}>New password</label>
                  <input
                    type="password"
                    value={pw}
                    onChange={e => setPw(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full mt-1 px-3 py-2.5 text-[13px] rounded-md outline-none"
                    style={{ background: 'var(--zp-surface-2)', border: '1px solid var(--zp-line)', color: 'var(--zp-ink)' }}
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: 'var(--zp-ink-3)' }}>Confirm password</label>
                  <input
                    type="password"
                    value={pw2}
                    onChange={e => setPw2(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full mt-1 px-3 py-2.5 text-[13px] rounded-md outline-none"
                    style={{
                      background: 'var(--zp-surface-2)',
                      border: '1px solid ' + (pw2.length > 0 && !matches ? 'var(--zp-full)' : 'var(--zp-line)'),
                      color: 'var(--zp-ink)',
                    }}
                  />
                </div>

                {/* Rules checklist */}
                <div className="rounded-md p-3 space-y-1.5" style={{ background: 'var(--zp-surface-2)' }}>
                  {rules.map(r => (
                    <div key={r.label} className="flex items-center gap-2 text-[11px]">
                      <span
                        className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold"
                        style={{
                          background: r.ok ? 'var(--zp-free)' : 'var(--zp-line)',
                          color: r.ok ? '#fff' : 'var(--zp-ink-3)',
                        }}
                      >
                        {r.ok ? '✓' : ''}
                      </span>
                      <span style={{ color: r.ok ? 'var(--zp-ink)' : 'var(--zp-ink-3)' }}>{r.label}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 text-[11px]">
                    <span
                      className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold"
                      style={{
                        background: matches ? 'var(--zp-free)' : 'var(--zp-line)',
                        color: matches ? '#fff' : 'var(--zp-ink-3)',
                      }}
                    >
                      {matches ? '✓' : ''}
                    </span>
                    <span style={{ color: matches ? 'var(--zp-ink)' : 'var(--zp-ink-3)' }}>Both passwords match</span>
                  </div>
                </div>

                {error && <ErrorNote text={error} />}

                <button
                  type="submit"
                  disabled={busy || !allRulesOk || !matches}
                  className="w-full py-2.5 text-[12px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
                  style={{
                    background: 'var(--zp-primary)', color: '#fff',
                    opacity: (busy || !allRulesOk || !matches) ? 0.5 : 1,
                  }}
                >
                  {busy ? 'Saving…' : 'Continue'}
                </button>
              </form>
            </>
          )}

          {step === 'otp' && (
            <OtpConfirm
              email={email}
              length={otpLength}
              secondsLeft={secondsLeft}
              setSecondsLeft={setSecondsLeft}
              busy={busy}
              error={error}
              onConfirm={handleConfirm}
            />
          )}
        </div>

        <p className="text-center font-mono text-[10px] mt-5" style={{ color: 'var(--zp-ink-3)' }}>
          Zweho Park · SmartPark Amahoro · Kigali
        </p>
      </div>
    </div>
  )
}

/* ── OTP confirmation ──────────────────────────────────────── */
function OtpConfirm({ email, length, secondsLeft, setSecondsLeft, busy, error, onConfirm }) {
  const [digits, setDigits] = useState(Array(length).fill(''))
  const inputs = useRef([])

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
    if (next.every(d => d !== '')) onConfirm(next.join(''))
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
    if (next.every(d => d !== '')) onConfirm(next.join(''))
  }

  const mins = Math.floor(secondsLeft / 60)
  const secs = String(secondsLeft % 60).padStart(2, '0')

  return (
    <>
      <div className="zp-eyebrow">First sign-in · step 2 of 2</div>
      <h1 className="font-display text-2xl mt-1" style={{ color: 'var(--zp-ink)' }}>Confirm it's you</h1>
      <p className="text-[12px] mt-1.5" style={{ color: 'var(--zp-ink-2)' }}>
        We sent a {length}-digit code by SMS to the phone registered to <strong style={{ color: 'var(--zp-ink)' }}>{email}</strong>. Enter it to finish setting your new password.
      </p>

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

      <div className="mt-4 font-mono text-[11px]" style={{ color: 'var(--zp-ink-3)' }}>
        {secondsLeft > 0 ? `Code expires in ${mins}:${secs}` : 'Code expired — go back and try again.'}
      </div>

      {busy && (
        <div className="mt-3 text-center font-mono text-[11px]" style={{ color: 'var(--zp-ink-3)' }}>
          Verifying…
        </div>
      )}
    </>
  )
}

function ErrorNote({ text }) {
  return (
    <div className="px-3 py-2 rounded-md text-[12px]" style={{ background: 'var(--zp-full-soft)', color: 'var(--zp-full)' }}>
      {text}
    </div>
  )
}