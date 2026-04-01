import { useState, useEffect } from 'react'

const ADMIN_KEY = 'rm_admin_pw'

function adminFetch(path, options = {}) {
  const pw = sessionStorage.getItem(ADMIN_KEY)
  return fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${pw}`,
      ...(options.headers || {}),
    },
  })
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateInput(iso) {
  if (!iso) return ''
  return new Date(iso).toISOString().split('T')[0]
}

const S = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&family=DM+Serif+Display@ital@0;1&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans',sans-serif; }

  .adm-wrap { min-height: 100vh; background: #FAF9F7; }

  /* Login */
  .adm-login { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .adm-login-card { width: 100%; max-width: 340px; }
  .adm-login-eyebrow { font-size: 10px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: #A0785A; margin-bottom: 6px; }
  .adm-login-title { font-family: 'DM Serif Display',serif; font-size: 24px; color: #1A1A1A; margin-bottom: 32px; }
  .adm-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
  .adm-label { font-size: 11px; font-weight: 600; letter-spacing: .09em; text-transform: uppercase; color: #999; }
  .adm-input {
    padding: 11px 14px; background: #fff; border: 1px solid #DEDAD4;
    border-radius: 3px; font-family: 'DM Sans',sans-serif; font-size: 15px;
    color: #1A1A1A; outline: none; transition: border-color .15s;
  }
  .adm-input:focus { border-color: #A0785A; }
  .adm-btn {
    width: 100%; padding: 13px; background: #1A1A1A; color: #FAF9F7;
    border: none; border-radius: 3px; font-family: 'DM Sans',sans-serif;
    font-size: 14px; font-weight: 500; cursor: pointer; transition: background .15s; margin-top: 8px;
  }
  .adm-btn:hover:not(:disabled) { background: #333; }
  .adm-btn:disabled { opacity: .5; cursor: default; }
  .adm-err { padding: 10px 14px; background: #FDF2F2; border: 1px solid #EAC8C8; border-radius: 3px; font-size: 13px; color: #C0392B; margin-bottom: 14px; }

  /* Nav */
  .adm-nav {
    background: #fff; border-bottom: 1px solid #ECEAE6;
    padding: 16px 32px; display: flex; align-items: center; justify-content: space-between;
    position: sticky; top: 0; z-index: 10;
  }
  .adm-nav-brand { font-size: 10px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: #AAA; }
  .adm-nav-title { font-size: 16px; font-weight: 500; color: #1A1A1A; }
  .adm-nav-right { display: flex; align-items: center; gap: 16px; }
  .adm-signout { background: none; border: none; font-family: 'DM Sans',sans-serif; font-size: 13px; color: #BBB; cursor: pointer; transition: color .15s; }
  .adm-signout:hover { color: #666; }
  .adm-back { background: none; border: none; font-family: 'DM Sans',sans-serif; font-size: 13px; color: #AAA; cursor: pointer; padding: 4px 0; transition: color .15s; }
  .adm-back:hover { color: #555; }

  /* Body */
  .adm-body { max-width: 900px; margin: 0 auto; padding: 40px 32px 80px; }

  /* Client list */
  .clients-header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 24px; }
  .clients-title { font-family: 'DM Serif Display',serif; font-size: 24px; color: #1A1A1A; }
  .clients-count { font-size: 13px; color: #BBB; font-weight: 300; }
  .clients-table-head { display: grid; grid-template-columns: 1fr 80px 100px 120px; gap: 16px; padding-bottom: 10px; border-bottom: 2px solid #1A1A1A; }
  .th { font-size: 10px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: #AAA; }
  .client-row { display: grid; grid-template-columns: 1fr 80px 100px 120px; gap: 16px; align-items: center; padding: 14px 0; border-bottom: 1px solid #F2EFEB; cursor: pointer; transition: all .1s; border-radius: 2px; }
  .client-row:hover { background: #F9F7F5; padding-left: 8px; padding-right: 8px; margin: 0 -8px; }
  .client-name-cell .name { font-size: 14px; font-weight: 500; color: #1A1A1A; }
  .client-name-cell .email { font-size: 12px; color: #BBB; font-weight: 300; margin-top: 2px; }
  .td { font-size: 14px; color: #666; }
  .tier-pill { display: inline-block; padding: 2px 8px; border-radius: 100px; font-size: 11px; font-weight: 600; letter-spacing: .05em; text-transform: capitalize; background: #FAF9F7; border: 1px solid #ECEAE6; color: #A0785A; }

  /* Client detail */
  .detail-section { margin-bottom: 40px; }
  .detail-section-title { font-family: 'DM Serif Display',serif; font-size: 20px; color: #1A1A1A; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #1A1A1A; }

  .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media(max-width:500px){ .profile-grid { grid-template-columns: 1fr; } }
  .profile-field { display: flex; flex-direction: column; gap: 6px; }
  .profile-label { font-size: 10px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: #AAA; }
  .profile-input {
    padding: 10px 12px; background: #fff; border: 1px solid #DEDAD4; border-radius: 3px;
    font-family: 'DM Sans',sans-serif; font-size: 14px; color: #1A1A1A; outline: none; transition: border-color .15s;
  }
  .profile-input:focus { border-color: #A0785A; }
  .save-btn {
    margin-top: 16px; padding: 11px 22px; background: #1A1A1A; color: #FAF9F7;
    border: none; border-radius: 3px; font-family: 'DM Sans',sans-serif;
    font-size: 13px; font-weight: 500; cursor: pointer; transition: background .15s;
  }
  .save-btn:hover:not(:disabled) { background: #333; }
  .save-btn:disabled { opacity: .4; cursor: default; }
  .save-confirm { font-size: 12px; color: #1E7A52; margin-left: 12px; }

  /* Inventory admin */
  .inv-adm-item { display: flex; align-items: center; gap: 10px; padding: 11px 0; border-bottom: 1px solid #F2EFEB; }
  .inv-adm-item:last-child { border-bottom: none; }
  .priority-toggle {
    width: 20px; height: 20px; border-radius: 50%; border: 1.5px solid #DEDAD4;
    background: none; cursor: pointer; transition: all .15s; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .priority-toggle.active { background: #A0785A; border-color: #A0785A; }
  .inv-adm-text { flex: 1; font-size: 14px; color: #1A1A1A; line-height: 1.4; }
  .inv-adm-meta { font-size: 11px; color: #CCC; }
  .del-btn { background: none; border: none; color: #DEDAD4; font-size: 18px; cursor: pointer; padding: 0 4px; transition: color .15s; flex-shrink: 0; }
  .del-btn:hover { color: #C0392B; }
  .adm-add-row { display: flex; gap: 8px; margin-top: 16px; }
  .adm-add-input {
    flex: 1; padding: 9px 12px; background: #fff; border: 1px solid #DEDAD4;
    border-radius: 3px; font-family: 'DM Sans',sans-serif; font-size: 14px; color: #1A1A1A; outline: none; transition: border-color .15s;
  }
  .adm-add-input:focus { border-color: #A0785A; }
  .adm-add-input::placeholder { color: #CCC; }
  .adm-add-btn {
    padding: 9px 16px; background: #1A1A1A; color: #FAF9F7; border: none;
    border-radius: 3px; font-family: 'DM Sans',sans-serif; font-size: 13px;
    font-weight: 500; cursor: pointer; white-space: nowrap; transition: background .15s;
  }
  .adm-add-btn:hover:not(:disabled) { background: #333; }
  .adm-add-btn:disabled { opacity: .4; cursor: default; }
  .priority-hint { font-size: 11px; color: #BBB; font-weight: 300; margin-top: 10px; }

  /* Notes admin */
  .note-adm-item { display: flex; align-items: flex-start; gap: 10px; padding: 11px 0; border-bottom: 1px solid #F2EFEB; }
  .note-adm-item:last-child { border-bottom: none; }
  .note-type-dot { width: 7px; height: 7px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
  .note-type-win-dot { background: #D4A843; }
  .note-type-note-dot { background: #A0785A; }
  .note-adm-content { flex: 1; font-size: 14px; color: #444; font-weight: 300; line-height: 1.5; }
  .note-adm-date { font-size: 11px; color: #CCC; margin-top: 2px; }
  .type-toggle { display: flex; border: 1px solid #DEDAD4; border-radius: 3px; overflow: hidden; }
  .type-opt { padding: 9px 16px; background: none; border: none; font-family: 'DM Sans',sans-serif; font-size: 13px; color: #AAA; cursor: pointer; transition: all .15s; }
  .type-opt.active { background: #1A1A1A; color: #FAF9F7; }
  .adm-textarea {
    flex: 1; padding: 9px 12px; background: #fff; border: 1px solid #DEDAD4; border-radius: 3px;
    font-family: 'DM Sans',sans-serif; font-size: 14px; color: #1A1A1A; outline: none; resize: none;
    line-height: 1.5; transition: border-color .15s;
  }
  .adm-textarea:focus { border-color: #A0785A; }
  .adm-textarea::placeholder { color: #CCC; }

  .rule { border: none; border-top: 1px solid #ECEAE6; margin: 32px 0; }
  .empty-state { padding: 16px 0; font-size: 13px; color: #CCC; font-weight: 300; }

  /* Session log (read-only in admin) */
  .adm-session-row { display: grid; grid-template-columns: 32px 1fr 60px 60px 44px; gap: 12px; align-items: center; padding: 11px 0; border-bottom: 1px solid #F2EFEB; }
  .adm-session-row:last-child { border-bottom: none; }
`

// ── Login View ────────────────────────────────────────────────
function LoginView({ onLogin }) {
  const [pw, setPw] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    sessionStorage.setItem(ADMIN_KEY, pw)
    const res = await fetch('/api/admin-clients', {
      headers: { 'Authorization': `Bearer ${pw}` },
    })
    if (res.ok) {
      onLogin()
    } else {
      sessionStorage.removeItem(ADMIN_KEY)
      setError('Incorrect password.')
      setLoading(false)
    }
  }

  return (
    <div className="adm-login">
      <div className="adm-login-card">
        <div className="adm-login-eyebrow">Blake Stratton</div>
        <div className="adm-login-title">Admin Panel</div>
        <form onSubmit={handleLogin}>
          {error && <div className="adm-err">{error}</div>}
          <div className="adm-field">
            <label className="adm-label">Password</label>
            <input
              type="password"
              className="adm-input"
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="••••••••"
              autoFocus
            />
          </div>
          <button type="submit" className="adm-btn" disabled={loading || !pw}>
            {loading ? 'Checking…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Client List View ──────────────────────────────────────────
function ClientsView({ onSelectClient, onSignOut }) {
  const [clients, setClients] = useState(null)

  useEffect(() => {
    adminFetch('/api/admin-clients')
      .then(r => r.json())
      .then(d => setClients(d.clients || []))
  }, [])

  return (
    <div className="adm-wrap">
      <nav className="adm-nav">
        <div>
          <div className="adm-nav-brand">Release Method</div>
          <div className="adm-nav-title">Admin Panel</div>
        </div>
        <div className="adm-nav-right">
          <button className="adm-signout" onClick={onSignOut}>Sign out</button>
        </div>
      </nav>
      <div className="adm-body">
        <div className="clients-header">
          <div className="clients-title">Clients</div>
          {clients && <div className="clients-count">{clients.length} total</div>}
        </div>
        {!clients ? (
          <div className="empty-state">Loading…</div>
        ) : clients.length === 0 ? (
          <div className="empty-state">No clients yet. Create users in Supabase → Authentication → Users.</div>
        ) : (
          <>
            <div className="clients-table-head">
              <div className="th">Client</div>
              <div className="th">Sessions</div>
              <div className="th">Last session</div>
              <div className="th">Tier</div>
            </div>
            {clients.map(c => (
              <div key={c.id} className="client-row" onClick={() => onSelectClient(c.id)}>
                <div className="client-name-cell">
                  <div className="name">{c.full_name || '(no name)'}</div>
                  <div className="email">{c.email}</div>
                </div>
                <div className="td">{c.completed_count} / {c.session_count}</div>
                <div className="td">{c.last_session ? formatDate(c.last_session) : '—'}</div>
                <div className="td"><span className="tier-pill">{c.key_tier}</span></div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

// ── Client Detail View ────────────────────────────────────────
function ClientDetailView({ clientId, onBack }) {
  const [data, setData] = useState(null)

  // Profile form state
  const [nextCall, setNextCall] = useState('')
  const [resourcesUrl, setResourcesUrl] = useState('')
  const [fullName, setFullName] = useState('')
  const [keyTier, setKeyTier] = useState('bronze')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  // Inventory state
  const [inventory, setInventory] = useState([])
  const [newInvText, setNewInvText] = useState('')
  const [newInvPriority, setNewInvPriority] = useState(false)
  const [addingInv, setAddingInv] = useState(false)

  // Life notes state
  const [lifeNotes, setLifeNotes] = useState([])
  const [newNoteContent, setNewNoteContent] = useState('')
  const [newNoteType, setNewNoteType] = useState('note')
  const [addingNote, setAddingNote] = useState(false)

  useEffect(() => {
    adminFetch(`/api/admin-client-get?userId=${clientId}`)
      .then(r => r.json())
      .then(d => {
        setData(d)
        setFullName(d.profile?.full_name || '')
        setNextCall(formatDateInput(d.profile?.next_coaching_call))
        setResourcesUrl(d.profile?.resources_url || '')
        setKeyTier(d.profile?.key_tier || 'bronze')
        setInventory(d.inventory || [])
        setLifeNotes(d.life_notes || [])
      })
  }, [clientId])

  const saveProfile = async () => {
    setSavingProfile(true)
    setProfileSaved(false)
    await adminFetch('/api/admin-client-update', {
      method: 'POST',
      body: JSON.stringify({
        action: 'update-profile',
        userId: clientId,
        data: {
          full_name: fullName || null,
          next_coaching_call: nextCall || null,
          resources_url: resourcesUrl || null,
          key_tier: keyTier,
        },
      }),
    })
    setSavingProfile(false)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2500)
  }

  const addInventoryItem = async () => {
    if (!newInvText.trim()) return
    setAddingInv(true)
    const res = await adminFetch('/api/admin-client-update', {
      method: 'POST',
      body: JSON.stringify({
        action: 'add-inventory',
        userId: clientId,
        data: { text: newInvText.trim(), priority: newInvPriority },
      }),
    })
    const result = await res.json()
    if (result.item) {
      setInventory(prev => [...prev, result.item])
      setNewInvText('')
      setNewInvPriority(false)
    }
    setAddingInv(false)
  }

  const togglePriority = async (itemId) => {
    setInventory(prev => prev.map(i => i.id === itemId ? { ...i, priority: !i.priority } : i))
    await adminFetch('/api/admin-client-update', {
      method: 'POST',
      body: JSON.stringify({ action: 'toggle-priority', userId: clientId, data: { id: itemId } }),
    })
  }

  const deleteInventoryItem = async (itemId) => {
    setInventory(prev => prev.filter(i => i.id !== itemId))
    await adminFetch('/api/admin-client-update', {
      method: 'POST',
      body: JSON.stringify({ action: 'delete-inventory', userId: clientId, data: { id: itemId } }),
    })
  }

  const addLifeNote = async () => {
    if (!newNoteContent.trim()) return
    setAddingNote(true)
    const res = await adminFetch('/api/admin-client-update', {
      method: 'POST',
      body: JSON.stringify({
        action: 'add-life-note',
        userId: clientId,
        data: { content: newNoteContent.trim(), type: newNoteType },
      }),
    })
    const result = await res.json()
    if (result.note) {
      setLifeNotes(prev => [result.note, ...prev])
      setNewNoteContent('')
    }
    setAddingNote(false)
  }

  const deleteLifeNote = async (noteId) => {
    setLifeNotes(prev => prev.filter(n => n.id !== noteId))
    await adminFetch('/api/admin-client-update', {
      method: 'POST',
      body: JSON.stringify({ action: 'delete-life-note', userId: clientId, data: { id: noteId } }),
    })
  }

  if (!data) return (
    <div className="adm-wrap">
      <nav className="adm-nav">
        <button className="adm-back" onClick={onBack}>‹ Clients</button>
      </nav>
      <div className="adm-body"><div className="empty-state">Loading…</div></div>
    </div>
  )

  const clientName = data.profile?.full_name || data.email

  return (
    <div className="adm-wrap">
      <nav className="adm-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="adm-back" onClick={onBack}>‹ Clients</button>
          <div>
            <div className="adm-nav-brand">Release Method · Admin</div>
            <div className="adm-nav-title">{clientName}</div>
          </div>
        </div>
      </nav>

      <div className="adm-body">

        {/* Profile */}
        <div className="detail-section">
          <div className="detail-section-title">Client Profile</div>
          <div className="profile-grid">
            <div className="profile-field">
              <label className="profile-label">Full name</label>
              <input className="profile-input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Client's name" />
            </div>
            <div className="profile-field">
              <label className="profile-label">Email</label>
              <input className="profile-input" value={data.email || ''} disabled style={{ opacity: .5 }} />
            </div>
            <div className="profile-field">
              <label className="profile-label">Next coaching call</label>
              <input type="date" className="profile-input" value={nextCall} onChange={e => setNextCall(e.target.value)} />
            </div>
            <div className="profile-field">
              <label className="profile-label">Key tier</label>
              <select className="profile-input" value={keyTier} onChange={e => setKeyTier(e.target.value)}>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="platinum">Platinum</option>
                <option value="diamond">Diamond</option>
              </select>
            </div>
            <div className="profile-field" style={{ gridColumn: '1 / -1' }}>
              <label className="profile-label">Google Drive folder URL</label>
              <input className="profile-input" value={resourcesUrl} onChange={e => setResourcesUrl(e.target.value)} placeholder="https://drive.google.com/drive/folders/..." />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button className="save-btn" onClick={saveProfile} disabled={savingProfile}>
              {savingProfile ? 'Saving…' : 'Save profile'}
            </button>
            {profileSaved && <span className="save-confirm">✓ Saved</span>}
          </div>
        </div>

        <hr className="rule" />

        {/* Attachment Inventory */}
        <div className="detail-section">
          <div className="detail-section-title">Attachment Inventory</div>
          {inventory.length === 0 && <div className="empty-state">No items yet.</div>}
          {inventory.map(item => (
            <div key={item.id} className="inv-adm-item">
              <button
                className={`priority-toggle ${item.priority ? 'active' : ''}`}
                onClick={() => togglePriority(item.id)}
                title={item.priority ? 'Remove from Focus Now' : 'Add to Focus Now'}
              >
                {item.priority && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="white">
                    <circle cx="5" cy="5" r="3" />
                  </svg>
                )}
              </button>
              <div style={{ flex: 1 }}>
                <div className="inv-adm-text">{item.text}</div>
                <div className="inv-adm-meta">
                  {item.priority ? 'Focus Now · ' : ''}{item.added_by === 'coach' ? 'Added by you' : 'Added by client'}
                </div>
              </div>
              <button className="del-btn" onClick={() => deleteInventoryItem(item.id)} title="Remove">×</button>
            </div>
          ))}
          <div className="adm-add-row" style={{ marginTop: inventory.length === 0 ? 0 : 12 }}>
            <input
              className="adm-add-input"
              placeholder="Add an attachment…"
              value={newInvText}
              onChange={e => setNewInvText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addInventoryItem()}
            />
            <button
              className={`priority-toggle ${newInvPriority ? 'active' : ''}`}
              onClick={() => setNewInvPriority(p => !p)}
              title="Mark as priority (Focus Now)"
              style={{ flexShrink: 0 }}
            >
              {newInvPriority && <svg width="10" height="10" viewBox="0 0 10 10" fill="white"><circle cx="5" cy="5" r="3" /></svg>}
            </button>
            <button className="adm-add-btn" onClick={addInventoryItem} disabled={!newInvText.trim() || addingInv}>Add</button>
          </div>
          <div className="priority-hint">Filled circle = Focus Now (Blake's picks). Click the circle to toggle priority.</div>
        </div>

        <hr className="rule" />

        {/* Life Notes & Wins */}
        <div className="detail-section">
          <div className="detail-section-title">Notes & Wins</div>

          {/* Add new note */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'flex-start' }}>
            <div className="type-toggle">
              <button className={`type-opt ${newNoteType === 'note' ? 'active' : ''}`} onClick={() => setNewNoteType('note')}>Note</button>
              <button className={`type-opt ${newNoteType === 'win' ? 'active' : ''}`} onClick={() => setNewNoteType('win')}>Win</button>
            </div>
            <textarea
              className="adm-textarea"
              rows={2}
              placeholder={newNoteType === 'win' ? 'Describe the win…' : 'Add a coaching note…'}
              value={newNoteContent}
              onChange={e => setNewNoteContent(e.target.value)}
            />
            <button className="adm-add-btn" onClick={addLifeNote} disabled={!newNoteContent.trim() || addingNote} style={{ flexShrink: 0 }}>
              Add
            </button>
          </div>

          {lifeNotes.length === 0 && <div className="empty-state">No notes yet.</div>}
          {lifeNotes.map(note => (
            <div key={note.id} className="note-adm-item">
              <div className={`note-type-dot ${note.type === 'win' ? 'note-type-win-dot' : 'note-type-note-dot'}`} />
              <div style={{ flex: 1 }}>
                <div className="note-adm-content">{note.content}</div>
                <div className="note-adm-date">{formatDate(note.created_at)} · {note.type === 'win' ? 'Win' : 'Note'}</div>
              </div>
              <button className="del-btn" onClick={() => deleteLifeNote(note.id)} title="Delete">×</button>
            </div>
          ))}
        </div>

        <hr className="rule" />

        {/* Session log (read-only) */}
        <div className="detail-section">
          <div className="detail-section-title">Session Log</div>
          {data.conversations.length === 0 && <div className="empty-state">No sessions yet.</div>}
          {data.conversations.length > 0 && (
            <div style={{ borderTop: '2px solid #1A1A1A' }}>
              {[...data.conversations].reverse().map((conv) => (
                <div key={conv.id} className="adm-session-row">
                  <div style={{ fontSize: 12, color: '#CCC' }}>{conv.session_number}</div>
                  <div>
                    <div style={{ fontSize: 14, color: '#1A1A1A' }}>
                      {conv.attachment_text || conv.title || <span style={{ color: '#CCC' }}>Untitled</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#BBB', fontWeight: 300, marginTop: 2 }}>{formatDate(conv.created_at)}</div>
                    {!conv.is_complete && conv.title && (
                      <div style={{ fontSize: 10, color: '#9A6F1A', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', marginTop: 2 }}>In progress</div>
                    )}
                  </div>
                  <div style={{ textAlign: 'center', fontSize: 13, color: '#AAA' }}>
                    {conv.form?.charge_before != null ? `${conv.form.charge_before}/10` : '—'}
                  </div>
                  <div style={{ textAlign: 'center', fontSize: 13, color: '#AAA' }}>
                    {conv.form?.charge_after != null ? `${conv.form.charge_after}/10` : '—'}
                  </div>
                  <div style={{ textAlign: 'center', fontFamily: "'DM Serif Display',serif", fontSize: 18, color: '#A0785A' }}>
                    {conv.form?.charge_before != null && conv.form?.charge_after != null
                      ? `+${Math.max(0, conv.form.charge_before - conv.form.charge_after)}`
                      : '—'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// ── Main Admin Component ──────────────────────────────────────
export default function Admin() {
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem(ADMIN_KEY))
  const [view, setView] = useState('clients') // 'clients' | 'client'
  const [selectedClientId, setSelectedClientId] = useState(null)

  const signOut = () => {
    sessionStorage.removeItem(ADMIN_KEY)
    setAuthed(false)
  }

  if (!authed) return (
    <>
      <style>{S}</style>
      <LoginView onLogin={() => setAuthed(true)} />
    </>
  )

  return (
    <>
      <style>{S}</style>
      {view === 'clients' ? (
        <ClientsView
          onSelectClient={(id) => { setSelectedClientId(id); setView('client') }}
          onSignOut={signOut}
        />
      ) : (
        <ClientDetailView
          clientId={selectedClientId}
          onBack={() => setView('clients')}
        />
      )}
    </>
  )
}
