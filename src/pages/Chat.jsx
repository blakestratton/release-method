import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// Detect the phrase the facilitator uses to trigger the post-session form
const FORM_TRIGGER = 'post-session form'

// Extract charge ratings from the conversation transcript
function extractCharges(messages) {
  let before = null
  let after = null

  // Scan assistant messages in reverse for the closing delta statement
  // e.g. "Started at 8, now at 3."
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (msg.role === 'assistant') {
      const match = msg.content.match(/[Ss]tarted at (\d+),?\s*now at (\d+)/i)
      if (match) {
        before = parseInt(match[1])
        after = parseInt(match[2])
        break
      }
    }
  }

  // Fallback: find the first single-digit user response (initial charge rating)
  if (before === null) {
    for (const msg of messages) {
      if (msg.role === 'user') {
        const trimmed = msg.content.trim()
        const num = parseInt(trimmed)
        if (!isNaN(num) && num >= 0 && num <= 10 && trimmed.length <= 2) {
          before = num
          break
        }
      }
    }
  }

  return { before, after }
}

const styles = `
  .chat-wrap {
    height: 100vh; height: 100dvh;
    display: flex; flex-direction: column;
    background: #FAF9F7; overflow: hidden; position: relative;
  }

  /* Header */
  .chat-header {
    background: #fff; border-bottom: 1px solid #ECEAE6;
    padding: 14px 20px; display: flex; align-items: center;
    gap: 14px; flex-shrink: 0;
  }
  @media(min-width:600px){ .chat-header { padding: 14px 32px; } }

  .back-btn {
    display: flex; align-items: center; gap: 5px;
    background: none; border: none; font-family: 'DM Sans',sans-serif;
    font-size: 13px; color: #AAA; cursor: pointer; padding: 4px 0;
    flex-shrink: 0; transition: color .15s;
  }
  .back-btn:hover { color: #555; }

  .chat-header-title { flex: 1; text-align: center; }
  .chat-header-eyebrow { font-size: 10px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: #CCC; margin-bottom: 1px; }
  .chat-header-name {
    font-family: 'DM Serif Display',serif; font-size: 16px; font-weight: 400; color: #1A1A1A;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    max-width: 220px; margin: 0 auto;
  }
  .session-num-label { font-size: 11px; color: #CCC; font-weight: 300; margin-top: 1px; }

  /* Messages */
  .messages-scroll { flex: 1; overflow-y: auto; padding: 32px 0 16px; -webkit-overflow-scrolling: touch; }
  .messages-inner { width: 100%; max-width: 640px; margin: 0 auto; padding: 0 20px; display: flex; flex-direction: column; }
  @media(min-width:600px){ .messages-inner { padding: 0 32px; } }

  .msg { padding: 18px 0; border-bottom: 1px solid #F2EFEB; }
  .msg:last-child { border-bottom: none; }
  .msg-role { font-size: 10px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; margin-bottom: 8px; }
  .msg-role-user { color: #A0785A; }
  .msg-role-assistant { color: #BBB; }
  .msg-content { font-size: 15px; line-height: 1.7; color: #1A1A1A; white-space: pre-wrap; word-break: break-word; }
  .msg-content-user { font-weight: 300; color: #444; }
  .msg-content-assistant { font-weight: 400; }

  .cursor {
    display: inline-block; width: 2px; height: 1em;
    background: #A0785A; margin-left: 2px; vertical-align: text-bottom;
    animation: blink .9s step-end infinite;
  }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

  /* Empty state */
  .chat-empty { padding: 48px 0 32px; }
  .chat-empty-headline { font-family: 'DM Serif Display',serif; font-size: 22px; color: #1A1A1A; margin-bottom: 8px; }
  .chat-empty-sub { font-size: 14px; color: #AAA; font-weight: 300; line-height: 1.6; max-width: 380px; }
  .chat-empty-sub a { color: #A0785A; text-decoration: none; }
  .chat-empty-sub a:hover { text-decoration: underline; }

  /* Input */
  .input-area {
    border-top: 1px solid #ECEAE6; background: #fff;
    padding: 16px 20px; padding-bottom: calc(16px + env(safe-area-inset-bottom)); flex-shrink: 0;
  }
  @media(min-width:600px){ .input-area { padding: 16px 32px; padding-bottom: calc(16px + env(safe-area-inset-bottom)); } }
  .input-inner { max-width: 640px; margin: 0 auto; display: flex; gap: 10px; align-items: flex-end; }
  .input-field {
    flex: 1; padding: 11px 14px; background: #FAF9F7; border: 1px solid #DEDAD4;
    border-radius: 3px; font-family: 'DM Sans',sans-serif; font-size: 15px; color: #1A1A1A;
    outline: none; resize: none; line-height: 1.5; max-height: 160px; overflow-y: auto;
    transition: border-color .15s; -webkit-appearance: none;
  }
  .input-field:focus { border-color: #A0785A; background: #fff; }
  .input-field::placeholder { color: #CCC; }
  .send-btn {
    padding: 11px 18px; background: #1A1A1A; color: #FAF9F7; border: none;
    border-radius: 3px; font-family: 'DM Sans',sans-serif; font-size: 13px;
    font-weight: 500; cursor: pointer; flex-shrink: 0; transition: background .15s; letter-spacing: .01em;
  }
  .send-btn:hover:not(:disabled) { background: #333; }
  .send-btn:disabled { opacity: .35; cursor: default; }
  .input-hint { font-size: 11px; color: #CCC; margin-top: 8px; text-align: center; font-weight: 300; }

  /* Error */
  .error-banner {
    margin: 0 auto 12px; padding: 10px 14px;
    background: #FDF2F2; border: 1px solid #EAC8C8;
    border-radius: 3px; font-size: 13px; color: #C0392B;
    max-width: 640px; width: calc(100% - 40px);
  }

  /* Post-session form overlay */
  .form-overlay {
    position: absolute; bottom: 0; left: 0; right: 0; z-index: 50;
    background: #fff; border-top: 2px solid #1A1A1A;
    box-shadow: 0 -8px 32px rgba(0,0,0,.08);
    transform: translateY(100%); transition: transform .35s cubic-bezier(.16,1,.3,1);
    padding: 28px 24px 32px; padding-bottom: calc(32px + env(safe-area-inset-bottom));
  }
  .form-overlay.visible { transform: translateY(0); }
  @media(min-width:600px){ .form-overlay { padding: 28px 48px 32px; padding-bottom: calc(32px + env(safe-area-inset-bottom)); } }

  .form-inner { max-width: 640px; margin: 0 auto; }
  .form-headline { font-family: 'DM Serif Display',serif; font-size: 20px; color: #1A1A1A; margin-bottom: 4px; }
  .form-sub { font-size: 13px; color: #AAA; font-weight: 300; margin-bottom: 24px; }

  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  .form-field { display: flex; flex-direction: column; gap: 6px; }
  .form-label { font-size: 10px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: #AAA; }
  .form-label span { color: #A0785A; font-size: 9px; margin-left: 4px; }
  .form-number {
    padding: 10px 12px; background: #FAF9F7; border: 1px solid #DEDAD4;
    border-radius: 3px; font-family: 'DM Sans',sans-serif; font-size: 18px;
    font-weight: 500; color: #1A1A1A; outline: none; width: 100%;
    transition: border-color .15s; -webkit-appearance: none;
  }
  .form-number:focus { border-color: #A0785A; background: #fff; }
  .form-textarea {
    padding: 10px 12px; background: #FAF9F7; border: 1px solid #DEDAD4;
    border-radius: 3px; font-family: 'DM Sans',sans-serif; font-size: 14px;
    color: #1A1A1A; outline: none; resize: none; line-height: 1.5;
    transition: border-color .15s; width: 100%;
  }
  .form-textarea:focus { border-color: #A0785A; background: #fff; }
  .form-textarea::placeholder { color: #CCC; }

  .form-actions { display: flex; gap: 10px; margin-top: 20px; }
  .form-submit {
    padding: 12px 24px; background: #1A1A1A; color: #FAF9F7; border: none;
    border-radius: 3px; font-family: 'DM Sans',sans-serif; font-size: 14px;
    font-weight: 500; cursor: pointer; transition: background .15s;
  }
  .form-submit:hover:not(:disabled) { background: #333; }
  .form-submit:disabled { opacity: .4; cursor: default; }
  .form-skip {
    padding: 12px 16px; background: none; color: #AAA; border: 1px solid #ECEAE6;
    border-radius: 3px; font-family: 'DM Sans',sans-serif; font-size: 14px;
    cursor: pointer; transition: border-color .15s, color .15s;
  }
  .form-skip:hover { border-color: #BBB; color: #666; }
`

export default function Chat({ session }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [messages, setMessages] = useState([])
  const [conversation, setConversation] = useState(null)
  const [sessionNumber, setSessionNumber] = useState(null)
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  // Post-session form state
  const [showForm, setShowForm] = useState(false)
  const [formBefore, setFormBefore] = useState('')
  const [formAfter, setFormAfter] = useState('')
  const [formInsights, setFormInsights] = useState('')
  const [submittingForm, setSubmittingForm] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { loadData() }, [id])
  useEffect(() => { scrollToBottom() }, [messages, streamingContent])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadData = async () => {
    setLoading(true)

    const [convRes, msgRes, allConvsRes, formRes] = await Promise.all([
      supabase.from('conversations').select('*').eq('id', id).single(),
      supabase.from('messages').select('*').eq('conversation_id', id).order('created_at', { ascending: true }),
      supabase.from('conversations').select('id, created_at').order('created_at', { ascending: true }),
      supabase.from('post_session_forms').select('id').eq('conversation_id', id).maybeSingle(),
    ])

    if (convRes.error) { navigate('/'); return }

    setConversation(convRes.data)
    const msgs = msgRes.data || []
    setMessages(msgs)

    // Calculate session number
    const allConvs = allConvsRes.data || []
    const idx = allConvs.findIndex(c => c.id === id)
    setSessionNumber(idx >= 0 ? idx + 1 : null)

    // If form already submitted for this session, mark it
    if (formRes.data) setFormSubmitted(true)

    setLoading(false)
  }

  const autoResize = (el) => {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  const triggerPostSessionForm = (allMessages) => {
    const { before, after } = extractCharges(allMessages)
    setFormBefore(before != null ? String(before) : '')
    setFormAfter(after != null ? String(after) : '')
    setFormInsights('')
    setTimeout(() => setShowForm(true), 1500)
  }

  const sendMessage = async () => {
    const content = input.trim()
    if (!content || isStreaming) return

    setInput('')
    setError(null)
    setIsStreaming(true)
    setStreamingContent('')
    if (inputRef.current) inputRef.current.style.height = 'auto'

    // Save user message
    const { data: userMsg, error: insertError } = await supabase
      .from('messages')
      .insert({ conversation_id: id, role: 'user', content })
      .select()
      .single()

    if (insertError) {
      setError('Failed to save message. Please try again.')
      setIsStreaming(false)
      return
    }

    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)

    // Set conversation title from first message
    if (messages.length === 0) {
      const title = content.length > 80 ? content.slice(0, 77) + '…' : content
      await supabase.from('conversations').update({ title, updated_at: new Date().toISOString() }).eq('id', id)
      setConversation(prev => ({ ...prev, title }))
    } else {
      await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', id)
    }

    const apiMessages = updatedMessages.map(m => ({ role: m.role, content: m.content }))

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: apiMessages }),
      })

      if (!response.ok) throw new Error(`API error ${response.status}`)

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullContent += chunk
        setStreamingContent(fullContent)
      }

      // Save assistant message
      const { data: assistantMsg } = await supabase
        .from('messages')
        .insert({ conversation_id: id, role: 'assistant', content: fullContent })
        .select()
        .single()

      const finalMessages = [...updatedMessages, assistantMsg]
      setMessages(finalMessages)
      setStreamingContent('')

      // Trigger post-session form if facilitator signals it
      if (fullContent.toLowerCase().includes(FORM_TRIGGER) && !formSubmitted) {
        triggerPostSessionForm(finalMessages)
      }
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Check your connection and try again.')
    } finally {
      setIsStreaming(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const submitForm = async () => {
    setSubmittingForm(true)
    const before = parseInt(formBefore)
    const after = parseInt(formAfter)
    const attachmentText = conversation?.title || null

    // Save post-session form
    await supabase.from('post_session_forms').insert({
      conversation_id: id,
      user_id: session.user.id,
      charge_before: isNaN(before) ? null : before,
      charge_after: isNaN(after) ? null : after,
      insights: formInsights.trim() || null,
    })

    // Update conversation with charge data and attachment text
    await supabase.from('conversations').update({
      charge_before: isNaN(before) ? null : before,
      charge_after: isNaN(after) ? null : after,
      attachment_text: attachmentText,
    }).eq('id', id)

    setFormSubmitted(true)
    setShowForm(false)
    setSubmittingForm(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const sessionTitle = conversation?.title || 'New session'

  return (
    <>
      <style>{styles}</style>
      <div className="chat-wrap">

        {/* Header */}
        <header className="chat-header">
          <button className="back-btn" onClick={() => navigate('/')}>‹ Dashboard</button>
          <div className="chat-header-title">
            <div className="chat-header-eyebrow">Release Method</div>
            <div className="chat-header-name" title={sessionTitle}>
              {loading ? '—' : sessionTitle}
            </div>
            {sessionNumber && (
              <div className="session-num-label">Session {sessionNumber}</div>
            )}
          </div>
          <div style={{ width: 80, flexShrink: 0 }} />
        </header>

        {/* Messages */}
        <div className="messages-scroll">
          <div className="messages-inner">
            {!loading && messages.length === 0 && !isStreaming && (
              <div className="chat-empty">
                <div className="chat-empty-headline">What's on your mind?</div>
                <div className="chat-empty-sub">
                  Share what's weighing on you. You can{' '}
                  <a href="/" onClick={e => { e.preventDefault(); navigate('/') }}>
                    grab an attachment from your dashboard
                  </a>{' '}
                  to work on, or just start talking.
                </div>
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} className="msg">
                <div className={`msg-role ${msg.role === 'user' ? 'msg-role-user' : 'msg-role-assistant'}`}>
                  {msg.role === 'user' ? 'You' : 'Facilitator'}
                </div>
                <div className={`msg-content ${msg.role === 'user' ? 'msg-content-user' : 'msg-content-assistant'}`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {isStreaming && (
              <div className="msg">
                <div className="msg-role msg-role-assistant">Facilitator</div>
                <div className="msg-content msg-content-assistant">
                  {streamingContent}<span className="cursor" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {/* Input */}
        <div className="input-area">
          <div className="input-inner">
            <textarea
              ref={inputRef}
              className="input-field"
              rows={1}
              placeholder={isStreaming ? 'Waiting for response…' : 'Type your response…'}
              value={input}
              onChange={e => { setInput(e.target.value); autoResize(e.target) }}
              onKeyDown={handleKeyDown}
              disabled={isStreaming || loading || showForm}
            />
            <button
              className="send-btn"
              onClick={sendMessage}
              disabled={!input.trim() || isStreaming || loading || showForm}
            >Send</button>
          </div>
          <div className="input-hint">Enter to send · Shift+Enter for new line</div>
        </div>

        {/* Post-session form slide-up */}
        <div className={`form-overlay ${showForm ? 'visible' : ''}`}>
          <div className="form-inner">
            <div className="form-headline">Session complete.</div>
            <div className="form-sub">
              Confirm the charge ratings the facilitator recorded, and add any insights you want to keep.
            </div>

            <div className="form-row">
              <div className="form-field">
                <label className="form-label">
                  Charge before <span>(0–10)</span>
                </label>
                <input
                  type="number"
                  className="form-number"
                  min={0} max={10}
                  value={formBefore}
                  onChange={e => setFormBefore(e.target.value)}
                  placeholder="—"
                />
              </div>
              <div className="form-field">
                <label className="form-label">
                  Charge after <span>(0–10)</span>
                </label>
                <input
                  type="number"
                  className="form-number"
                  min={0} max={10}
                  value={formAfter}
                  onChange={e => setFormAfter(e.target.value)}
                  placeholder="—"
                />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Insight to record <span>(optional)</span></label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="What shifted? What do you want to remember from this session?"
                value={formInsights}
                onChange={e => setFormInsights(e.target.value)}
              />
            </div>

            <div className="form-actions">
              <button className="form-submit" onClick={submitForm} disabled={submittingForm}>
                {submittingForm ? 'Saving…' : 'Save & complete session'}
              </button>
              <button className="form-skip" onClick={() => setShowForm(false)}>
                Skip for now
              </button>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
