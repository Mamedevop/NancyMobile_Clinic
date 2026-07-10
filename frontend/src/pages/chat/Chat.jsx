import { useState, useEffect, useRef } from 'react'
import { FaComments, FaPaperPlane, FaUser } from 'react-icons/fa'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import api from '../../services/api'

export default function Chat() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [contacts, setContacts] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const pollRef = useRef(null)

  useEffect(() => {
    api.get('/chat/contacts').then(r => {
      if (r.data.success) setContacts(r.data.contacts)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selected) return
    loadMessages()
    pollRef.current = setInterval(loadMessages, 4000)
    return () => clearInterval(pollRef.current)
  }, [selected])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMessages = () => {
    api.get(`/chat/messages/${selected.id}`).then(r => {
      if (r.data.success) {
        setMessages(r.data.messages)
        // refresh unread counts
        setContacts(prev => prev.map(c => c.id === selected.id ? { ...c, unread: 0 } : c))
      }
    }).catch(() => {})
  }

  const send = async (e) => {
    e.preventDefault()
    if (!text.trim() || !selected) return
    setLoading(true)
    try {
      const r = await api.post('/chat/messages', { receiver_id: selected.id, content: text })
      if (r.data.success) {
        setMessages(prev => [...prev, r.data.message])
        setText('')
      }
    } catch { }
    setLoading(false)
  }

  const roleColor = (role) => {
    if (role === 'admin') return '#4361ee'
    if (role === 'technician') return '#f8961e'
    if (role === 'delivery_person') return '#28a745'
    return '#6c757d'
  }

  const roleLabel = (role) => {
    if (role === 'admin') return 'Admin'
    if (role === 'technician') return t('technician')
    if (role === 'delivery_person') return t('deliveryPerson') || 'Delivery'
    return t('customer')
  }

  return (
    <div className="page" style={{ padding: 0, height: 'calc(100vh - 80px)', display: 'flex', overflow: 'hidden' }}>
      {/* Contacts sidebar */}
      <div style={{ width: 280, borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column', background: 'white' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FaComments style={{ color: 'var(--primary)' }} /> {t('messages') || 'Messages'}
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {contacts.length === 0 && (
            <p style={{ color: 'var(--gray)', textAlign: 'center', padding: 20, fontSize: 13 }}>No contacts yet.</p>
          )}
          {contacts.map(c => (
            <div key={c.id} onClick={() => setSelected(c)}
              style={{
                padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                background: selected?.id === c.id ? 'rgba(67,97,238,0.08)' : 'transparent',
                borderLeft: selected?.id === c.id ? '3px solid var(--primary)' : '3px solid transparent',
                transition: 'all 0.15s'
              }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: roleColor(c.role), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                {c.first_name?.[0]}{c.last_name?.[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.first_name} {c.last_name}
                </div>
                <div style={{ fontSize: 11, color: roleColor(c.role), fontWeight: 500 }}>{roleLabel(c.role)}</div>
              </div>
              {parseInt(c.unread) > 0 && (
                <span style={{ background: 'var(--danger)', color: 'white', borderRadius: 10, padding: '2px 7px', fontSize: 11, fontWeight: 700 }}>
                  {c.unread}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f8f9fa' }}>
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--gray)' }}>
            <FaComments style={{ fontSize: 56, marginBottom: 16, opacity: 0.3 }} />
            <p style={{ fontSize: 15 }}>Select a contact to start chatting</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ padding: '12px 20px', background: 'white', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: roleColor(selected.role), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>
                {selected.first_name?.[0]}{selected.last_name?.[0]}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{selected.first_name} {selected.last_name}</div>
                <div style={{ fontSize: 12, color: roleColor(selected.role) }}>{roleLabel(selected.role)}</div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {messages.map(m => {
                const isMine = m.sender_id === user?.id
                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '65%', padding: '8px 14px', borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isMine ? 'var(--primary)' : 'white',
                      color: isMine ? 'white' : 'var(--dark)',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.08)', fontSize: 14
                    }}>
                      <p style={{ margin: 0 }}>{m.content}</p>
                      <p style={{ margin: '4px 0 0', fontSize: 10, opacity: 0.7, textAlign: 'right' }}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={send} style={{ padding: '12px 16px', background: 'white', borderTop: '1px solid #eee', display: 'flex', gap: 10 }}>
              <input
                className="form-control"
                placeholder="Type a message..."
                value={text}
                onChange={e => setText(e.target.value)}
                style={{ flex: 1 }}
                autoFocus
              />
              <button className="btn" type="submit" disabled={loading || !text.trim()} style={{ padding: '8px 16px' }}>
                <FaPaperPlane />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
