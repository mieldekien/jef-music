'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { Play, Square } from 'lucide-react'

// ── tempo names ───────────────────────────────────────────────────
const TEMPO_MARKS = [
  { name: 'Larghissimo', max: 24 },  { name: 'Grave',        max: 40 },
  { name: 'Largo',       max: 60 },  { name: 'Larghetto',    max: 66 },
  { name: 'Adagio',      max: 76 },  { name: 'Adagietto',    max: 80 },
  { name: 'Andante',     max: 108 }, { name: 'Andantino',    max: 120 },
  { name: 'Moderato',    max: 128 }, { name: 'Allegretto',   max: 132 },
  { name: 'Allegro',     max: 168 }, { name: 'Vivace',       max: 176 },
  { name: 'Vivacissimo', max: 184 }, { name: 'Allegrissimo', max: 200 },
  { name: 'Presto',      max: 208 }, { name: 'Prestissimo',  max: 999 },
]
const tempoName = (bpm: number) => TEMPO_MARKS.find(t => bpm <= t.max)?.name ?? 'Prestissimo'

// ── time signatures ───────────────────────────────────────────────
type TimeSig = '2/4' | '3/4' | '4/4' | '6/8'
const TIME_SIGS: { sig: TimeSig; beats: number; defaultAccents: boolean[] }[] = [
  { sig: '2/4', beats: 2, defaultAccents: [true, false] },
  { sig: '3/4', beats: 3, defaultAccents: [true, false, false] },
  { sig: '4/4', beats: 4, defaultAccents: [true, false, false, false] },
  { sig: '6/8', beats: 6, defaultAccents: [true, false, false, true, false, false] },
]

// ── sound types ───────────────────────────────────────────────────
type SoundType = 'klik' | 'hout' | 'tikkel' | 'bel'
const SOUNDS: { id: SoundType; label: string }[] = [
  { id: 'klik',   label: 'Klik'   },
  { id: 'hout',   label: 'Hout'   },
  { id: 'tikkel', label: 'Tikkel' },
  { id: 'bel',    label: 'Bel'    },
]

function playClick(ctx: AudioContext, time: number, accent: boolean, sound: SoundType) {
  const vol = accent ? 1 : 0.55

  if (sound === 'klik') {
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = accent ? 1200 : 900
    gain.gain.setValueAtTime(vol * 0.8, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06)
    osc.connect(gain); gain.connect(ctx.destination)
    osc.start(time); osc.stop(time + 0.07)

  } else if (sound === 'hout') {
    // woodblock: two brief oscillators
    [accent ? 1800 : 1400, accent ? 2600 : 2000].forEach((f, i) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = f
      gain.gain.setValueAtTime(vol * (i === 0 ? 0.7 : 0.3), time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.035)
      osc.connect(gain); gain.connect(ctx.destination)
      osc.start(time); osc.stop(time + 0.04)
    })

  } else if (sound === 'tikkel') {
    const buf  = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.018), ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
    const src  = ctx.createBufferSource(); src.buffer = buf
    const hp   = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(vol * 0.9, time)
    src.connect(hp); hp.connect(gain); gain.connect(ctx.destination)
    src.start(time); src.stop(time + 0.02)

  } else { // bel
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = accent ? 880 : 660
    gain.gain.setValueAtTime(0, time)
    gain.gain.linearRampToValueAtTime(vol * 0.5, time + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.001, time + (accent ? 0.35 : 0.2))
    osc.connect(gain); gain.connect(ctx.destination)
    osc.start(time); osc.stop(time + 0.4)
  }
}

// ── tap tempo ─────────────────────────────────────────────────────
function calcTapBpm(taps: number[]) {
  if (taps.length < 2) return 0
  const last = taps.slice(-8)
  const avg  = last.slice(1).reduce((s, t, i) => s + (t - last[i]), 0) / (last.length - 1)
  return Math.round(60000 / avg)
}

// ═════════════════════════════════════════════════════════════════
export default function Metronome({ defaultBpm = 120, compact = false }: { defaultBpm?: number; compact?: boolean }) {
  const [bpm,        setBpm]     = useState(defaultBpm)
  const [playing,    setPlaying] = useState(false)
  const [timeSig,    setTimeSig] = useState<TimeSig>('4/4')
  const [accents,    setAccents] = useState<boolean[]>([true, false, false, false])
  const [sound,      setSound]   = useState<SoundType>('klik')
  const [activeBeat, setActive]  = useState(-1)
  const [flash,      setFlash]   = useState(false)
  const [taps,       setTaps]    = useState<number[]>([])

  const ctxRef    = useRef<AudioContext | null>(null)
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const nextTime  = useRef(0)
  const beatIdx   = useRef(0)
  const bpmRef    = useRef(bpm)
  const beatsRef  = useRef(4)
  const accRef    = useRef(accents)
  const soundRef  = useRef(sound)

  useEffect(() => { bpmRef.current  = bpm },          [bpm])
  useEffect(() => { soundRef.current = sound },        [sound])
  useEffect(() => { accRef.current   = accents },      [accents])
  useEffect(() => { beatsRef.current = TIME_SIGS.find(t => t.sig === timeSig)!.beats }, [timeSig])

  // sync accents when time sig changes
  useEffect(() => {
    const def = TIME_SIGS.find(t => t.sig === timeSig)!.defaultAccents
    setAccents([...def])
  }, [timeSig])

  const schedule = useCallback(() => {
    if (!ctxRef.current) return
    while (nextTime.current < ctxRef.current.currentTime + 0.1) {
      const i       = beatIdx.current
      const accent  = accRef.current[i]
      const isFirst = i === 0
      playClick(ctxRef.current, nextTime.current, accent, soundRef.current)

      const delay = (nextTime.current - ctxRef.current.currentTime) * 1000
      const snap  = i
      setTimeout(() => {
        setActive(snap)
        if (isFirst) { setFlash(true); setTimeout(() => setFlash(false), 80) }
      }, Math.max(0, delay))

      nextTime.current += 60 / bpmRef.current
      beatIdx.current   = (beatIdx.current + 1) % beatsRef.current
    }
  }, [])

  function start() {
    if (!ctxRef.current) ctxRef.current = new AudioContext()
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume()
    beatIdx.current  = 0
    nextTime.current = ctxRef.current.currentTime + 0.05
    timerRef.current = setInterval(schedule, 25)
    setPlaying(true)
  }

  function stop() {
    if (timerRef.current) clearInterval(timerRef.current)
    setPlaying(false)
    setActive(-1)
    setFlash(false)
  }

  function changeBpm(d: number) {
    setBpm(b => Math.min(200, Math.max(40, b + d)))
  }

  function tap() {
    const now = Date.now()
    setTaps(prev => {
      const next = prev.length > 0 && now - prev[prev.length - 1] > 3000 ? [now] : [...prev, now]
      const calc = calcTapBpm(next)
      if (calc >= 40 && calc <= 200) setBpm(calc)
      return next
    })
  }

  function toggleAccent(i: number) {
    if (i === 0) return
    setAccents(a => a.map((v, idx) => idx === i ? !v : v))
  }

  const beats = TIME_SIGS.find(t => t.sig === timeSig)!.beats

  return (
    <div className="select-none">
      {flash && (
        <div className="fixed inset-0 pointer-events-none z-50 opacity-15"
          style={{ background: 'var(--accent)', transition: 'opacity .08s' }} />
      )}

      <div className="rounded-3xl overflow-hidden" style={{ background: '#0a1020', border: '1px solid #1b2d47' }}>

        {/* ── Beat dots ─────────────────────────────── */}
        <div className="px-6 pt-7 pb-4">
          <div className="flex justify-center items-end gap-2 flex-wrap">
            {Array.from({ length: beats }, (_, i) => {
              const isActive = activeBeat === i
              const isAccent = accents[i]
              return (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <button
                    onClick={() => toggleAccent(i)}
                    className="rounded-full transition-all duration-75"
                    style={{
                      width:     compact ? 30 : 42,
                      height:    compact ? 30 : 42,
                      background: isActive
                        ? (isAccent ? '#DAD74D' : '#50B4E4')
                        : (isAccent ? '#1e2b1a' : '#1b2d47'),
                      transform:  `scale(${isActive ? 1.35 : 1})`,
                      boxShadow:  isActive ? `0 0 18px ${isAccent ? '#DAD74Daa' : '#50B4E4aa'}` : 'none',
                      cursor:     i === 0 ? 'default' : 'pointer',
                    }}
                  />
                  <span style={{ color: '#3a5a7a', fontSize: 9 }}>{i + 1}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── BPM ───────────────────────────────────── */}
        <div className="px-6 pb-2 text-center">
          <div className="text-xs font-medium tracking-widest uppercase mb-1" style={{ color: '#4a6a8a' }}>
            {tempoName(bpm)}
          </div>

          <div className="flex items-center justify-center gap-3">
            <div className="flex gap-1">
              <button onClick={() => changeBpm(-10)}
                className="w-9 h-9 rounded-xl text-xs font-bold transition hover:opacity-80"
                style={{ background: '#0d1626', color: '#5a7a9a', border: '1px solid #1b2d47' }}>−10</button>
              <button onClick={() => changeBpm(-1)}
                className="w-9 h-9 rounded-xl text-lg font-bold transition hover:opacity-80"
                style={{ background: '#0d1626', color: '#a0b8cc', border: '1px solid #1b2d47' }}>−</button>
            </div>

            <input
              type="number" min={40} max={200} value={bpm}
              onChange={e => setBpm(Math.min(200, Math.max(40, parseInt(e.target.value) || bpm)))}
              className="text-center bg-transparent outline-none tabular-nums font-black text-white"
              style={{ fontSize: compact ? 52 : 76, lineHeight: 1, width: compact ? 90 : 110 }}
            />

            <div className="flex gap-1">
              <button onClick={() => changeBpm(1)}
                className="w-9 h-9 rounded-xl text-lg font-bold transition hover:opacity-80"
                style={{ background: '#0d1626', color: '#a0b8cc', border: '1px solid #1b2d47' }}>+</button>
              <button onClick={() => changeBpm(10)}
                className="w-9 h-9 rounded-xl text-xs font-bold transition hover:opacity-80"
                style={{ background: '#0d1626', color: '#5a7a9a', border: '1px solid #1b2d47' }}>+10</button>
            </div>
          </div>

          {/* Slider 40–200, 120 = middle */}
          <div className="mt-2 mb-1 px-2">
            <input type="range" min={40} max={200} value={bpm}
              onChange={e => setBpm(Number(e.target.value))}
              className="w-full h-1 rounded-full cursor-pointer"
              style={{ accentColor: '#50B4E4' }} />
            <div className="flex justify-between text-xs mt-0.5" style={{ color: '#2a4060' }}>
              <span>40</span><span className="opacity-50">120</span><span>200</span>
            </div>
          </div>
        </div>

        {/* ── Maatsoort + Geluid ────────────────────── */}
        <div className="px-6 pb-4 flex gap-6 flex-wrap">
          <div>
            <div className="text-xs mb-2 uppercase tracking-wider" style={{ color: '#3a5a7a' }}>Maatsoort</div>
            <div className="flex gap-1.5">
              {TIME_SIGS.map(({ sig }) => (
                <button key={sig} onClick={() => setTimeSig(sig)}
                  className="px-3 h-8 rounded-lg text-sm font-bold transition"
                  style={{
                    background: timeSig === sig ? 'var(--accent)' : '#0d1626',
                    color:      timeSig === sig ? 'white' : '#5a7a9a',
                    border:     '1px solid #1b2d47',
                  }}>
                  {sig}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs mb-2 uppercase tracking-wider" style={{ color: '#3a5a7a' }}>Geluid</div>
            <div className="flex gap-1.5">
              {SOUNDS.map(({ id, label }) => (
                <button key={id} onClick={() => setSound(id)}
                  className="px-3 h-8 rounded-lg text-sm font-bold transition"
                  style={{
                    background: sound === id ? '#1b2d47' : '#0d1626',
                    color:      sound === id ? '#e8edf5' : '#5a7a9a',
                    border:     `1px solid ${sound === id ? '#50B4E4' : '#1b2d47'}`,
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Play + Tap ────────────────────────────── */}
        <div className="px-6 pb-7 flex gap-3">
          <button onClick={playing ? stop : start}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-lg transition"
            style={{ background: playing ? '#dc2626' : 'var(--accent)', color: 'white' }}>
            {playing
              ? <><Square size={20} fill="white" /> Stop</>
              : <><Play  size={20} fill="white" /> Start</>}
          </button>

          <button onClick={tap}
            className="flex-1 flex items-center justify-center py-4 rounded-2xl font-bold text-base transition active:scale-95"
            style={{ background: '#0d1626', color: '#a0b8cc', border: '2px solid #1b2d47' }}>
            Tap
          </button>
        </div>
      </div>
    </div>
  )
}
