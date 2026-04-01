import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const styles = `
  .sessions-wrap {
    min-height: 100vh;
    background: #FAF9F7;
    display: flex;
    flex-direction: column;
  }

  .sessions-nav {
    background: #FFFFFF;
    border-bottom: 1px solid #ECEAE6;
    padding: 18px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  @media (min-width: 600px) {
    .sessions-nav { padding: 18px 48px; }
  }

  .nav-brand-eyebrow {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #AAA;
    margin-bottom: 2px;
  }

  .nav-brand-name {
    font-family: 'DM Serif Display', serif;
    font-size: 18px;
    font-weight: 400;
    color: #1A1A1A;
  }

  .nav-signout {
    background: none;
    border: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    color: #BBB;
    cursor: pointer;
    padding: 4px 0;
    transition: color 0.15s;
  }

  .nav-signout:hover { color: #666; }

  .sessions-body {
    flex: 1;
    width: 100%;
    max-width: 680px;
    margin: 0 auto;
    padding: 40px 24px 60px;
  }

  .sessions-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 28px;
  }

  .sessions-title {
    font-family: 'DM Serif Display', serif;
    font-size: 22px;
    font-weight: 400;
    color: #1A1A1A;
  }

  .new-session-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 10px 18px;
    background: #1A1A1A;
    color: #FAF9F7;
    border: none;
    border-radius: 3px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    letter-spacing: 0.01em;
    transition: background 0.15s;
    white-space: nowrap;
  }

  .new-session-btn:hover:not(:disabled) { background: #333; }
  .new-session-btn:disabled { opacity: 0.5; cursor: default; }

  .sessions-list {
    border-top: 2px solid #1A1A1A;
  }

  .session-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 0;
    border-bottom: 1px solid #F2EFEB;
    cursor: pointer;
    transition: padding 0.1s;
    border-radius: 2px;
    gap: 16px;
  }

  .session-item:hover {
    padding-left: 8px;
    padding-right: 8px;
    margin: 0 -8px;
    background: #F9F7F5;
  }

  .session-title {
    font-size: 14px;
    font-weight: 400;
    color: #1A1A1A;
    line-height: 1.4;
    flex: 1;
  }

  .session-date {
    font-size: 12px;
    color: #BBB;
    font-weight: 300;
    margin-top: 3px;
  }

  .session-arrow {
    color: #DEDAD4;
    font-size: 16px;
    flex-shrink: 0;
  }

  .sessions-empty {
    padding: 48px 0 32px;
    text-align: center;
  }

  .empty-headline {
    font-family: 'DM Serif Display', serif;
    font-size: 20px;
    color: #1A1A1A;
    margin-bottom: 10px;
  }

  .empty-sub {
    font-size: 14px;
    color: #AAA;
    font-weight: 300;
    line-height: 1.6;
    max-width: 280px;
    margin: 0 auto 28px;
  }

  .sessions-loading {
    padding: 48px 0;
    text-align: center;
    font-size: 14px;
    color: #CCC;
    font-weight: 300;
  }
`

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Sessions({ session }) {
  const [conversations, setConversations] = useState(null)
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select('id, title, created_at, updated_at')
      .order('updated_at', { ascending: false })

    if (!error) setConversations(data)
  }

  const startNewSession = async () => {
    setCreating(true)
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: session.user.id,
        title: null,
      })
      .select()
      .single()

    if (!error && data) {
      navigate(`/chat/${data.id}`)
    } else {
      console.error(error)
      setCreating(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <>
      <style>{styles}</style>
      <div className="sessions-wrap">
        <nav className="sessions-nav">
          <div>
            <div className="nav-brand-eyebrow">Release Method</div>
            <div className="nav-brand-name">
              {session.user.user_metadata?.full_name || session.user.email}
            </div>
          </div>
          <button className="nav-signout" onClick={handleSignOut}>Sign out</button>
        </nav>

        <div className="sessions-body">
          <div className="sessions-header">
            <div className="sessions-title">Sessions</div>
            <button className="new-session-btn" onClick={startNewSession} disabled={creating}>
              {creating ? 'Starting…' : '+ New session'}
            </button>
          </div>

          {conversations === null ? (
            <div className="sessions-loading">Loading…</div>
          ) : conversations.length === 0 ? (
            <div className="sessions-empty">
              <div className="empty-headline">Ready when you are.</div>
              <div className="empty-sub">
                Start a session whenever something is weighing on you. Each session builds on the last.
              </div>
              <button className="new-session-btn" onClick={startNewSession} disabled={creating}>
                {creating ? 'Starting…' : 'Start your first session'}
              </button>
            </div>
          ) : (
            <div className="sessions-list">
              {conversations.map(c => (
                <div
                  key={c.id}
                  className="session-item"
                  onClick={() => navigate(`/chat/${c.id}`)}
                >
                  <div>
                    <div className="session-title">
                      {c.title || <span style={{ color: '#CCC', fontWeight: 300 }}>Untitled session</span>}
                    </div>
                    <div className="session-date">{formatDate(c.updated_at)}</div>
                  </div>
                  <div className="session-arrow">›</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
