'use client'
import { useState, useRef, useEffect } from 'react'
import { Bot, X, Send, Loader2, Sparkles } from 'lucide-react'

interface Message { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  'Wat is een paradiddle?',
  'Leg 6/8 maatsoort uit',
  'Hoe oefen ik single stroke roll?',
  'Wat betekent ff in een partituur?',
]

export default function FloatingAI() {
  const [open,     setOpen]     = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [noKey,    setNoKey]    = useState(false)
  const bottomRef  = useRef<HTMLDivElement>(null)

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
        setMessages(m => { const c = [...m]; c[c.length - 1] = { role: 'assistant', content: reply }; return c })
      }
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: '⚠️ Verbindingsfout. Probeer opnieuw.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Bubble */}
      <button
        onClick={() => setOpen(v => !v)}
        className="ai-bubble fixed z-50 flex items-center justify-center rounded-full shadow-xl"
        style={{
          top: 16, right: 16,
          width: 50, height: 50,
          background: 'linear-gradient(135deg, #50B4E4, #2a7fb8)',
        }}
        aria-label="JEF-Coach openen">
        {open
          ? <X size={22} color="white" />
          : <Bot size={22} color="white" />
        }
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed z-40 flex flex-col"
          style={{
            top: 78, right: 12, left: 12,
            bottom: 72,
            background: '#080e1c',
            border: '1px solid #1b2d47',
            borderRadius: 24,
            overflow: 'hidden',
            boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
          }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
            style={{ borderBottom: '1px solid #1b2d47', background: '#0a1220' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #50B4E4, #2a7fb8)' }}>
              <Sparkles size={15} color="white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">JEF-Coach</p>
              <p className="text-[10px]" style={{ color: '#4a6a8a' }}>AI muziekassistent</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {noKey && (
              <div className="p-3 rounded-xl text-xs" style={{ background: '#1a0d0d', border: '1px solid #3a1515', color: '#f87171' }}>
                API sleutel ontbreekt. Voeg <code className="text-white">ANTHROPIC_API_KEY</code> toe in Vercel.
              </div>
            )}

            {messages.length === 0 && !loading && (
              <div className="pt-1">
                <div className="p-3 rounded-2xl mb-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <p className="text-sm text-white font-semibold mb-0.5">👋 Hoi! Ik ben JEF-Coach.</p>
                  <p className="text-xs" style={{ color: '#4a6a8a' }}>Stel me een vraag over muziek, rudimenten of partituren.</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => send(s)}
                      className="text-xs px-2.5 py-1 rounded-full transition hover:opacity-80"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: '#7a9ab8' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                  style={m.role === 'user'
                    ? { background: 'var(--accent)', color: 'white', borderBottomRightRadius: 6 }
                    : { background: 'var(--surface)', border: '1px solid var(--border)', color: '#e8edf5', borderBottomLeftRadius: 6 }
                  }>
                  {m.content || (loading && i === messages.length - 1 ? <span className="opacity-50">●●●</span> : '')}
                </div>
              </div>
            ))}

            {loading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <Loader2 size={14} className="animate-spin" style={{ color: 'var(--accent)' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 px-3 py-3" style={{ borderTop: '1px solid #1b2d47' }}>
            <div className="flex items-end gap-2 rounded-2xl px-3 py-2"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <textarea
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="Stel een muziekvraag…"
                className="flex-1 bg-transparent text-sm text-white outline-none resize-none placeholder:text-gray-600"
                style={{ maxHeight: 80 }}
              />
              <button onClick={() => send()} disabled={!input.trim() || loading}
                className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition"
                style={{ background: input.trim() && !loading ? 'var(--accent)' : '#1b2d47' }}>
                <Send size={13} color="white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
