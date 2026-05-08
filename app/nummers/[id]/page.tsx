'use client'
import { useParams, useRouter } from 'next/navigation'
import { useState, useRef } from 'react'
import { ArrowLeft, Play, Pause, RotateCcw, Timer } from 'lucide-react'
import Metronome from '@/components/Metronome'
import MidiPlayer from '@/components/MidiPlayer'
import type { Song } from '@/lib/types'

const DEMO_SONGS: Song[] = [
  { id: '1', title: 'El Fuerte March', composer: 'Traditie', bpm: 120, category: 'Mars', difficulty: 2, instruments: ['Drum', 'Bugel'], pdf_url: null, audio_url: null, midi_url: null, xml_url: null, section: 'slagwerk', show: 'Show 1', created_at: '' },
  { id: '2', title: 'Zomerklanken', composer: 'Jan Pieters', bpm: 96, category: 'Showstuk', difficulty: 1, instruments: ['Drum', 'Lier'], pdf_url: null, audio_url: null, midi_url: null, xml_url: null, section: 'melodisch', show: 'Show 1', created_at: '' },
  { id: '3', title: 'Vuurwerk Finale', composer: null, bpm: 140, category: 'Finale', difficulty: 3, instruments: ['Drum'], pdf_url: null, audio_url: null, midi_url: null, xml_url: null, section: 'slagwerk', show: 'Show 2', created_at: '' },
]

export default function SongPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const song = DEMO_SONGS.find(s => s.id === id)
  const [showMetronome, setShowMetronome] = useState(false)
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  if (!song) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <p className="text-white">Nummer niet gevonden</p>
    </div>
  )

  function toggleAudio() {
    if (!audioRef.current) return
    if (playing) { audioRef.current.pause(); setPlaying(false) }
    else { audioRef.current.play(); setPlaying(true) }
  }

  function resetAudio() {
    if (!audioRef.current) return
    audioRef.current.currentTime = 0
    audioRef.current.pause()
    setPlaying(false)
  }

  return (
    <div className="min-h-screen pb-10" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button onClick={() => router.back()} className="p-2 rounded-xl" style={{ color: '#7a9ab8' }}>
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white truncate">{song.title}</h1>
          <p className="text-sm" style={{ color: '#4a6a8a' }}>{song.composer || 'Onbekend'} · {song.category}</p>
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
          {song.instruments.map(i => <span key={i} className="text-xs px-3 py-1 rounded-full" style={{ background: 'var(--border)', color: '#aaa' }}>{i}</span>)}
        </div>

        {/* PDF viewer */}
        <div className="rounded-2xl overflow-hidden flex items-center justify-center min-h-64"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {song.pdf_url ? (
            <iframe src={song.pdf_url} className="w-full h-[60vh]" title="Partituur" />
          ) : (
            <div className="text-center py-16 px-6">
              <div className="text-5xl mb-3">🎼</div>
              <p className="font-semibold text-white">Geen partituur beschikbaar</p>
              <p className="text-sm mt-1" style={{ color: '#4a6a8a' }}>Upload een PDF via de Admin pagina</p>
            </div>
          )}
        </div>

        {/* Audio player */}
        {song.audio_url ? (
          <audio ref={audioRef} src={song.audio_url} onEnded={() => setPlaying(false)} />
        ) : null}

        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-sm font-semibold text-white mb-3">🎵 Play-along</p>
          {song.audio_url ? (
            <div className="flex items-center gap-3">
              <button onClick={toggleAudio}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-white transition"
                style={{ background: 'var(--accent)' }}>
                {playing ? <Pause size={18} /> : <Play size={18} />}
                {playing ? 'Pauzeer' : 'Afspelen'}
              </button>
              <button onClick={resetAudio} className="p-2.5 rounded-full" style={{ background: 'var(--border)', color: '#aaa' }}>
                <RotateCcw size={16} />
              </button>
            </div>
          ) : (
            <p className="text-sm" style={{ color: '#4a6a8a' }}>Geen audio beschikbaar — upload via Admin</p>
          )}
        </div>

        {/* MIDI player */}
        {song.midi_url && <MidiPlayer midiUrl={song.midi_url} label="MIDI Partituur" />}

        {/* Metronome */}
        {showMetronome && <Metronome defaultBpm={song.bpm || 120} />}
      </div>
    </div>
  )
}
