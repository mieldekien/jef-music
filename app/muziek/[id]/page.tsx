'use client'
import { useParams } from 'next/navigation'
import { useNavigate } from '@/components/PageTransition'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { X, Play, Pause, RotateCcw, Repeat2, ChevronDown, ChevronUp } from 'lucide-react'
import type { Song } from '@/lib/types'

const ScorePlayer = dynamic(() => import('@/components/ScorePlayer'), { ssr: false })

const DEMO_SONGS: Song[] = [
  {
    id: '1', title: 'As It Was', composer: 'Harry Styles', bpm: 120, category: 'Showstuk',
    difficulty: 2, instruments: ['Lyra', 'Marimba'], pdf_url: null, audio_url: null,
    mp3_url: '/scores/as-it-was.mp3', midi_url: '/scores/as-it-was.mid', xml_url: '/scores/as-it-was.xml',
    section: 'melodisch', show: 'Show 1', created_at: '',
  },
  {
    id: '2', title: 'As It Was (2)', composer: 'Harry Styles', bpm: 120, category: 'Showstuk',
    difficulty: 2, instruments: ['Lyra', 'Marimba'], pdf_url: null, audio_url: null,
    mp3_url: '/scores/as-it-was-2.mp3', midi_url: '/scores/as-it-was-2.mid', xml_url: '/scores/as-it-was-2.xml',
    section: 'melodisch', show: 'Show 1', created_at: '',
  },
  {
    id: '3', title: 'Unstoppable', composer: 'Sia', bpm: 126, category: 'Showstuk',
    difficulty: 2, instruments: ['Lyra', 'Marimba'], pdf_url: null, audio_url: null,
    mp3_url: '/scores/unstoppable.mp3', midi_url: '/scores/unstoppable.mid', xml_url: '/scores/unstoppable.xml',
    section: 'melodisch', show: 'Show 1', created_at: '',
  },
  {
    id: '4', title: 'Teddy Swims', composer: 'Teddy Swims', bpm: 100, category: 'Showstuk',
    difficulty: 2, instruments: ['Lyra', 'Marimba'], pdf_url: null, audio_url: null,
    mp3_url: '/scores/teddy-swims.mp3', midi_url: '/scores/teddy-swims.mid', xml_url: '/scores/teddy-swims.xml',
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

export default function SongPage() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const song     = DEMO_SONGS.find(s => s.id === id)

  const [playing,       setPlaying]       = useState(false)
  const [canPlay,       setCanPlay]       = useState(false)
  const [hasPlayed,     setHasPlayed]     = useState(false)
  const [looping,       setLooping]       = useState(false)
  const [practiceMode,  setPracticeMode]  = useState(false)
  const [toggleCount,   setToggleCount]   = useState(0)
  const [resetCount,    setResetCount]    = useState(0)
  const [instrumentNames,     setInstrumentNames]     = useState<string[]>([])
  const [visibleInstruments,  setVisibleInstruments]  = useState<number[]>([])  // empty = all
  const [showTracks,          setShowTracks]          = useState(false)
  const [currentMeasure,      setCurrentMeasure]      = useState(0)

  // Lock body scroll while fullscreen
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  if (!song) return (
    <div style={{ position: 'fixed', inset: 0, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#64748b' }}>Nummer niet gevonden</p>
    </div>
  )

  function handlePlayPause() {
    if (!canPlay) return
    setToggleCount(c => c + 1)
    if (!hasPlayed) setHasPlayed(true)
  }

  function handleReset() {
    setResetCount(c => c + 1)
    setPlaying(false)
    setHasPlayed(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'white', zIndex: 50, display: 'flex', flexDirection: 'column' }}>

      {/* ── Top bar ──────────────────────────────────────── */}
      <div style={{ position: 'absolute', top: 48, left: 20, right: 20, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Volledig / Oefenen toggle */}
        {(song.mp3_url || song.midi_url) && (
          <div style={{ display: 'flex', borderRadius: 20, overflow: 'hidden', border: '1px solid #e2e8f0', background: 'rgba(255,255,255,0.9)' }}>
            {(['Volledig', 'Oefenen'] as const).map(m => {
              const active = m === 'Oefenen' ? practiceMode : !practiceMode
              return (
                <button key={m} onClick={() => { setPracticeMode(m === 'Oefenen'); setVisibleInstruments([]); setShowTracks(false) }}
                  style={{
                    padding: '6px 14px', fontSize: 12, fontWeight: 600,
                    background: active ? '#2563eb' : 'transparent',
                    color: active ? 'white' : '#94a3b8',
                    border: 'none', cursor: 'pointer',
                  }}>
                  {m}
                </button>
              )
            })}
          </div>
        )}

        {/* Measure indicator in practice mode */}
        {practiceMode && currentMeasure > 0 && (
          <div style={{
            padding: '5px 10px', borderRadius: 20,
            background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)',
            fontSize: 11, fontWeight: 700, color: '#2563eb', marginLeft: 'auto', marginRight: 8,
          }}>
            Maat {currentMeasure}
          </div>
        )}

        {/* Close */}
        <button onClick={() => navigate('/muziek')}
          style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(241,245,249,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', ...(practiceMode && currentMeasure > 0 ? {} : { marginLeft: 'auto' }) }}>
          <X size={18} color="#64748b" />
        </button>
      </div>

      {/* ── Instrument filter dropdown (practice mode) ───── */}
      {practiceMode && instrumentNames.length > 0 && (
        <div style={{ position: 'absolute', top: 96, left: 20, right: 60, zIndex: 19 }}>
          <button onClick={() => setShowTracks(t => !t)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '7px 12px', fontSize: 12, fontWeight: 600, color: '#475569',
              background: 'rgba(255,255,255,0.95)', border: '1px solid #e2e8f0',
              borderRadius: showTracks ? '10px 10px 0 0' : 10, cursor: 'pointer',
            }}>
            <span>🎼 {visibleInstruments.length === 0 ? 'Alle partijen' : `${visibleInstruments.length} geselecteerd`}</span>
            {showTracks ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showTracks && (
            <div style={{
              background: 'rgba(255,255,255,0.97)', border: '1px solid #e2e8f0', borderTop: 'none',
              borderRadius: '0 0 10px 10px', padding: '8px 10px',
              display: 'flex', flexWrap: 'wrap', gap: 6,
            }}>
              {/* "Alle" chip */}
              <button onClick={() => setVisibleInstruments([])}
                style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: visibleInstruments.length === 0 ? '#2563eb' : '#f1f5f9',
                  color: visibleInstruments.length === 0 ? 'white' : '#94a3b8',
                  border: `1px solid ${visibleInstruments.length === 0 ? '#2563eb' : '#e2e8f0'}`,
                  cursor: 'pointer',
                }}>
                Alle
              </button>
              {instrumentNames.map((name, i) => {
                const active = visibleInstruments.includes(i)
                return (
                  <button key={i}
                    onClick={() => setVisibleInstruments(prev =>
                      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
                    )}
                    style={{
                      padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: active ? '#2563eb' : '#f1f5f9',
                      color: active ? 'white' : '#64748b',
                      border: `1px solid ${active ? '#2563eb' : '#e2e8f0'}`,
                      cursor: 'pointer',
                    }}>
                    {name}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Score (scrollable, full height) ─────────────── */}
      <div style={{ flex: 1, overflow: 'auto', paddingBottom: 110 }}>
        {song.xml_url ? (
          <ScorePlayer
            xmlUrl={song.xml_url}
            mp3Url={song.mp3_url}
            midiUrl={song.midi_url}
            noBar
            looping={looping}
            toggleCount={toggleCount}
            resetCount={resetCount}
            visibleInstruments={practiceMode ? visibleInstruments : []}
            disableScroll={practiceMode}
            disableHighlight={practiceMode}
            onInstrumentsReady={setInstrumentNames}
            onMeasureChange={practiceMode ? setCurrentMeasure : undefined}
            onPlayingChange={v => { setPlaying(v) }}
            onCanPlayChange={v => { setCanPlay(v) }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh', gap: 12 }}>
            <div style={{ fontSize: 48 }}>🎼</div>
            <p style={{ fontWeight: 600, color: '#1e293b', fontSize: 16 }}>Geen partituur beschikbaar</p>
            <p style={{ color: '#94a3b8', fontSize: 13 }}>Upload een MusicXML via Admin</p>
          </div>
        )}
      </div>

      {/* ── Bottom controls — floating, no background ─────── */}
      <div style={{
        position: 'fixed', bottom: 36, left: 0, right: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32,
        pointerEvents: 'none',
      }}>
        {/* Reset button — appears after first play */}
        <button
          onClick={handleReset}
          style={{
            pointerEvents: 'auto',
            width: 48, height: 48, borderRadius: '50%',
            background: '#f1f5f9', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: hasPlayed ? 1 : 0, transition: 'opacity 0.25s',
          }}>
          <RotateCcw size={20} color="#64748b" />
        </button>

        {/* Play / Pause */}
        <button
          onClick={handlePlayPause}
          disabled={!canPlay}
          style={{
            pointerEvents: 'auto',
            width: 76, height: 76, borderRadius: '50%',
            background: canPlay ? '#2563eb' : '#e2e8f0',
            border: 'none', cursor: canPlay ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: canPlay ? '0 6px 20px rgba(37,99,235,0.4)' : 'none',
            transition: 'background 0.2s, box-shadow 0.2s',
          }}>
          {!canPlay ? (
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              border: '3px solid rgba(255,255,255,0.5)', borderTopColor: 'white',
              animation: 'spin 0.8s linear infinite',
            }} />
          ) : playing ? (
            <Pause size={28} color="white" fill="white" />
          ) : (
            <Play size={28} color="white" fill="white" style={{ marginLeft: 3 }} />
          )}
        </button>

        {/* Loop button — appears after first play */}
        <button
          onClick={() => setLooping(l => !l)}
          style={{
            pointerEvents: 'auto',
            width: 48, height: 48, borderRadius: '50%',
            background: looping ? '#dbeafe' : '#f1f5f9',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: hasPlayed ? 1 : 0, transition: 'opacity 0.25s, background 0.2s',
          }}>
          <Repeat2 size={20} color={looping ? '#2563eb' : '#64748b'} />
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
