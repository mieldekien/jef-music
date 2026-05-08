'use client'
import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { X, Send, Loader2, Sparkles } from 'lucide-react'

interface Message { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  'Wat is een paradiddle?',
  'Leg 6/8 maatsoort uit',
  'Hoe oefen ik single stroke roll?',
  'Wat betekent ff in een partituur?',
]

export default function FloatingAI() {
  const pathname  = usePathname()
  const greeted   = useRef(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const [open,     setOpen]     = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [noKey,    setNoKey]    = useState(false)
  const [tip,      setTip]      = useState('')
  const [tipShow,  setTipShow]  = useState(false)

  const TIPS = [
    'Oefen altijd met de metronoom! 🎵',
    'Vragen over een partituur? Tap me aan 👆',
    'Wist je dat de paradiddle een basisrudiment is?',
    'Check de chat voor updates van CREW 💬',
    'Gebruik Tap Tempo om je BPM te vinden 🥁',
  ]

  useEffect(() => {
    if (open) return
    const t1 = setTimeout(() => {
      setTip(TIPS[Math.floor(Math.random() * TIPS.length)])
      setTipShow(true)
      setTimeout(() => setTipShow(false), 4500)
    }, 12000)
    return () => clearTimeout(t1)
  }, [pathname, open])

  // Auto-greeting on /jef hub
  useEffect(() => {
    if (pathname === '/jef' && !greeted.current) {
      greeted.current = true
      setMessages([{ role: 'assistant', content: 'Selecteer een tabje waar je graag verder in wilt! 👇' }])
    }
  }, [pathname])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMsg(text: string) {
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

  if (pathname === '/' || pathname === '/academy') return null

  return (
    <>
      {/* ── Pulsing bubble (closed state) ───────────────────── */}
      {!open && (
        <>
          {/* Tip balloon */}
          {tipShow && (
            <div className="fixed z-50 px-3 py-2 rounded-2xl text-xs font-medium shadow-lg"
              style={{
                top: 72, right: 14,
                background: 'white',
                color: '#1a2a3a',
                maxWidth: 200,
                borderBottomRightRadius: 4,
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                animation: 'fadeInTip .3s ease',
              }}>
              {tip}
            </div>
          )}
          <button
            onClick={() => setOpen(true)}
            className="ai-bubble fixed z-50 flex items-center justify-center rounded-full shadow-xl"
            style={{ top: 16, right: 16, width: 50, height: 50, background: 'linear-gradient(135deg, #50B4E4, #2a7fb8)' }}
            aria-label="JEF-Coach">
            <Sparkles size={20} color="white" />
          </button>
        </>
      )}

      {/* ── Floating panel (open state) ─────────────────────── */}
      {open && (
        <div className="fixed z-40 flex flex-col"
          style={{
            top: 78, right: 12, left: 12, bottom: 72,
            background: '#080e1c',
            border: '1px solid #1b2d47',
            borderRadius: 24,
            overflow: 'hidden',
            boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
          }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-5 pt-14 pb-3 flex-shrink-0"
            style={{ borderBottom: '1px solid #1b2d47' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #50B4E4, #2a7fb8)' }}>
              <Sparkles size={16} color="white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">JEF-Coach</p>
              <p className="text-[10px]" style={{ color: '#4a6a8a' }}>AI muziekassistent</p>
            </div>
            <button onClick={() => setOpen(false)}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: '#1b2d47' }}>
              <X size={18} color="#7a9ab8" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
            {noKey && (
              <div className="p-3 rounded-xl text-xs" style={{ background: '#1a0d0d', border: '1px solid #3a1515', color: '#f87171' }}>
                API sleutel ontbreekt. Voeg <code className="text-white">ANTHROPIC_API_KEY</code> toe in Vercel.
              </div>
            )}

            {messages.length === 0 && !loading && (
              <div className="pt-1">
                <div className="p-4 rounded-2xl mb-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <p className="text-sm text-white font-semibold mb-1">👋 Hoi! Ik ben JEF-Coach.</p>
                  <p className="text-xs" style={{ color: '#4a6a8a' }}>Stel me een vraag over muziek, rudimenten of partituren.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => sendMsg(s)}
                      className="text-xs px-3 py-1.5 rounded-full transition hover:opacity-80"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: '#7a9ab8' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                  style={m.role === 'user'
                    ? { background: 'var(--accent)', color: 'white', borderBottomRightRadius: 6 }
                    : { background: 'var(--surface)', border: '1px solid var(--border)', color: '#e8edf5', borderBottomLeftRadius: 6 }
                  }>
                  {m.content || (loading && i === messages.length - 1 ? <span className="opacity-40">●●●</span> : '')}
                </div>
              </div>
            ))}

            {loading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex justify-start">
                <div className="px-4 py-2.5 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <Loader2 size={14} className="animate-spin" style={{ color: 'var(--accent)' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 px-5 pb-8 pt-3" style={{ borderTop: '1px solid #1b2d47' }}>
            <div className="flex items-end gap-2 rounded-2xl px-4 py-3"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <textarea
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(input.trim()) } }}
                placeholder="Stel een muziekvraag…"
                className="flex-1 bg-transparent text-sm text-white outline-none resize-none placeholder:text-gray-600"
                style={{ maxHeight: 100 }}
              />
              <button onClick={() => sendMsg(input.trim())} disabled={!input.trim() || loading}
                className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition"
                style={{ background: input.trim() && !loading ? 'var(--accent)' : '#1b2d47' }}>
                <Send size={14} color="white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
