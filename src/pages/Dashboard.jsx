import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const KEY_LEVELS = [
  { name: 'Bronze', sessions: 10 },
  { name: 'Silver', sessions: 25 },
  { name: 'Gold', sessions: 50 },
  { name: 'Platinum', sessions: 100 },
  { name: 'Diamond', sessions: 200 },
]

function getProgressToNextTier(completedCount) {
  for (let i = 0; i < KEY_LEVELS.length; i++) {
    if (completedCount < KEY_LEVELS[i].sessions) {
      const prevSessions = i === 0 ? 0 : KEY_LEVELS[i - 1].sessions
      const range = KEY_LEVELS[i].sessions - prevSessions
      const progress = completedCount - prevSessions
      return {
        tierName: KEY_LEVELS[i].name,
        prevName: i === 0 ? 'Start' : KEY_LEVELS[i - 1].name,
        pct: Math.min((progress / range) * 100, 100),
        current: completedCount,
        target: KEY_LEVELS[i].sessions,
      }
    }
  }
  return { tierName: 'Diamond', prevName: 'Platinum', pct: 100, current: completedCount, target: 200 }
}

function getWeeklyStatus(conversations) {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const count = conversations.filter(c => new Date(c.created_at) > weekAgo).length
  if (count === 0) return { label: 'No sessions this week', color: '#C0392B', bg: '#FDF2F2', dot: '#E05454' }
  if (count === 1) return { label: '1 session this week', color: '#9A6F1A', bg: '#FDFAF2', dot: '#D4A843' }
  return { label: `${count} sessions this week`, color: '#1E7A52', bg: '#F2FDF8', dot: '#3BAF7A' }
}

function formatDate(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatNextCall(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function RatingBar({ value, color }) {
  return (
    <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} style={{ width: 4, height: 10, borderRadius: 1, background: i < value ? color : '#F0EDE9' }} />
      ))}
    </div>
  )
}

const S = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Serif+Display:ital@0;1&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .db-wrap { background: #FAF9F7; min-height: 100vh; }

  .db-nav {
    background: #fff; border-bottom: 1px solid #ECEAE6;
    padding: 18px 24px; display: flex; align-items: center;
    justify-content: space-between; position: sticky; top: 0; z-index: 20;
  }
  @media(min-width:640px){ .db-nav { padding: 18px 48px; } }

  .db-nav-left .eyebrow { font-size: 10px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: #AAA; margin-bottom: 2px; }
  .db-nav-left .client-name { font-size: 17px; font-weight: 500; color: #1A1A1A; }

  .db-nav-right { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; justify-content: flex-end; }

  .week-badge { display: inline-flex; align-items: center; gap: 7px; padding: 5px 11px; border-radius: 100px; font-size: 12px; font-weight: 500; }
  .next-call { font-size: 13px; color: #BBB; font-weight: 300; }
  .signout-btn { background: none; border: none; font-family: 'DM Sans',sans-serif; font-size: 13px; color: #CCC; cursor: pointer; transition: color .15s; }
  .signout-btn:hover { color: #888; }

  .db-body { max-width: 900px; margin: 0 auto; padding: 40px 24px 80px; }
  @media(min-width:640px){ .db-body { padding: 40px 48px 80px; } }

  /* Start session CTA */
  .start-cta {
    background: #1A1A1A; border-radius: 4px;
    padding: 28px 32px; margin-bottom: 40px;
    display: flex; align-items: center; justify-content: space-between; gap: 20px;
  }
  .start-cta-text .headline { font-family: 'DM Serif Display',serif; font-size: 22px; color: #FAF9F7; font-weight: 400; margin-bottom: 5px; }
  .start-cta-text .sub { font-size: 13px; color: #888; font-weight: 300; line-height: 1.5; }
  .start-cta-text .sub a { color: #A0785A; text-decoration: none; }
  .start-cta-text .sub a:hover { text-decoration: underline; }
  .start-btn {
    padding: 12px 24px; background: #FAF9F7; color: #1A1A1A;
    border: none; border-radius: 3px; font-family: 'DM Sans',sans-serif;
    font-size: 14px; font-weight: 500; cursor: pointer; white-space: nowrap;
    transition: background .15s; flex-shrink: 0;
  }
  .start-btn:hover:not(:disabled) { background: #F0EDE9; }
  .start-btn:disabled { opacity: .5; cursor: default; }

  /* Metrics */
  .metrics-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
  .metric-card { background: #fff; border: 1px solid #ECEAE6; border-radius: 3px; padding: 22px 24px 18px; }
  .metric-label { font-size: 10px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: #AAA; margin-bottom: 8px; }
  .metric-num { font-family: 'DM Serif Display',serif; font-size: 52px; font-weight: 400; line-height: 1; letter-spacing: -1.5px; color: #1A1A1A; }
  .metric-sub { font-size: 12px; color: #BBB; margin-top: 4px; font-weight: 300; }

  /* Key tier */
  .section-title { font-family: 'DM Serif Display',serif; font-size: 20px; font-weight: 400; color: #1A1A1A; margin-bottom: 16px; }
  .tier-track { display: flex; align-items: center; margin-bottom: 32px; }
  .tier-node { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .tier-dot { width: 10px; height: 10px; border-radius: 50%; }
  .tier-dot-active { background: #A0785A; }
  .tier-dot-inactive { background: #ECEAE6; }
  .tier-label { font-size: 10px; font-weight: 600; letter-spacing: .05em; }
  .tier-connector { flex: 1; height: 1px; margin-bottom: 20px; }
  .tier-progress { height: 3px; background: #ECEAE6; border-radius: 2px; overflow: hidden; margin-bottom: 6px; }
  .tier-progress-fill { height: 100%; background: #A0785A; border-radius: 2px; transition: width .6s ease; }
  .tier-caption { font-size: 12px; color: #BBB; font-weight: 300; }

  .rule { border: none; border-top: 1px solid #ECEAE6; margin: 32px 0; }

  /* Session log */
  .session-table-header {
    display: grid; grid-template-columns: 32px 1fr 80px 80px 44px;
    gap: 12px; padding-bottom: 10px; border-bottom: 2px solid #1A1A1A;
  }
  .col-label { font-size: 10px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: #AAA; }
  .session-row-wrap {}
  .session-row {
    display: grid; grid-template-columns: 32px 1fr 80px 80px 44px;
    gap: 12px; align-items: center; padding: 13px 0;
    border-bottom: 1px solid #F2EFEB; cursor: pointer;
    transition: all .1s; border-radius: 2px;
  }
  .session-row:hover { background: #F9F7F5; padding-left: 8px; padding-right: 8px; margin: 0 -8px; }
  .session-row:last-child { border-bottom: none; }
  .session-num { font-size: 12px; color: #CCC; font-weight: 500; }
  .session-attachment { font-size: 14px; font-weight: 400; color: #1A1A1A; line-height: 1.4; }
  .session-date { font-size: 12px; color: #BBB; font-weight: 300; margin-top: 2px; }
  .session-delta { font-family: 'DM Serif Display',serif; font-size: 20px; color: #A0785A; text-align: center; }
  .in-progress-badge {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 10px; font-weight: 600; letter-spacing: .08em;
    text-transform: uppercase; color: #9A6F1A;
    background: #FDFAF2; border: 1px solid #D4A84340;
    padding: 2px 7px; border-radius: 100px; margin-top: 3px;
  }
  .note-expand {
    background: #F7F5F2; border-left: 2px solid #A0785A;
    padding: 10px 14px; font-size: 13px; color: #555;
    font-style: italic; line-height: 1.6;
  }
  .note-label { font-style: normal; font-size: 10px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: #A0785A; margin-bottom: 5px; }

  /* Inventory */
  .inventory-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
  @media(max-width:600px){ .inventory-grid { grid-template-columns: 1fr; } }
  .inv-section-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 14px; }
  .inv-section-label { font-size: 11px; color: #A0785A; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; }
  .inv-section-count { font-size: 12px; color: #BBB; font-weight: 300; }
  .inv-list { border-top: 2px solid #1A1A1A; }
  .inv-item { display: flex; align-items: flex-start; gap: 10px; padding: 12px 0; border-bottom: 1px solid #F2EFEB; }
  .inv-item:last-child { border-bottom: none; }
  .inv-dot { width: 6px; height: 6px; border-radius: 50%; margin-top: 6px; flex-shrink: 0; }
  .inv-dot-priority { background: #A0785A; }
  .inv-dot-regular { background: #DEDAD4; }
  .inv-text { font-size: 14px; line-height: 1.5; flex: 1; color: #1A1A1A; }
  .inv-text-regular { font-weight: 300; color: #444; }
  .inv-check-btn {
    background: none; border: 1px solid #DEDAD4; border-radius: 2px;
    width: 18px; height: 18px; cursor: pointer; flex-shrink: 0;
    transition: border-color .15s, background .15s; margin-top: 2px;
    display: flex; align-items: center; justify-content: center; color: transparent;
    font-size: 11px;
  }
  .inv-check-btn:hover { border-color: #A0785A; color: #A0785A; }

  .inv-add-form { display: flex; gap: 8px; margin-top: 14px; }
  .inv-add-input {
    flex: 1; padding: 9px 12px; background: #fff; border: 1px solid #DEDAD4;
    border-radius: 3px; font-family: 'DM Sans',sans-serif; font-size: 13px;
    color: #1A1A1A; outline: none; transition: border-color .15s;
  }
  .inv-add-input:focus { border-color: #A0785A; }
  .inv-add-input::placeholder { color: #CCC; }
  .inv-add-btn {
    padding: 9px 14px; background: #1A1A1A; color: #FAF9F7; border: none;
    border-radius: 3px; font-family: 'DM Sans',sans-serif; font-size: 13px;
    font-weight: 500; cursor: pointer; transition: background .15s; white-space: nowrap;
  }
  .inv-add-btn:hover:not(:disabled) { background: #333; }
  .inv-add-btn:disabled { opacity: .4; cursor: default; }

  /* Life notes */
  .notes-list { display: flex; flex-direction: column; gap: 0; border-top: 2px solid #1A1A1A; }
  .note-item { display: flex; align-items: flex-start; gap: 12px; padding: 14px 0; border-bottom: 1px solid #F2EFEB; }
  .note-item:last-child { border-bottom: none; }
  .note-type-dot { width: 7px; height: 7px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
  .note-type-win { background: #D4A843; }
  .note-type-note { background: #A0785A; }
  .note-content { font-size: 14px; line-height: 1.6; color: #444; font-weight: 300; flex: 1; }
  .note-date { font-size: 11px; color: #CCC; margin-top: 2px; }
  .notes-empty { padding: 20px 0; font-size: 13px; color: #CCC; font-weight: 300; }

  /* Drive folder */
  .drive-section { margin-top: 0; }
  .drive-link { display: inline-flex; align-items: center; gap: 8px; font-size: 15px; color: #1A1A1A; font-weight: 500; text-decoration: none; transition: color .15s; }
  .drive-link:hover { color: #A0785A; }
  .drive-link svg { flex-shrink: 0; }
  .drive-sub { font-size: 12px; color: #BBB; font-weight: 300; margin-top: 4px; }

  .footer { display: flex; justify-content: space-between; align-items: center; margin-top: 48px; }
  .footer-text { font-size: 12px; color: #CCC; font-weight: 300; }
`

export default function Dashboard({ session }) {
  const [profile, setProfile] = useState(null)
  const [conversations, setConversations] = useState([])
  const [forms, setForms] = useState([])
  const [inventory, setInventory] = useState([])
  const [lifeNotes, setLifeNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [expandedSession, setExpandedSession] = useState(null)
  const [newItem, setNewItem] = useState('')
  const [addingItem, setAddingItem] = useState(false)
  const [removingId, setRemovingId] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    const [profileRes, convsRes, formsRes, invRes, notesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', session.user.id).single(),
      supabase.from('conversations').select('*').order('created_at', { ascending: true }),
      supabase.from('post_session_forms').select('*'),
      supabase.from('attachment_inventory').select('*').order('created_at', { ascending: true }),
      supabase.from('life_notes').select('*').order('created_at', { ascending: false }),
    ])
    setProfile(profileRes.data)
    setConversations(convsRes.data || [])
    setForms(formsRes.data || [])
    setInventory(invRes.data || [])
    setLifeNotes(notesRes.data || [])
    setLoading(false)
  }

  const startNewSession = async () => {
    setCreating(true)
    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: session.user.id })
      .select()
      .single()
    if (!error && data) navigate(`/chat/${data.id}`)
    else setCreating(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const addInventoryItem = async () => {
    if (!newItem.trim()) return
    setAddingItem(true)
    const { data, error } = await supabase
      .from('attachment_inventory')
      .insert({ user_id: session.user.id, text: newItem.trim(), priority: false, added_by: 'client' })
      .select()
      .single()
    if (!error && data) {
      setInventory(prev => [...prev, data])
      setNewItem('')
    }
    setAddingItem(false)
  }

  const removeInventoryItem = async (id) => {
    setRemovingId(id)
    const { error } = await supabase.from('attachment_inventory').delete().eq('id', id)
    if (!error) setInventory(prev => prev.filter(i => i.id !== id))
    setRemovingId(null)
  }

  // Derived data
  const completedConvIds = new Set(forms.map(f => f.conversation_id))
  const completedCount = conversations.filter(c => completedConvIds.has(c.id)).length
  const totalPressure = forms.reduce((sum, f) => {
    const delta = (f.charge_before || 0) - (f.charge_after || 0)
    return sum + Math.max(0, delta)
  }, 0)
  const weeklyStatus = getWeeklyStatus(conversations)
  const tierProgress = getProgressToNextTier(completedCount)

  const priorityItems = inventory.filter(i => i.priority)
  const regularItems = inventory.filter(i => !i.priority)

  const clientName = profile?.full_name || session.user.email

  if (loading) return null

  return (
    <>
      <style>{S}</style>
      <div className="db-wrap">

        {/* Nav */}
        <nav className="db-nav">
          <div className="db-nav-left">
            <div className="eyebrow">Release Method</div>
            <div className="client-name">{clientName}</div>
          </div>
          <div className="db-nav-right">
            <div
              className="week-badge"
              style={{ background: weeklyStatus.bg, color: weeklyStatus.color, border: `1px solid ${weeklyStatus.dot}40` }}
            >
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: weeklyStatus.dot, flexShrink: 0 }} />
              {weeklyStatus.label}
            </div>
            {profile?.next_coaching_call && (
              <div className="next-call">Next call: {formatNextCall(profile.next_coaching_call)}</div>
            )}
            <button className="signout-btn" onClick={handleSignOut}>Sign out</button>
          </div>
        </nav>

        <div className="db-body">

          {/* Start Session CTA */}
          <div className="start-cta">
            <div className="start-cta-text">
              <div className="headline">Ready for a session?</div>
              <div className="sub">
                Pick something from your inventory below, or bring whatever's weighing on you.
              </div>
            </div>
            <button className="start-btn" onClick={startNewSession} disabled={creating}>
              {creating ? 'Starting…' : '+ Start session'}
            </button>
          </div>

          {/* Metrics */}
          <div className="metrics-row">
            <div className="metric-card">
              <div className="metric-label">Sessions</div>
              <div className="metric-num">{completedCount}</div>
              <div className="metric-sub">{conversations.length} total started</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Pressure Released</div>
              <div className="metric-num">{totalPressure}</div>
              <div className="metric-sub">cumulative points</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Next Tier</div>
              <div className="metric-num" style={{ fontSize: 36, letterSpacing: -.5, paddingTop: 8 }}>
                {tierProgress.tierName}
              </div>
              <div className="metric-sub">{tierProgress.target - completedCount} sessions away</div>
            </div>
          </div>

          {/* Key Tier Progress */}
          <div>
            <div style={{ marginBottom: 12 }}>
              <div className="tier-progress">
                <div className="tier-progress-fill" style={{ width: `${tierProgress.pct}%` }} />
              </div>
            </div>
            <div className="tier-track">
              {KEY_LEVELS.map((level, i) => {
                const reached = completedCount >= level.sessions
                return (
                  <div key={level.name} style={{ display: 'flex', alignItems: 'center', flex: i < KEY_LEVELS.length - 1 ? 1 : 0 }}>
                    <div className="tier-node">
                      <div className={`tier-dot ${reached ? 'tier-dot-active' : 'tier-dot-inactive'}`} />
                      <div className="tier-label" style={{ color: reached ? '#A0785A' : '#CCC', fontSize: 10 }}>
                        {level.name}
                      </div>
                      <div style={{ fontSize: 10, color: '#DDD', fontWeight: 300 }}>{level.sessions}</div>
                    </div>
                    {i < KEY_LEVELS.length - 1 && (
                      <div className="tier-connector" style={{ background: completedCount >= level.sessions ? '#DFC5AF' : '#ECEAE6' }} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <hr className="rule" />

          {/* Attachment Inventory */}
          <div style={{ marginBottom: 0 }}>
            <div className="section-title">Attachment Inventory</div>
            <div className="inventory-grid">

              {/* Focus Now */}
              <div>
                <div className="inv-section-header">
                  <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 18, fontWeight: 400 }}>Focus Now</div>
                  <div className="inv-section-label">Blake's picks</div>
                </div>
                <div className="inv-list">
                  {priorityItems.length === 0 && (
                    <div style={{ padding: '16px 0', fontSize: 13, color: '#CCC', fontWeight: 300 }}>
                      Nothing prioritized yet.
                    </div>
                  )}
                  {priorityItems.map(item => (
                    <div key={item.id} className="inv-item" style={{ opacity: removingId === item.id ? 0.4 : 1, transition: 'opacity .2s' }}>
                      <div className="inv-dot inv-dot-priority" />
                      <div className="inv-text">{item.text}</div>
                      <button
                        className="inv-check-btn"
                        onClick={() => removeInventoryItem(item.id)}
                        title="Mark as processed"
                        disabled={removingId === item.id}
                      >✓</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Full Inventory */}
              <div>
                <div className="inv-section-header">
                  <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 18, fontWeight: 400 }}>Full Inventory</div>
                  <div className="inv-section-count">{inventory.length} items</div>
                </div>
                <div className="inv-list">
                  {regularItems.length === 0 && (
                    <div style={{ padding: '16px 0', fontSize: 13, color: '#CCC', fontWeight: 300 }}>
                      Add attachments you want to work through.
                    </div>
                  )}
                  {regularItems.map(item => (
                    <div key={item.id} className="inv-item" style={{ opacity: removingId === item.id ? 0.4 : 1, transition: 'opacity .2s' }}>
                      <div className="inv-dot inv-dot-regular" />
                      <div className="inv-text inv-text-regular">{item.text}</div>
                      <button
                        className="inv-check-btn"
                        onClick={() => removeInventoryItem(item.id)}
                        title="Mark as processed"
                        disabled={removingId === item.id}
                      >✓</button>
                    </div>
                  ))}
                  {/* Add new item */}
                  <div className="inv-add-form">
                    <input
                      className="inv-add-input"
                      placeholder="Add an attachment…"
                      value={newItem}
                      onChange={e => setNewItem(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addInventoryItem()}
                    />
                    <button className="inv-add-btn" onClick={addInventoryItem} disabled={!newItem.trim() || addingItem}>
                      Add
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <hr className="rule" />

          {/* Session Log */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
              <div className="section-title" style={{ marginBottom: 0 }}>Session Log</div>
              <div style={{ fontSize: 12, color: '#BBB', letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 500 }}>
                {completedCount} of {KEY_LEVELS[0].sessions} to Bronze
              </div>
            </div>

            {conversations.length === 0 ? (
              <div style={{ padding: '24px 0', fontSize: 14, color: '#CCC', fontWeight: 300 }}>
                Your sessions will appear here after your first one.
              </div>
            ) : (
              <>
                <div className="session-table-header">
                  {['#', 'Attachment Released', 'Before', 'After', 'Δ'].map((h, i) => (
                    <div key={i} className="col-label" style={{ textAlign: i > 1 ? 'center' : 'left' }}>{h}</div>
                  ))}
                </div>
                {[...conversations].reverse().map((conv, idx) => {
                  const sessionNum = conversations.length - idx
                  const form = forms.find(f => f.conversation_id === conv.id)
                  const isComplete = !!form
                  const isInProgress = !isComplete && conv.title
                  const delta = form ? Math.max(0, (form.charge_before || 0) - (form.charge_after || 0)) : null
                  return (
                    <div key={conv.id} className="session-row-wrap">
                      <div
                        className="session-row"
                        onClick={() => isInProgress ? navigate(`/chat/${conv.id}`) : setExpandedSession(expandedSession === conv.id ? null : conv.id)}
                      >
                        <div className="session-num">{sessionNum}</div>
                        <div>
                          <div className="session-attachment">
                            {conv.attachment_text || conv.title || <span style={{ color: '#CCC', fontWeight: 300 }}>Untitled</span>}
                          </div>
                          <div className="session-date">{formatDate(conv.created_at)}</div>
                          {isInProgress && (
                            <div className="in-progress-badge">
                              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#D4A843' }} />
                              In progress
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          {form?.charge_before != null ? (
                            <>
                              <RatingBar value={form.charge_before} color="#E5BFAE" />
                              <div style={{ fontSize: 11, color: '#AAA', marginTop: 3 }}>{form.charge_before}/10</div>
                            </>
                          ) : <div style={{ fontSize: 12, color: '#DDD' }}>—</div>}
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          {form?.charge_after != null ? (
                            <>
                              <RatingBar value={form.charge_after} color="#A8C8B4" />
                              <div style={{ fontSize: 11, color: '#AAA', marginTop: 3 }}>{form.charge_after}/10</div>
                            </>
                          ) : <div style={{ fontSize: 12, color: '#DDD' }}>—</div>}
                        </div>
                        <div className="session-delta">
                          {delta != null ? `+${delta}` : '—'}
                        </div>
                      </div>
                      {expandedSession === conv.id && form?.insights && (
                        <div className="note-expand">
                          <div className="note-label">Insight</div>
                          "{form.insights}"
                        </div>
                      )}
                    </div>
                  )
                })}
              </>
            )}
          </div>

          <hr className="rule" />

          {/* Life Notes & Wins */}
          <div>
            <div className="section-title">Notes & Wins</div>
            {lifeNotes.length === 0 ? (
              <div className="notes-empty">Your coach will add notes and wins here as they come up in your work together.</div>
            ) : (
              <div className="notes-list">
                {lifeNotes.map(note => (
                  <div key={note.id} className="note-item">
                    <div className={`note-type-dot ${note.type === 'win' ? 'note-type-win' : 'note-type-note'}`} />
                    <div>
                      <div className="note-content">{note.content}</div>
                      <div className="note-date">{formatDate(note.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Your Drive Folder */}
          {profile?.resources_url && (
            <>
              <hr className="rule" />
              <div className="drive-section">
                <a className="drive-link" href={profile.resources_url} target="_blank" rel="noopener noreferrer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  </svg>
                  Your Drive Folder →
                </a>
                <div className="drive-sub">Your coaching session recordings and resources live here.</div>
              </div>
            </>
          )}

          <div className="footer">
            <div className="footer-text">Release Method · Private Dashboard</div>
          </div>

        </div>
      </div>
    </>
  )
}
