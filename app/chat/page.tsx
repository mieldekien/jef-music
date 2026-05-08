'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient, supabaseConfigured } from '@/lib/supabase'
import LogoHeader from '@/components/LogoHeader'
import BottomNav from '@/components/BottomNav'
import { Send, Shield, Plus, X, Hash } from 'lucide-react'
import type { ChatMessage } from '@/lib/types'

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })
}
function sameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString()
}
function formatDay(iso: string) {
  const d = new Date(iso), now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return 'Vandaag'
  if (diff === 1) return 'Gisteren'
  return d.toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })
}

interface Room { id: string; name: string; color: string; emoji: string }

const INITIAL_ROOMS: Room[] = [
  { id: 'algemeen',       name: 'Algemeen',       color: '#50B4E4', emoji: '💬' },
  { id: 'slagwerk',       name: 'Slagwerk',       color: '#DAD74D', emoji: '🥁' },
  { id: 'melodisch',      name: 'Melodisch',      color: '#7ac4a0', emoji: '🎵' },
  { id: 'aankondigingen', name: 'Aankondigingen', color: '#f0916a', emoji: '📢' },
]

const DEMO_MSGS: Record<string, ChatMessage[]> = {
  algemeen: [
    { id: '1', user_name: 'CREW', is_crew: true,  content: '👋 Welkom! Gebruik de kanalen hieronder.', created_at: new Date(Date.now() - 3600*8000).toISOString(), user_id: null },
    { id: '2', user_name: 'Lore D.', is_crew: false, content: 'Wanneer is de volgende repetitie?', created_at: new Date(Date.now() - 3600*4000).toISOString(), user_id: null },
    { id: '3', user_name: 'CREW', is_crew: true, content: 'Vrijdag 19u 🥁', created_at: new Date(Date.now() - 3600*3800).toISOString(), user_id: null },
  ],
  slagwerk: [
    { id: '4', user_name: 'CREW', is_crew: true, content: 'Slagwerk leden: paradiddle oefenen voor vrijdag!', created_at: new Date(Date.now() - 3600*2000).toISOString(), user_id: null },
  ],
  melodisch: [
    { id: '5', user_name: 'CREW', is_crew: true, content: 'Melodisch: nieuwe partituur staat in de Muziek tab 🎼', created_at: new Date(Date.now() - 3600*1000).toISOString(), user_id: null },
  ],
  aankondigingen: [
    { id: '6', user_name: 'CREW', is_crew: true, content: '📢 Optreden op 15 juni! Noteer in je agenda.', created_at: new Date(Date.now() - 3600*500).toISOString(), user_id: null },
  ],
}

export default function ChatPage() {
  const supabase   = createClient()
  const bottomRef  = useRef<HTMLDivElement>(null)

  const [rooms,      setRooms]     = useState<Room[]>(INITIAL_ROOMS)
  const [activeRoom, setActiveRoom] = useState('algemeen')
  const [allMsgs,    setAllMsgs]   = useState<Record<string, ChatMessage[]>>(DEMO_MSGS)
  const [input,      setInput]     = useState('')
  const [sending,    setSending]   = useState(false)
  const [userName,   setUserName]  = useState('Jij')
  const [isCrew,     setIsCrew]    = useState(false)
  const [newRoom,    setNewRoom]   = useState(false)
  const [roomName,   setRoomName]  = useState('')

  const messages = allMsgs[activeRoom] ?? []

  useEffect(() => {
    if (!supabaseConfigured) return
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserName(data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Lid')
        setIsCrew(data.user.user_metadata?.is_crew === true)
      }
    })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeRoom])

  async function send() {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setSending(true)
    const msg: ChatMessage = { id: crypto.randomUUID(), content: text, user_name: userName, is_crew: isCrew, user_id: null, created_at: new Date().toISOString() }
    setAllMsgs(prev => ({ ...prev, [activeRoom]: [...(prev[activeRoom] ?? []), msg] }))
    if (supabaseConfigured) {
      await supabase.from('exercise_messages').insert({ content: text, user_name: userName, is_crew: isCrew, exercise_id: null })
    }
    setSending(false)
  }

  function addRoom() {
    const name = roomName.trim()
    if (!name) return
    const id = name.toLowerCase().replace(/\s+/g, '-')
    const colors = ['#50B4E4', '#DAD74D', '#7ac4a0', '#9b8ab8', '#f0916a']
    const color = colors[rooms.length % colors.length]
    setRooms(r => [...r, { id, name, color, emoji: '💬' }])
    setAllMsgs(prev => ({ ...prev, [id]: [] }))
    setActiveRoom(id)
    setRoomName('')
    setNewRoom(false)
  }

  const isOwn = (m: ChatMessage) => m.user_name === userName

  return (
    <div className="min-h-screen flex flex-col pb-16" style={{ background: 'var(--bg)' }}>
      <LogoHeader />

      {/* Room tabs */}
      <div className="flex-shrink-0 px-4 pt-1 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {rooms.map(r => (
            <button key={r.id} onClick={() => setActiveRoom(r.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold flex-shrink-0 transition"
              style={{
                background: activeRoom === r.id ? r.color + '22' : 'var(--surface)',
                color: activeRoom === r.id ? r.color : '#4a6a8a',
                border: `1px solid ${activeRoom === r.id ? r.color + '55' : 'var(--border)'}`,
              }}>
              <span>{r.emoji}</span>
              <span>{r.name}</span>
            </button>
          ))}

          {/* Add room (CREW only in prod, always in demo) */}
          {(isCrew || !supabaseConfigured) && (
            newRoom ? (
              <div className="flex items-center gap-1 flex-shrink-0">
                <input value={roomName} onChange={e => setRoomName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addRoom(); if (e.key === 'Escape') setNewRoom(false) }}
                  placeholder="Naam..."
                  autoFocus
                  className="text-sm text-white outline-none px-3 py-2 rounded-xl"
                  style={{ background: 'var(--surface)', border: '1px solid var(--accent)', width: 110 }} />
                <button onClick={addRoom}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--accent)' }}>
                  <Plus size={14} color="white" />
                </button>
                <button onClick={() => setNewRoom(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <X size={14} color="#7a9ab8" />
                </button>
              </div>
            ) : (
              <button onClick={() => setNewRoom(true)}
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: '#4a6a8a' }}>
                <Plus size={16} />
              </button>
            )
          )}
        </div>
      </div>

      {/* Channel header */}
      <div className="px-5 pb-2 flex-shrink-0 flex items-center gap-2">
        <Hash size={14} style={{ color: rooms.find(r => r.id === activeRoom)?.color ?? '#4a6a8a' }} />
        <span className="text-sm font-semibold text-white">
          {rooms.find(r => r.id === activeRoom)?.name}
        </span>
        {isCrew && (
          <div className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-full"
            style={{ background: '#0a1e35', border: '1px solid var(--accent)' }}>
            <Shield size={10} style={{ color: 'var(--accent)' }} />
            <span className="text-[10px] font-semibold" style={{ color: 'var(--accent)' }}>CREW</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 space-y-1 pb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 opacity-40">
            <span className="text-4xl mb-2">{rooms.find(r => r.id === activeRoom)?.emoji}</span>
            <p className="text-sm text-white">Nog geen berichten</p>
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
                    <span className="text-xs font-semibold mb-0.5 ml-1"
                      style={{ color: m.is_crew ? 'var(--accent)' : '#7a9ab8' }}>
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
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 pb-20 pt-2" style={{ background: 'var(--bg)' }}>
        <div className="flex items-end gap-2 rounded-2xl px-4 py-3"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <textarea rows={1} value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder={`Schrijf in #${rooms.find(r => r.id === activeRoom)?.name}…`}
            className="flex-1 bg-transparent text-sm text-white outline-none resize-none placeholder:text-gray-600"
            style={{ maxHeight: 100 }} />
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
