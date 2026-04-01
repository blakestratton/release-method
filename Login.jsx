import { useState } from 'react'
import { supabase } from '../lib/supabase'

const styles = `
  .login-wrap {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: #FAF9F7;
  }

  .login-card {
    width: 100%;
    max-width: 380px;
  }

  .login-mark {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 48px;
  }

  .login-eyebrow {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #A0785A;
    margin-bottom: 6px;
  }

  .login-wordmark {
    font-family: 'DM Serif Display', serif;
    font-size: 26px;
    font-weight: 400;
    color: #1A1A1A;
    letter-spacing: -0.3px;
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .field-wrap {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .field-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: #999;
  }

  .field-input {
    padding: 11px 14px;
    background: #FFFFFF;
    border: 1px solid #DEDAD4;
    border-radius: 3px;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    color: #1A1A1A;
    outline: none;
    transition: border-color 0.15s;
    -webkit-appearance: none;
  }

  .field-input:focus {
    border-color: #A0785A;
  }

  .field-input::placeholder {
    color: #CCC;
  }

  .login-btn {
    margin-top: 8px;
    padding: 13px;
    background: #1A1A1A;
    color: #FAF9F7;
    border: none;
    border-radius: 3px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;
    letter-spacing: 0.01em;
  }

  .login-btn:hover:not(:disabled) {
    background: #333;
  }

  .login-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .login-error {
    padding: 10px 14px;
    background: #FDF2F2;
    border: 1px solid #EAC8C8;
    border-radius: 3px;
    font-size: 13px;
    color: #C0392B;
    line-height: 1.5;
  }

  .login-footer {
    margin-top: 40px;
    font-size: 12px;
    color: #CCC;
    font-weight: 300;
    text-align: center;
  }
`

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
    // On success, App.jsx detects the new session and redirects
  }

  return (
    <>
      <style>{styles}</style>
      <div className="login-wrap">
        <div className="login-card">
          <div className="login-mark">
            <div className="login-eyebrow">Blake Stratton</div>
            <div className="login-wordmark">Release Method</div>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            {error && <div className="login-error">{error}</div>}

            <div className="field-wrap">
              <label className="field-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="field-input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="field-wrap">
              <label className="field-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="field-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="login-footer">
            Private client portal · Release Method
          </div>
        </div>
      </div>
    </>
  )
}
