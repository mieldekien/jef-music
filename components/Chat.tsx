'use client'
import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import type { ChatMessage } from '@/lib/types'

// ── helpers ───────────────────────────────────────────────────────
function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })
}

function formatDay(iso: string) {
  const d    = new Date(iso)
  const now  = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return 'Vandaag'
  if (diff === 1) return 'Gisteren'
  return d.toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })
}

function sameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

// ── demo data ─────────────────────────────────────────────────────
const DEMO: ChatMessage[] = [
  { id: '1', user_name: 'CREW',     is_crew: true,  content: '📌 Nieuwe oefening online! Bekijk de paradiddle in 4/4.',       created_at: new Date(Date.now() - 3600*5000).toISOString(), user_id: null },
  { id: '2', user_name: 'Jens V.',  is_crew: false, content: 'Heb de oefening al geprobeerd, goede uitdaging!',               created_at: new Date(Date.now() - 3600*4800).toISOString(), user_id: null },
  { id: '3', user_name: 'Lore D.',  is_crew: false, content: '👍 De 6/8 maatsoort snap ik nog niet helemaal...',               created_at: new Date(Date.now() - 3600*4600).toISOString(), user_id: null },
  { id: '4', user_name: 'CREW',     is_crew: true,  content: '@Lore: 6/8 = 6 achtste noten per maat, accent op tel 1 en 4.',   created_at: new Date(Date.now() - 3600*4400).toISOString(), user_id: null },
  { id: '5', user_name: 'Pieter S.',is_crew: false, content: 'Vrijdag repetitie klaar?',                                       created_at: new Date(Date.now() - 3600*2000).toISOString(), user_id: null },
]

// ── component ─────────────────────────────────────────────────────
interface Props {
  messages?: ChatMessage[]
  currentUserName?: string
  isCrew?: boolean
  onSend?: (content: string) => Promise<void>
  loading?: boolean
}

export default function Chat({
  messages    = DEMO,
  currentUserName = 'Jij',
  isCrew      = false,
  onSend,
  loading     = false,
}: Props) {
  const [input,    setInput]    = useState('')
  const [sending,  setSending]  = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    if (onSend) {
      setSending(true)
      await onSend(text)
      setSending(false)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const isOwn = (m: ChatMessage) => m.user_name === currentUserName

  return (
    <div className="flex flex-col" style={{ minHeight: 0 }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-1 pb-3 pt-1">
        <div className="w-2 h-2 rounded-full" style={{ background: '#4a6a8a' }} />
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#3a5a7a' }}>
          Groepsgesprek
        </span>
      </div>

      {/* Messages */}
      <div className="space-y-1 pb-2">
        {loading && (
          <div className="flex justify-center py-4">
            <div className="w-4 h-4 rounded-full border-2 animate-spin"
              style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          </div>
        )}

        {messages.map((m, i) => {
          const own        = isOwn(m)
          const prevMsg    = messages[i - 1]
          const showDay    = !prevMsg || !sameDay(prevMsg.created_at, m.created_at)
          const showAvatar = !own && (!prevMsg || prevMsg.user_name !== m.user_name || showDay)

          return (
            <div key={m.id}>
              {/* Day separator */}
              {showDay && (
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px" style={{ background: '#1b2d47' }} />
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: '#0d1626', color: '#4a6a8a', border: '1px solid #1b2d47' }}>
                    {formatDay(m.created_at)}
                  </span>
                  <div className="flex-1 h-px" style={{ background: '#1b2d47' }} />
                </div>
              )}

              <div className={`flex gap-2 ${own ? 'justify-end' : 'justify-start'}`}>
                {/* Avatar placeholder to keep alignment */}
                {!own && (
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-auto mb-0.5 ${showAvatar ? '' : 'opacity-0'}`}
                    style={{ background: m.is_crew ? '#1a2d4a' : '#1b2d47', color: m.is_crew ? 'var(--accent)' : '#7a9ab8', fontSize: 10 }}>
                    {initials(m.user_name)}
                  </div>
                )}

                <div className={`max-w-[72%] ${own ? 'items-end' : 'items-start'} flex flex-col`}>
                  {/* Sender name (only for others, first in a run) */}
                  {!own && showAvatar && (
                    <span className="text-xs font-semibold mb-0.5 ml-1"
                      style={{ color: m.is_crew ? 'var(--accent)' : '#7a9ab8' }}>
                      {m.user_name}{m.is_crew ? ' 🔑' : ''}
                    </span>
                  )}

                  <div className="flex items-end gap-1.5">
                    <div
                      className="px-3.5 py-2 rounded-2xl text-sm leading-relaxed"
                      style={own
                        ? { background: 'var(--accent)', color: 'white',   borderBottomRightRadius: 4 }
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
                  <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-auto mb-0.5"
                    style={{ background: 'var(--accent)', color: 'white', fontSize: 10, opacity: 0.7 }}>
                    {initials(currentUserName)}
                  </div>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 pt-3 border-t" style={{ borderColor: '#1b2d47' }}>
        <div className="flex-1 flex items-end gap-2 rounded-2xl px-3.5 py-2.5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <textarea
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={`Schrijf een bericht${isCrew ? ' (CREW)' : ''}…`}
            className="flex-1 bg-transparent text-sm text-white outline-none resize-none placeholder:text-gray-600"
            style={{ maxHeight: 100 }}
          />
        </div>
        <button onClick={send} disabled={!input.trim() || sending}
          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition"
          style={{ background: input.trim() && !sending ? 'var(--accent)' : '#1b2d47' }}>
          <Send size={15} color="white" />
        </button>
      </div>
    </div>
  )
}
