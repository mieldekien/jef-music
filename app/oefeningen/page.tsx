'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LogoHeader from '@/components/LogoHeader'
import BottomNav from '@/components/BottomNav'
import Chat from '@/components/Chat'
import { ChevronRight, Plus, FileMusic, Video, Lock } from 'lucide-react'
import type { Exercise, ChatMessage } from '@/lib/types'
import { createClient, supabaseConfigured } from '@/lib/supabase'

const DIFFICULTY = ['', '●', '●●', '●●●']

const DEMO_EXERCISES: Exercise[] = [
  { id: '1', title: 'Paradiddle in 4/4',    description: 'Basisrudiment: RLRR LRLL. Bouw op van 60 BPM.', category: 'Rudiment',  difficulty: 2, xml_url: null, video_url: null, midi_url: null, created_by_name: 'CREW', created_at: '' },
  { id: '2', title: 'Enkele Slagrol',       description: 'Wisselende handen op 16de noten, gelijkmatig tempo.', category: 'Rudiment',  difficulty: 1, xml_url: null, video_url: null, midi_url: null, created_by_name: 'CREW', created_at: '' },
  { id: '3', title: 'Marsmaat 2/4',         description: 'Standaard marsmaat. Let op accenten op tel 1.',     category: 'Marching',  difficulty: 1, xml_url: null, video_url: null, midi_url: null, created_by_name: 'CREW', created_at: '' },
  { id: '4', title: 'Flamacue oefening',    description: 'Flamacue in 4/4. Start traag, bouw snelheid op.',  category: 'Rudiment',  difficulty: 3, xml_url: null, video_url: null, midi_url: null, created_by_name: 'CREW', created_at: '' },
]

const CAT_COLOR: Record<string, string> = {
  Rudiment: '#50B4E4',
  Marching:  '#DAD74D',
  Techniek:  '#9b8ab8',
  Show:      '#7ac4a0',
}

export default function OefeningenPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [exercises, setExercises] = useState<Exercise[]>(DEMO_EXERCISES)
  const [messages,  setMessages]  = useState<ChatMessage[]>([])
  const [userName,  setUserName]  = useState('Jij')
  const [isCrew,    setIsCrew]    = useState(false)
  const [chatLoad,  setChatLoad]  = useState(false)

  useEffect(() => {
    if (!supabaseConfigured) return

    // Get user
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const name = data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Lid'
        setUserName(name)
        setIsCrew(data.user.user_metadata?.is_crew === true)
      }
    })

    // Load exercises
    supabase.from('exercises').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { if (data?.length) setExercises(data) })

    // Load chat
    setChatLoad(true)
    supabase.from('exercise_messages')
      .select('*').is('exercise_id', null).order('created_at')
      .then(({ data }) => { if (data) setMessages(data); setChatLoad(false) })

    // Realtime
    const channel = supabase.channel('oef-chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'exercise_messages', filter: 'exercise_id=is.null' },
        (p) => setMessages(prev => [...prev, p.new as ChatMessage]))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function sendMessage(content: string) {
    const msg: ChatMessage = {
      id: crypto.randomUUID(), content, user_name: userName,
      is_crew: isCrew, user_id: null, created_at: new Date().toISOString(),
    }
    if (!supabaseConfigured) { setMessages(p => [...p, msg]); return }
    await supabase.from('exercise_messages').insert({ content, user_name: userName, is_crew: isCrew, exercise_id: null })
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg)' }}>
      <LogoHeader />

      <div className="px-5 pt-2 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Oefeningen</h1>
          <p className="text-sm mt-0.5" style={{ color: '#4a6a8a' }}>Klik op een oefening om mee te spelen</p>
        </div>
        {isCrew && (
          <button onClick={() => router.push('/admin/oefening')}
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--accent)' }}>
            <Plus size={20} color="white" />
          </button>
        )}
      </div>

      {/* Exercise list */}
      <div className="px-5 space-y-3 mb-8">
        {exercises.map(ex => {
          const color = CAT_COLOR[ex.category ?? ''] ?? '#7a9ab8'
          return (
            <button key={ex.id} onClick={() => router.push(`/oefeningen/${ex.id}`)}
              className="w-full text-left rounded-2xl p-4 flex items-center gap-4 transition hover:opacity-80"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>

              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: color + '22' }}>
                <FileMusic size={22} style={{ color }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-white truncate">{ex.title}</p>
                  {ex.video_url && <Video size={13} style={{ color: '#DAD74D', flexShrink: 0 }} />}
                </div>
                <p className="text-xs truncate mb-1.5" style={{ color: '#4a6a8a' }}>{ex.description}</p>
                <div className="flex gap-2">
                  {ex.category && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: color + '22', color }}>
                      {ex.category}
                    </span>
                  )}
                  {ex.difficulty && (
                    <span className="text-[10px]" style={{ color: 'var(--accent)' }}>
                      {DIFFICULTY[ex.difficulty]}
                    </span>
                  )}
                </div>
              </div>

              <ChevronRight size={16} style={{ color: '#3a5a7a', flexShrink: 0 }} />
            </button>
          )
        })}

        {!supabaseConfigured && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs"
            style={{ background: '#0d1e35', color: '#4a6a8a', border: '1px solid #1b2d47' }}>
            <Lock size={12} />
            Verbind Supabase om eigen oefeningen + video te uploaden
          </div>
        )}
      </div>

      {/* Chat */}
      <div className="px-5">
        <div className="rounded-3xl p-4" style={{ background: '#0a1020', border: '1px solid #1b2d47' }}>
          <Chat
            messages={messages.length ? messages : undefined}
            currentUserName={userName}
            isCrew={isCrew}
            onSend={sendMessage}
            loading={chatLoad}
          />
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
