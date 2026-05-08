'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, supabaseConfigured } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import LogoHeader from '@/components/LogoHeader'
import dynamic from 'next/dynamic'
import type { Song } from '@/lib/types'
import { ChevronRight, Music, FileMusic } from 'lucide-react'

const ScoreViewer = dynamic(() => import('@/components/ScoreViewer'), { ssr: false })

const DIFFICULTY = ['', '●', '●●', '●●●']

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

type Section = 'slagwerk' | 'melodisch'

const SECTION_LABEL: Record<Section, string> = {
  slagwerk: 'Slagwerk',
  melodisch: 'Melodisch',
}

export default function MuziekPage() {
  const router = useRouter()
  const supabase = createClient()

  const [songs, setSongs] = useState<Song[]>(DEMO_SONGS)
  const [section, setSection] = useState<Section>('slagwerk')
  const [show, setShow] = useState<string>('Show 1')
  const [previewId, setPreviewId] = useState<string | null>(null)

  useEffect(() => {
    if (!supabaseConfigured) return
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.replace('/')
    })
    supabase.from('songs').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { if (data?.length) setSongs(data) })
  }, [])

  const sectionSongs = songs.filter(s => s.section === section)
  const shows = [...new Set(sectionSongs.map(s => s.show).filter(Boolean))] as string[]
  const filtered = sectionSongs.filter(s => s.show === show)

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
            <button key={s} onClick={() => { setSection(s); setPreviewId(null) }}
              className="flex-1 py-3 text-sm font-semibold transition"
              style={{
                background: section === s ? 'var(--accent)' : 'transparent',
                color: section === s ? 'white' : '#4a6a8a',
              }}>
              {SECTION_LABEL[s]} Nummers
            </button>
          ))}
        </div>
      </div>

      {/* Show sub-tabs (folder chips) */}
      {shows.length > 0 && (
        <div className="px-5 mb-5 flex gap-2 flex-wrap">
          {shows.map(sh => (
            <button key={sh} onClick={() => { setShow(sh); setPreviewId(null) }}
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
      <div className="px-5 space-y-3">
        {filtered.length === 0 && (
          <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-3xl mb-2">🎼</p>
            <p className="font-semibold text-white text-sm">Geen nummers in {show}</p>
            <p className="text-xs mt-1" style={{ color: '#4a6a8a' }}>CREW kan nummers toevoegen via Admin</p>
          </div>
        )}

        {filtered.map(song => (
          <div key={song.id}>
            <button onClick={() => {
              if (song.xml_url) setPreviewId(previewId === song.id ? null : song.id)
              else router.push(`/muziek/${song.id}`)
            }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition hover:opacity-80"
              style={{
                background: 'var(--surface)',
                border: `1px solid ${previewId === song.id ? 'var(--accent)' : 'var(--border)'}`,
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

              <ChevronRight size={16} style={{ color: previewId === song.id ? 'var(--accent)' : '#3a5a7a', flexShrink: 0 }} />
            </button>

            {/* Inline score preview */}
            {previewId === song.id && song.xml_url && (
              <div className="mt-2">
                <ScoreViewer xmlUrl={song.xml_url} darkMode />
                <button onClick={() => router.push(`/muziek/${song.id}`)}
                  className="w-full mt-2 py-2.5 rounded-xl text-sm font-semibold transition"
                  style={{ background: 'var(--accent)', color: 'white' }}>
                  Volledig openen →
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  )
}
