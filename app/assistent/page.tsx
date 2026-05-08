'use client'
import { useState, useRef, useEffect } from 'react'
import BottomNav from '@/components/BottomNav'
import LogoHeader from '@/components/LogoHeader'
import { Send, Loader2 } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  'Wat is een paradiddle?',
  'Leg 6/8 maatsoort uit',
  'Hoe oefen ik single stroke roll?',
  'Wat betekent ff in een partituur?',
  'Tips voor een optreden',
]

export default function AssistentPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [noKey,    setNoKey]    = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text = input.trim()) {
    if (!text || loading) return
    const next: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })

      if (res.status === 503) { setNoKey(true); setLoading(false); return }

      const reader  = res.body!.getReader()
      const decoder = new TextDecoder()
      let reply = ''

      setMessages(m => [...m, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        reply += decoder.decode(value, { stream: true })
        setMessages(m => {
          const copy = [...m]
          copy[copy.length - 1] = { role: 'assistant', content: reply }
          return copy
        })
      }
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: '⚠️ Verbindingsfout. Probeer opnieuw.' }])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className="min-h-screen flex flex-col pb-16" style={{ background: 'var(--bg)' }}>
      <LogoHeader />

      <div className="px-5 pt-2 pb-3 flex-shrink-0">
        <h1 className="text-2xl font-bold text-white">JEF-Coach</h1>
        <p className="text-sm mt-0.5" style={{ color: '#4a6a8a' }}>Stel een muziekvraag</p>
      </div>

      {/* No API key banner */}
      {noKey && (
        <div className="mx-5 mb-3 p-4 rounded-2xl text-sm flex-shrink-0" style={{ background: '#1a0d0d', border: '1px solid #3a1515', color: '#f87171' }}>
          <strong>API sleutel ontbreekt.</strong> Voeg <code className="text-white">ANTHROPIC_API_KEY=…</code> toe aan <code className="text-white">.env.local</code> en herstart de server.
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 space-y-3 pb-4">
        {messages.length === 0 && !loading && (
          <div className="pt-2">
            <div className="p-4 rounded-2xl mb-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-sm text-white font-semibold mb-1">👋 Hoi! Ik ben JEF-Coach.</p>
              <p className="text-sm" style={{ color: '#4a6a8a' }}>
                Stel me een vraag over muziektheorie, rudimenten, partituren lezen of techniek.
              </p>
            </div>
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#3a5a7a' }}>Suggesties</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)}
                  className="text-sm px-3 py-1.5 rounded-full transition hover:opacity-80"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: '#a0b8cc' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
              style={m.role === 'user'
                ? { background: 'var(--accent)', color: 'white', borderBottomRightRadius: 6 }
                : { background: 'var(--surface)', border: '1px solid var(--border)', color: '#e8edf5', borderBottomLeftRadius: 6 }
              }>
              {m.content || (loading && i === messages.length - 1
                ? <span className="opacity-50">●●●</span>
                : ''
              )}
            </div>
          </div>
        ))}

        {loading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <Loader2 size={16} className="animate-spin" style={{ color: 'var(--accent)' }} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-5 pb-20 pt-2" style={{ background: 'var(--bg)' }}>
        <div className="flex items-end gap-2 rounded-2xl px-4 py-3"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Stel een muziekvraag…"
            className="flex-1 bg-transparent text-sm text-white outline-none resize-none placeholder:text-gray-600"
            style={{ maxHeight: 120 }}
          />
          <button onClick={() => send()} disabled={!input.trim() || loading}
            className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition"
            style={{ background: input.trim() && !loading ? 'var(--accent)' : 'var(--border)' }}>
            <Send size={14} color="white" />
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
