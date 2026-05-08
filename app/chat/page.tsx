'use client'
import { useEffect, useState } from 'react'
import { createClient, supabaseConfigured } from '@/lib/supabase'
import LogoHeader from '@/components/LogoHeader'
import BottomNav from '@/components/BottomNav'
import { Send, Shield } from 'lucide-react'
import type { ChatMessage } from '@/lib/types'

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })
}

function formatDay(iso: string) {
  const d = new Date(iso), now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return 'Vandaag'
  if (diff === 1) return 'Gisteren'
  return d.toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })
}

function sameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

const DEMO: ChatMessage[] = [
  { id: '1', user_name: 'CREW', is_crew: true,  content: '👋 Welkom in het groepsgesprek! Vragen? Stel ze hier.', created_at: new Date(Date.now() - 3600*8000).toISOString(), user_id: null },
  { id: '2', user_name: 'Lore D.', is_crew: false, content: 'Wanneer is de volgende repetitie?', created_at: new Date(Date.now() - 3600*4000).toISOString(), user_id: null },
  { id: '3', user_name: 'CREW', is_crew: true,  content: 'Vrijdag 19u in het lokaal. Breng je stokken mee 🥁', created_at: new Date(Date.now() - 3600*3800).toISOString(), user_id: null },
]

export default function ChatPage() {
  const supabase = createClient()
  const [messages,  setMessages]  = useState<ChatMessage[]>(DEMO)
  const [input,     setInput]     = useState('')
  const [sending,   setSending]   = useState(false)
  const [userName,  setUserName]  = useState('Jij')
  const [isCrew,    setIsCrew]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const bottomRef = { current: null as HTMLDivElement | null }

  useEffect(() => {
    if (!supabaseConfigured) return
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserName(data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Lid')
        setIsCrew(data.user.user_metadata?.is_crew === true)
      }
    })
    setLoading(true)
    supabase.from('exercise_messages').select('*')
      .is('exercise_id', null).order('created_at')
      .then(({ data }) => { if (data) setMessages(data); setLoading(false) })

    const channel = supabase.channel('chat-general')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'exercise_messages', filter: 'exercise_id=is.null' },
        p => setMessages(prev => [...prev, p.new as ChatMessage]))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setSending(true)
    if (!supabaseConfigured) {
      setMessages(p => [...p, { id: crypto.randomUUID(), content: text, user_name: userName, is_crew: isCrew, user_id: null, created_at: new Date().toISOString() }])
    } else {
      await supabase.from('exercise_messages').insert({ content: text, user_name: userName, is_crew: isCrew, exercise_id: null })
    }
    setSending(false)
  }

  const isOwn = (m: ChatMessage) => m.user_name === userName

  return (
    <div className="min-h-screen flex flex-col pb-16" style={{ background: 'var(--bg)' }}>
      <LogoHeader />

      <div className="px-5 pt-2 pb-3 flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Chat</h1>
          <p className="text-sm mt-0.5" style={{ color: '#4a6a8a' }}>Leden & CREW</p>
        </div>
        {isCrew && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: '#0a1e35', border: '1px solid var(--accent)' }}>
            <Shield size={12} style={{ color: 'var(--accent)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>CREW</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 space-y-1 pb-4">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          </div>
        )}

        {messages.map((m, i) => {
          const own     = isOwn(m)
          const prev    = messages[i - 1]
          const showDay = !prev || !sameDay(prev.created_at, m.created_at)
          const showAv  = !own && (!prev || prev.user_name !== m.user_name || showDay)

          return (
            <div key={m.id}>
              {showDay && (
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px" style={{ background: '#1b2d47' }} />
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#0d1626', color: '#4a6a8a', border: '1px solid #1b2d47' }}>
                    {formatDay(m.created_at)}
                  </span>
                  <div className="flex-1 h-px" style={{ background: '#1b2d47' }} />
                </div>
              )}

              <div className={`flex gap-2 ${own ? 'justify-end' : 'justify-start'}`}>
                {!own && (
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-auto mb-0.5 ${showAv ? '' : 'opacity-0'}`}
                    style={{ background: m.is_crew ? '#1a2d4a' : '#1b2d47', color: m.is_crew ? 'var(--accent)' : '#7a9ab8' }}>
                    {initials(m.user_name)}
                  </div>
                )}

                <div className={`max-w-[72%] flex flex-col ${own ? 'items-end' : 'items-start'}`}>
                  {!own && showAv && (
                    <span className="text-xs font-semibold mb-0.5 ml-1" style={{ color: m.is_crew ? 'var(--accent)' : '#7a9ab8' }}>
                      {m.user_name}{m.is_crew ? ' 🔑' : ''}
                    </span>
                  )}
                  <div className="flex items-end gap-1.5">
                    <div className="px-3.5 py-2 rounded-2xl text-sm leading-relaxed"
                      style={own
                        ? { background: 'var(--accent)', color: 'white', borderBottomRightRadius: 4 }
                        : m.is_crew
                          ? { background: '#0f2040', color: '#e8edf5', border: '1px solid #1b3a5a', borderBottomLeftRadius: 4 }
                          : { background: 'var(--surface)', color: '#e8edf5', border: '1px solid var(--border)', borderBottomLeftRadius: 4 }
                      }>
                      {m.content}
                    </div>
                    <span className="text-[10px] flex-shrink-0 mb-0.5" style={{ color: '#3a5a7a' }}>
                      {formatTime(m.created_at)}
                    </span>
                  </div>
                </div>

                {own && (
                  <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-auto mb-0.5"
                    style={{ background: 'var(--accent)', color: 'white', opacity: 0.7 }}>
                    {initials(userName)}
                  </div>
                )}
              </div>
            </div>
          )
        })}
        <div ref={el => { bottomRef.current = el }} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 pb-20 pt-2" style={{ background: 'var(--bg)' }}>
        <div className="flex items-end gap-2 rounded-2xl px-4 py-3"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <textarea
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder={`Schrijf een bericht${isCrew ? ' (CREW)' : ''}…`}
            className="flex-1 bg-transparent text-sm text-white outline-none resize-none placeholder:text-gray-600"
            style={{ maxHeight: 100 }}
          />
          <button onClick={send} disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition"
            style={{ background: input.trim() && !sending ? 'var(--accent)' : '#1b2d47' }}>
            <Send size={15} color="white" />
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
