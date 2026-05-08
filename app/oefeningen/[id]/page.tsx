'use client'
import { useParams } from 'next/navigation'
import { useNavigate } from '@/components/PageTransition'
import { useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { ArrowLeft, Timer, ChevronDown, ChevronUp } from 'lucide-react'
import Chat from '@/components/Chat'
import Metronome from '@/components/Metronome'
import type { Exercise, ChatMessage } from '@/lib/types'
import { createClient, supabaseConfigured } from '@/lib/supabase'

const ScoreViewer = dynamic(() => import('@/components/ScoreViewer'), { ssr: false })

const DEMO: Record<string, Exercise> = {
  '1': { id:'1', title:'Paradiddle in 4/4',   description:'Basisrudiment: RLRR LRLL over 4 maten. Bouw op van 60 BPM naar 120 BPM.', category:'Rudiment', difficulty:2, xml_url:null, video_url:null, midi_url:null, created_by_name:'CREW', created_at:'' },
  '2': { id:'2', title:'Enkele Slagrol',       description:'Wisselende handen op 16de noten. Begin traag, gebruik een metronoom.', category:'Rudiment', difficulty:1, xml_url:null, video_url:null, midi_url:null, created_by_name:'CREW', created_at:'' },
  '3': { id:'3', title:'Marsmaat 2/4',         description:'Standaard marsmaat. Let op accenten op tel 1.', category:'Marching', difficulty:1, xml_url:null, video_url:null, midi_url:null, created_by_name:'CREW', created_at:'' },
  '4': { id:'4', title:'Flamacue oefening',    description:'Flamacue in 4/4. Start op 60 BPM, bouw op naar 100 BPM.', category:'Rudiment', difficulty:3, xml_url:null, video_url:null, midi_url:null, created_by_name:'CREW', created_at:'' },
}

const DIFFICULTY = ['','●','●●','●●●']

export default function ExerciseDetailPage() {
  const { id }     = useParams<{ id: string }>()
  const navigate   = useNavigate()
  const supabase   = createClient()

  const [exercise,  setExercise]  = useState<Exercise | null>(null)
  const [messages,  setMessages]  = useState<ChatMessage[]>([])
  const [userName,  setUserName]  = useState('Jij')
  const [isCrew,    setIsCrew]    = useState(false)
  const [showMet,   setShowMet]   = useState(false)
  const [chatLoad,  setChatLoad]  = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!supabaseConfigured) {
      setExercise(DEMO[id] ?? null)
      return
    }
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserName(data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Lid')
        setIsCrew(data.user.user_metadata?.is_crew === true)
      }
    })
    supabase.from('exercises').select('*').eq('id', id).single()
      .then(({ data }) => setExercise(data ?? DEMO[id] ?? null))

    setChatLoad(true)
    supabase.from('exercise_messages').select('*')
      .eq('exercise_id', id).order('created_at')
      .then(({ data }) => { if (data) setMessages(data); setChatLoad(false) })

    const channel = supabase.channel(`ex-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'exercise_messages', filter: `exercise_id=eq.${id}` },
        (p) => setMessages(prev => [...prev, p.new as ChatMessage]))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id])

  async function sendMessage(content: string) {
    const msg: ChatMessage = {
      id: crypto.randomUUID(), content, user_name: userName,
      is_crew: isCrew, user_id: null, created_at: new Date().toISOString(),
    }
    if (!supabaseConfigured) { setMessages(p => [...p, msg]); return }
    await supabase.from('exercise_messages').insert({ content, user_name: userName, is_crew: isCrew, exercise_id: id })
  }

  if (!exercise) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button onClick={() => navigate('/oefeningen')} className="p-2 rounded-xl" style={{ color: '#7a9ab8' }}>
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white truncate">{exercise.title}</h1>
          <p className="text-sm" style={{ color: '#4a6a8a' }}>
            {exercise.category}
            {exercise.difficulty ? ` · ${DIFFICULTY[exercise.difficulty]}` : ''}
            {exercise.created_by_name ? ` · ${exercise.created_by_name}` : ''}
          </p>
        </div>
        <button onClick={() => setShowMet(v => !v)}
          className="p-2 rounded-xl transition"
          style={{ background: showMet ? 'var(--accent)' : 'var(--border)', color: 'white' }}>
          <Timer size={20} />
        </button>
      </div>

      <div className="px-5 space-y-4">
        {/* Description */}
        {exercise.description && (
          <p className="text-sm leading-relaxed" style={{ color: '#7a9ab8' }}>{exercise.description}</p>
        )}

        {/* Video player */}
        {exercise.video_url && (
          <div className="rounded-2xl overflow-hidden" style={{ background: '#000', border: '1px solid var(--border)' }}>
            <video
              ref={videoRef}
              src={exercise.video_url}
              controls
              playsInline
              className="w-full"
              style={{ maxHeight: 280 }}
            />
          </div>
        )}

        {/* MusicXML score */}
        {exercise.xml_url ? (
          <ScoreViewer xmlUrl={exercise.xml_url} darkMode />
        ) : (
          <div className="rounded-2xl p-6 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-3xl mb-2">🎼</p>
            <p className="font-semibold text-white text-sm">Geen partituur beschikbaar</p>
            <p className="text-xs mt-1" style={{ color: '#4a6a8a' }}>CREW kan een MusicXML uploaden via Admin</p>
          </div>
        )}

        {/* Metronome (collapsible) */}
        {showMet && <Metronome defaultBpm={80} compact />}

        {/* Chat */}
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
    </div>
  )
}
