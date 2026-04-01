import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const styles = `
  .chat-wrap {
    height: 100vh;
    height: 100dvh;
    display: flex;
    flex-direction: column;
    background: #FAF9F7;
    overflow: hidden;
  }

  /* ── Header ── */
  .chat-header {
    background: #FFFFFF;
    border-bottom: 1px solid #ECEAE6;
    padding: 14px 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    flex-shrink: 0;
    position: relative;
  }

  @media (min-width: 600px) {
    .chat-header { padding: 14px 32px; }
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    background: none;
    border: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    color: #AAA;
    cursor: pointer;
    padding: 4px 0;
    flex-shrink: 0;
    transition: color 0.15s;
  }

  .back-btn:hover { color: #555; }

  .chat-header-title {
    flex: 1;
    text-align: center;
  }

  .chat-header-eyebrow {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #CCC;
    margin-bottom: 1px;
  }

  .chat-header-name {
    font-family: 'DM Serif Display', serif;
    font-size: 16px;
    font-weight: 400;
    color: #1A1A1A;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 220px;
    margin: 0 auto;
  }

  /* ── Messages ── */
  .messages-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 32px 0 16px;
    -webkit-overflow-scrolling: touch;
  }

  .messages-inner {
    width: 100%;
    max-width: 640px;
    margin: 0 auto;
    padding: 0 20px;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  @media (min-width: 600px) {
    .messages-inner { padding: 0 32px; }
  }

  /* ── Message blocks ── */
  .msg {
    padding: 18px 0;
    border-bottom: 1px solid #F2EFEB;
  }

  .msg:last-child {
    border-bottom: none;
  }

  .msg-role {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .msg-role-user { color: #A0785A; }
  .msg-role-assistant { color: #BBB; }

  .msg-content {
    font-size: 15px;
    line-height: 1.7;
    color: #1A1A1A;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .msg-content-assistant {
    font-weight: 400;
  }

  .msg-content-user {
    font-weight: 300;
    color: #444;
  }

  /* Streaming cursor */
  .cursor {
    display: inline-block;
    width: 2px;
    height: 1em;
    background: #A0785A;
    margin-left: 2px;
    vertical-align: text-bottom;
    animation: blink 0.9s step-end infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }

  /* Empty state */
  .chat-empty {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 48px 0 32px;
    gap: 8px;
  }

  .chat-empty-headline {
    font-family: 'DM Serif Display', serif;
    font-size: 22px;
    font-weight: 400;
    color: #1A1A1A;
    line-height: 1.3;
  }

  .chat-empty-sub {
    font-size: 14px;
    color: #AAA;
    font-weight: 300;
    line-height: 1.6;
    max-width: 380px;
  }

  /* ── Input area ── */
  .input-area {
    border-top: 1px solid #ECEAE6;
    background: #FFFFFF;
    padding: 16px 20px;
    padding-bottom: calc(16px + env(safe-area-inset-bottom));
    flex-shrink: 0;
  }

  @media (min-width: 600px) {
    .input-area { padding: 16px 32px; padding-bottom: calc(16px + env(safe-area-inset-bottom)); }
  }

  .input-inner {
    max-width: 640px;
    margin: 0 auto;
    display: flex;
    gap: 10px;
    align-items: flex-end;
  }

  .input-field {
    flex: 1;
    padding: 11px 14px;
    background: #FAF9F7;
    border: 1px solid #DEDAD4;
    border-radius: 3px;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    color: #1A1A1A;
    outline: none;
    resize: none;
    line-height: 1.5;
    max-height: 160px;
    overflow-y: auto;
    transition: border-color 0.15s;
    -webkit-appearance: none;
  }

  .input-field:focus {
    border-color: #A0785A;
    background: #FFFFFF;
  }

  .input-field::placeholder { color: #CCC; }

  .send-btn {
    padding: 11px 18px;
    background: #1A1A1A;
    color: #FAF9F7;
    border: none;
    border-radius: 3px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.15s;
    line-height: 1.5;
    letter-spacing: 0.01em;
  }

  .send-btn:hover:not(:disabled) { background: #333; }

  .send-btn:disabled {
    opacity: 0.35;
    cursor: default;
  }

  .input-hint {
    font-size: 11px;
    color: #CCC;
    margin-top: 8px;
    text-align: center;
    font-weight: 300;
  }

  /* Error banner */
  .error-banner {
    margin: 0 20px 12px;
    padding: 10px 14px;
    background: #FDF2F2;
    border: 1px solid #EAC8C8;
    border-radius: 3px;
    font-size: 13px;
    color: #C0392B;
    max-width: 640px;
    margin-left: auto;
    margin-right: auto;
  }
`

export default function Chat({ session }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [messages, setMessages] = useState([])
  const [conversation, setConversation] = useState(null)
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const scrollRef = useRef(null)

  // Load conversation and messages on mount
  useEffect(() => {
    loadData()
  }, [id])

  // Scroll to bottom whenever messages or streaming content changes
  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadData = async () => {
    setLoading(true)

    const [convRes, msgRes] = await Promise.all([
      supabase.from('conversations').select('*').eq('id', id).single(),
      supabase.from('messages').select('*').eq('conversation_id', id).order('created_at', { ascending: true }),
    ])

    if (convRes.error) {
      navigate('/sessions')
      return
    }

    setConversation(convRes.data)
    setMessages(msgRes.data || [])
    setLoading(false)
  }

  const autoResize = (el) => {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  const handleInput = (e) => {
    setInput(e.target.value)
    autoResize(e.target)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const sendMessage = async () => {
    const content = input.trim()
    if (!content || isStreaming) return

    setInput('')
    setError(null)
    setIsStreaming(true)
    setStreamingContent('')

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }

    // Persist user message to Supabase
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

    // Update conversation title (use first user message, truncated)
    if (messages.length === 0) {
      const title = content.length > 80 ? content.slice(0, 77) + '…' : content
      await supabase.from('conversations')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', id)
      setConversation(prev => ({ ...prev, title }))
    } else {
      await supabase.from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', id)
    }

    // Build API message array (role + content only — no IDs or timestamps)
    const apiMessages = updatedMessages.map(m => ({
      role: m.role,
      content: m.content,
    }))

    // Call serverless function
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: apiMessages }),
      })

      if (!response.ok) {
        throw new Error(`API error ${response.status}`)
      }

      // Stream response
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

      // Persist completed assistant message
      const { data: assistantMsg } = await supabase
        .from('messages')
        .insert({ conversation_id: id, role: 'assistant', content: fullContent })
        .select()
        .single()

      setMessages(prev => [...prev, assistantMsg])
      setStreamingContent('')
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Check your connection and try again.')
    } finally {
      setIsStreaming(false)
      // Refocus input on desktop
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const sessionTitle = conversation?.title || 'New session'

  return (
    <>
      <style>{styles}</style>
      <div className="chat-wrap">

        {/* Header */}
        <header className="chat-header">
          <button className="back-btn" onClick={() => navigate('/sessions')}>
            ‹ Sessions
          </button>
          <div className="chat-header-title">
            <div className="chat-header-eyebrow">Release Method</div>
            <div className="chat-header-name" title={sessionTitle}>
              {loading ? '—' : sessionTitle}
            </div>
          </div>
          {/* Spacer to balance the back button */}
          <div style={{ width: 72, flexShrink: 0 }} />
        </header>

        {/* Message list */}
        <div className="messages-scroll" ref={scrollRef}>
          <div className="messages-inner">
            {!loading && messages.length === 0 && !isStreaming && (
              <div className="chat-empty">
                <div className="chat-empty-headline">What's on your mind?</div>
                <div className="chat-empty-sub">
                  Share what's weighing on you. You don't need to frame it perfectly — just start talking.
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

            {/* Streaming message */}
            {isStreaming && (
              <div className="msg">
                <div className="msg-role msg-role-assistant">Facilitator</div>
                <div className="msg-content msg-content-assistant">
                  {streamingContent}
                  <span className="cursor" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="error-banner">{error}</div>
        )}

        {/* Input */}
        <div className="input-area">
          <div className="input-inner">
            <textarea
              ref={inputRef}
              className="input-field"
              rows={1}
              placeholder={isStreaming ? 'Waiting for response…' : 'Type your response…'}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              disabled={isStreaming || loading}
            />
            <button
              className="send-btn"
              onClick={sendMessage}
              disabled={!input.trim() || isStreaming || loading}
            >
              Send
            </button>
          </div>
          <div className="input-hint">Enter to send · Shift+Enter for new line</div>
        </div>

      </div>
    </>
  )
}
