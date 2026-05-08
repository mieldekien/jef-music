'use client'
import { useEffect, useState } from 'react'
import { useNavigate } from '@/components/PageTransition'
import { createClient, supabaseConfigured } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import LogoHeader from '@/components/LogoHeader'
import type { Song } from '@/lib/types'
import { ChevronDown, ChevronUp, Music, FileMusic, Printer } from 'lucide-react'

const DIFFICULTY = ['', '●', '●●', '●●●']

const DEMO_SONGS: Song[] = [
  {
    id: '1', title: 'As It Was', composer: 'Harry Styles', bpm: 120, category: 'Showstuk',
    difficulty: 2, instruments: ['Lyra', 'Marimba'], pdf_url: null, audio_url: null,
    mp3_url: '/scores/as-it-was.mp3', midi_url: null, xml_url: '/scores/as-it-was.xml',
    section: 'melodisch', show: 'Show 1', created_at: '',
  },
  {
    id: '2', title: 'As It Was (2)', composer: 'Harry Styles', bpm: 120, category: 'Showstuk',
    difficulty: 2, instruments: ['Lyra', 'Marimba'], pdf_url: null, audio_url: null,
    mp3_url: '/scores/as-it-was-2.mp3', midi_url: null, xml_url: '/scores/as-it-was-2.xml',
    section: 'melodisch', show: 'Show 1', created_at: '',
  },
  {
    id: '3', title: 'Unstoppable', composer: 'Sia', bpm: 126, category: 'Showstuk',
    difficulty: 2, instruments: ['Lyra', 'Marimba'], pdf_url: null, audio_url: null,
    mp3_url: '/scores/unstoppable.mp3', midi_url: null, xml_url: '/scores/unstoppable.xml',
    section: 'melodisch', show: 'Show 1', created_at: '',
  },
  {
    id: '4', title: 'Teddy Swims', composer: 'Teddy Swims', bpm: 100, category: 'Showstuk',
    difficulty: 2, instruments: ['Lyra', 'Marimba'], pdf_url: null, audio_url: null,
    mp3_url: '/scores/teddy-swims.mp3', midi_url: null, xml_url: '/scores/teddy-swims.xml',
    section: 'melodisch', show: 'Show 1', created_at: '',
  },
  {
    id: '5', title: 'El Fuerte March', composer: 'Traditie', bpm: 128, category: 'Mars',
    difficulty: 2, instruments: ['Drum', 'Bugel'], pdf_url: null, audio_url: null,
    mp3_url: null, midi_url: null, xml_url: null, section: 'slagwerk', show: 'Show 1', created_at: '',
  },
  {
    id: '6', title: 'Vuurwerk Finale', composer: null, bpm: 140, category: 'Finale',
    difficulty: 3, instruments: ['Drum'], pdf_url: null, audio_url: null,
    mp3_url: null, midi_url: null, xml_url: null, section: 'slagwerk', show: 'Show 1', created_at: '',
  },
]

type Section = 'slagwerk' | 'melodisch'
const SECTION_LABEL: Record<Section, string> = { slagwerk: 'Slagwerk', melodisch: 'Melodisch' }

export default function MuziekPage() {
  const navigate  = useNavigate()
  const supabase  = createClient()

  const [songs,    setSongs]    = useState<Song[]>(DEMO_SONGS)
  const [section,  setSection]  = useState<Section>('slagwerk')
  const [show,     setShow]     = useState<string>('Show 1')
  const [drawerId, setDrawerId] = useState<string | null>(null)

  useEffect(() => {
    if (!supabaseConfigured) return
    supabase.auth.getUser().then(({ data }) => { if (!data.user) navigate('/') })
    supabase.from('songs').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { if (data?.length) setSongs(data) })
  }, [])

  const sectionSongs = songs.filter(s => s.section === section)
  const shows        = [...new Set(sectionSongs.map(s => s.show).filter(Boolean))] as string[]
  const filtered     = sectionSongs.filter(s => s.show === show)

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg)' }}>
      <LogoHeader />

      <div className="px-5 pt-2 pb-4">
        <h1 className="text-2xl font-bold text-white">Muziek</h1>
        <p className="text-sm mt-0.5" style={{ color: '#4a6a8a' }}>Bladmuziek & partituren</p>
      </div>

      {/* Section tabs */}
      <div className="px-5 mb-4">
        <div className="flex rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {(['slagwerk', 'melodisch'] as Section[]).map(s => (
            <button key={s} onClick={() => { setSection(s); setDrawerId(null) }}
              className="flex-1 py-3 text-sm font-semibold transition"
              style={{ background: section === s ? 'var(--accent)' : 'transparent', color: section === s ? 'white' : '#4a6a8a' }}>
              {SECTION_LABEL[s]} Nummers
            </button>
          ))}
        </div>
      </div>

      {/* Show sub-tabs */}
      {shows.length > 0 && (
        <div className="px-5 mb-5 flex gap-2 flex-wrap">
          {shows.map(sh => (
            <button key={sh} onClick={() => { setShow(sh); setDrawerId(null) }}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-1.5"
              style={{
                background: show === sh ? '#1b3a5a' : 'var(--surface)',
                color: show === sh ? 'var(--accent)' : '#4a6a8a',
                border: `1px solid ${show === sh ? 'var(--accent)' : 'var(--border)'}`,
              }}>
              📁 {sh}
            </button>
          ))}
        </div>
      )}

      {/* Song list */}
      <div className="px-5 space-y-2">
        {filtered.length === 0 && (
          <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-3xl mb-2">🎼</p>
            <p className="font-semibold text-white text-sm">Geen nummers in {show}</p>
            <p className="text-xs mt-1" style={{ color: '#4a6a8a' }}>CREW kan nummers toevoegen via Admin</p>
          </div>
        )}

        {filtered.map(song => {
          const open = drawerId === song.id
          return (
            <div key={song.id}>
              {/* Song row */}
              <button
                onClick={() => setDrawerId(open ? null : song.id)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition"
                style={{
                  background: 'var(--surface)',
                  border: `1px solid ${open ? 'var(--accent)' : 'var(--border)'}`,
                  borderBottomLeftRadius: open ? 0 : undefined,
                  borderBottomRightRadius: open ? 0 : undefined,
                }}>

                <div className="flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0"
                  style={{ background: song.xml_url ? '#0a1e35' : '#0d1626' }}>
                  {song.xml_url
                    ? <FileMusic size={22} style={{ color: 'var(--accent)' }} />
                    : <Music size={22} style={{ color: 'var(--accent)' }} />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{song.title}</p>
                  <p className="text-sm mt-0.5 truncate" style={{ color: '#4a6a8a' }}>
                    {song.composer || 'Onbekend'}{song.bpm ? ` · ${song.bpm} BPM` : ''}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {song.xml_url && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{ background: '#0a1e35', color: 'var(--accent)' }}>
                        Partituur
                      </span>
                    )}
                    {song.difficulty && (
                      <span className="text-[10px]" style={{ color: 'var(--accent)' }}>
                        {DIFFICULTY[song.difficulty]}
                      </span>
                    )}
                  </div>
                </div>

                {open
                  ? <ChevronUp size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  : <ChevronDown size={16} style={{ color: '#3a5a7a', flexShrink: 0 }} />
                }
              </button>

              {/* Drawer — slides open */}
              {open && (
                <div className="flex gap-2 p-3 rounded-b-2xl"
                  style={{ background: '#0a1628', border: '1px solid var(--accent)', borderTop: 'none' }}>
                  <button
                    onClick={() => navigate(`/muziek/${song.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition"
                    style={{ background: 'var(--accent)', color: 'white' }}>
                    <FileMusic size={16} />
                    Zie volledige partituur
                  </button>
                  <button
                    onClick={() => { window.open(`/muziek/${song.id}`, '_blank') }}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition"
                    style={{ background: 'var(--border)', color: '#aaa' }}>
                    <Printer size={16} />
                    Print
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <BottomNav />
    </div>
  )
}
