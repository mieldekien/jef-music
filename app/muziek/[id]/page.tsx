'use client'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { ArrowLeft, Timer, Play, Pause, RotateCcw } from 'lucide-react'
import Metronome from '@/components/Metronome'
import MidiPlayer from '@/components/MidiPlayer'
import type { Song } from '@/lib/types'

const ScoreViewer = dynamic(() => import('@/components/ScoreViewer'), { ssr: false })

const DEMO_SONGS: Song[] = [
  {
    id: '1', title: 'Actor Prelude', composer: 'Demo', bpm: 120, category: 'Showstuk',
    difficulty: 2, instruments: ['Melodisch'], pdf_url: null, audio_url: null,
    midi_url: null, xml_url: '/demo-score.xml', section: 'melodisch', show: 'Show 1', created_at: '',
  },
  {
    id: '2', title: 'El Fuerte March', composer: 'Traditie', bpm: 128, category: 'Mars',
    difficulty: 2, instruments: ['Drum', 'Bugel'], pdf_url: null, audio_url: null,
    midi_url: null, xml_url: null, section: 'slagwerk', show: 'Show 1', created_at: '',
  },
  {
    id: '3', title: 'Vuurwerk Finale', composer: null, bpm: 140, category: 'Finale',
    difficulty: 3, instruments: ['Drum'], pdf_url: null, audio_url: null,
    midi_url: null, xml_url: null, section: 'slagwerk', show: 'Show 2', created_at: '',
  },
  {
    id: '4', title: 'Zomerklanken', composer: 'Jan Pieters', bpm: 96, category: 'Showstuk',
    difficulty: 1, instruments: ['Lier'], pdf_url: null, audio_url: null,
    midi_url: null, xml_url: null, section: 'melodisch', show: 'Show 2', created_at: '',
  },
]

export default function SongPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const song = DEMO_SONGS.find(s => s.id === id)
  const [showMetronome, setShowMetronome] = useState(false)
  const [playing, setPlaying] = useState(false)

  if (!song) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <p className="text-white">Nummer niet gevonden</p>
    </div>
  )

  return (
    <div className="min-h-screen pb-10" style={{ background: 'var(--bg)' }}>
      <div className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button onClick={() => router.back()} className="p-2 rounded-xl" style={{ color: '#7a9ab8' }}>
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white truncate">{song.title}</h1>
          <p className="text-sm" style={{ color: '#4a6a8a' }}>
            {song.composer || 'Onbekend'} · {song.show}
          </p>
        </div>
        <button onClick={() => setShowMetronome(v => !v)}
          className="p-2 rounded-xl transition"
          style={{ background: showMetronome ? 'var(--accent)' : 'var(--border)', color: 'white' }}>
          <Timer size={20} />
        </button>
      </div>

      <div className="px-5 space-y-4">
        {/* Info chips */}
        <div className="flex flex-wrap gap-2">
          {song.bpm && <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: '#0a1628', color: '#50B4E4' }}>{song.bpm} BPM</span>}
          {song.category && <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'var(--border)', color: '#aaa' }}>{song.category}</span>}
          {song.instruments.map(i => <span key={i} className="text-xs px-3 py-1 rounded-full" style={{ background: 'var(--border)', color: '#aaa' }}>{i}</span>)}
        </div>

        {/* MusicXML score */}
        {song.xml_url ? (
          <ScoreViewer xmlUrl={song.xml_url} darkMode />
        ) : song.pdf_url ? (
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <iframe src={song.pdf_url} className="w-full h-[60vh]" title="Partituur" />
          </div>
        ) : (
          <div className="rounded-2xl p-6 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-3xl mb-2">🎼</p>
            <p className="font-semibold text-white text-sm">Geen partituur beschikbaar</p>
            <p className="text-xs mt-1" style={{ color: '#4a6a8a' }}>CREW kan een MusicXML of PDF uploaden</p>
          </div>
        )}

        {/* Audio player */}
        {song.audio_url && (
          <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-sm font-semibold text-white mb-3">🎵 Play-along</p>
            <audio id="song-audio" src={song.audio_url} onEnded={() => setPlaying(false)} />
            <div className="flex items-center gap-3">
              <button onClick={() => {
                const a = document.getElementById('song-audio') as HTMLAudioElement
                if (playing) { a.pause(); setPlaying(false) }
                else { a.play(); setPlaying(true) }
              }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-white"
                style={{ background: 'var(--accent)' }}>
                {playing ? <Pause size={18} /> : <Play size={18} />}
                {playing ? 'Pauzeer' : 'Afspelen'}
              </button>
              <button onClick={() => {
                const a = document.getElementById('song-audio') as HTMLAudioElement
                a.currentTime = 0; a.pause(); setPlaying(false)
              }} className="p-2.5 rounded-full" style={{ background: 'var(--border)', color: '#aaa' }}>
                <RotateCcw size={16} />
              </button>
            </div>
          </div>
        )}

        {/* MIDI player */}
        {song.midi_url && <MidiPlayer midiUrl={song.midi_url} label="MIDI Partituur" />}

        {/* Metronome */}
        {showMetronome && <Metronome defaultBpm={song.bpm || 120} compact />}
      </div>
    </div>
  )
}
