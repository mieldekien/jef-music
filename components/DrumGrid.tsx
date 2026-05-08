'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { Play, Square, Trash2 } from 'lucide-react'

// ── rows ──────────────────────────────────────────────────────────
const ROWS = [
  { id: 'r', label: 'Rechts (R)', color: '#50B4E4', short: 'R' },
  { id: 'l', label: 'Links (L)',  color: '#DAD74D', short: 'L' },
  { id: 'b', label: 'Gr. Trom',  color: '#9b8ab8', short: 'B' },
  { id: 'h', label: 'Bekkens',   color: '#7ac4a0', short: 'H' },
]
const STEPS = 16

// ── preset rudiments ──────────────────────────────────────────────
const B = (s: string) => s.split('').map(c => c === '1')

const PRESETS: Record<string, boolean[][]> = {
  'Enkele Slag': [
    B('1010101010101010'),
    B('0101010101010101'),
    B('0000000000000000'),
    B('0000000000000000'),
  ],
  'Dubbele Slag': [
    B('1100110011001100'),
    B('0011001100110011'),
    B('0000000000000000'),
    B('0000000000000000'),
  ],
  'Paradiddle': [
    B('1011010110110101'),
    B('0100101001001010'),
    B('0000000000000000'),
    B('0000000000000000'),
  ],
  'Marsmaat': [
    B('1000100010001000'),
    B('0100010001000100'),
    B('1000000010000000'),
    B('0001000000010000'),
  ],
  'Flam': [
    B('1001001010010010'),
    B('0110110101101101'),
    B('0000000000000000'),
    B('0000000000000000'),
  ],
}
const PRESET_NAMES = Object.keys(PRESETS)

// ── drum sounds via Web Audio API ─────────────────────────────────
function playDrum(ctx: AudioContext, time: number, row: number) {
  switch (row) {
    case 0: // snare R — noise + body
    case 1: { // snare L — slightly different pitch
      const buf  = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1

      const src  = ctx.createBufferSource()
      src.buffer = buf

      const hp   = ctx.createBiquadFilter()
      hp.type    = 'highpass'
      hp.frequency.value = row === 0 ? 1800 : 1400

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(row === 0 ? 0.6 : 0.5, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.13)

      src.connect(hp); hp.connect(gain); gain.connect(ctx.destination)
      src.start(time); src.stop(time + 0.15)

      // body tone
      const osc   = ctx.createOscillator()
      const ogain = ctx.createGain()
      osc.frequency.value = row === 0 ? 210 : 190
      ogain.gain.setValueAtTime(0.4, time)
      ogain.gain.exponentialRampToValueAtTime(0.001, time + 0.08)
      osc.connect(ogain); ogain.connect(ctx.destination)
      osc.start(time); osc.stop(time + 0.1)
      break
    }
    case 2: { // bass drum — deep sine
      const osc   = ctx.createOscillator()
      const gain  = ctx.createGain()
      osc.frequency.setValueAtTime(80, time)
      osc.frequency.exponentialRampToValueAtTime(40, time + 0.15)
      gain.gain.setValueAtTime(0.9, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22)
      osc.connect(gain); gain.connect(ctx.destination)
      osc.start(time); osc.stop(time + 0.25)
      break
    }
    case 3: { // hi-hat — short noise burst
      const buf  = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1

      const src  = ctx.createBufferSource()
      src.buffer = buf

      const bp   = ctx.createBiquadFilter()
      bp.type    = 'bandpass'
      bp.frequency.value = 8000
      bp.Q.value         = 0.7

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.4, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05)

      src.connect(bp); bp.connect(gain); gain.connect(ctx.destination)
      src.start(time); src.stop(time + 0.06)
      break
    }
  }
}

// ═══════════════════════════════════════════════════════════════
export default function DrumGrid({ defaultBpm = 90 }: { defaultBpm?: number }) {
  const empty = () => ROWS.map(() => Array<boolean>(STEPS).fill(false))

  const [grid,    setGrid]    = useState<boolean[][]>(empty)
  const [bpm,     setBpm]     = useState(defaultBpm)
  const [playing, setPlaying] = useState(false)
  const [step,    setStep]    = useState(-1)
  const [preset,  setPreset]  = useState('')

  const ctx          = useRef<AudioContext | null>(null)
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const nextTime     = useRef(0)
  const stepIdx      = useRef(0)
  const bpmRef       = useRef(bpm)
  const gridRef      = useRef(grid)

  useEffect(() => { bpmRef.current = bpm },  [bpm])
  useEffect(() => { gridRef.current = grid }, [grid])

  const schedule = useCallback(() => {
    if (!ctx.current) return
    const LOOK = 0.1
    while (nextTime.current < ctx.current.currentTime + LOOK) {
      const s = stepIdx.current
      for (let r = 0; r < ROWS.length; r++) {
        if (gridRef.current[r][s]) playDrum(ctx.current!, nextTime.current, r)
      }
      const delay = (nextTime.current - ctx.current.currentTime) * 1000
      const snap  = s
      setTimeout(() => setStep(snap), Math.max(0, delay))

      nextTime.current += 60 / (bpmRef.current * 4)  // 16th notes
      stepIdx.current   = (stepIdx.current + 1) % STEPS
    }
  }, [])

  function start() {
    if (!ctx.current) ctx.current = new AudioContext()
    if (ctx.current.state === 'suspended') ctx.current.resume()
    stepIdx.current  = 0
    nextTime.current = ctx.current.currentTime + 0.05
    timerRef.current = setInterval(schedule, 25)
    setPlaying(true)
  }

  function stop() {
    if (timerRef.current) clearInterval(timerRef.current)
    setPlaying(false)
    setStep(-1)
  }

  function toggle(row: number, col: number) {
    setGrid(g => {
      const n = g.map(r => [...r])
      n[row][col] = !n[row][col]
      return n
    })
    setPreset('')
  }

  function applyPreset(name: string) {
    setGrid(PRESETS[name].map(r => [...r]))
    setPreset(name)
  }

  function clear() {
    setGrid(empty())
    setPreset('')
  }

  return (
    <div className="rounded-3xl overflow-hidden select-none" style={{ background: '#0a1020', border: '1px solid #1b2d47' }}>

      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={playing ? stop : start}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition"
            style={{ background: playing ? '#dc2626' : 'var(--accent)', color: 'white' }}>
            {playing ? <><Square size={14} fill="white" /> Stop</> : <><Play size={14} fill="white" /> Speel</>}
          </button>
          <button onClick={clear}
            className="p-2 rounded-xl transition hover:opacity-80"
            style={{ background: '#0d1626', color: '#4a6a8a', border: '1px solid #1b2d47' }}>
            <Trash2 size={15} />
          </button>
        </div>

        {/* BPM */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tabular-nums text-white">{bpm}</span>
          <input type="range" min={40} max={200} value={bpm}
            onChange={e => setBpm(Number(e.target.value))}
            className="w-24 h-1 rounded cursor-pointer"
            style={{ accentColor: '#50B4E4' }} />
        </div>
      </div>

      {/* Presets */}
      <div className="px-5 pb-3 flex gap-2 flex-wrap">
        {PRESET_NAMES.map(n => (
          <button key={n} onClick={() => applyPreset(n)}
            className="text-xs px-3 py-1 rounded-full font-medium transition"
            style={{
              background: preset === n ? 'var(--accent)' : '#0d1626',
              color:      preset === n ? 'white' : '#4a6a8a',
              border:     '1px solid #1b2d47',
            }}>
            {n}
          </button>
        ))}
      </div>

      {/* Step numbers */}
      <div className="px-5 pb-1">
        <div className="grid gap-1" style={{ gridTemplateColumns: `64px repeat(${STEPS}, 1fr)` }}>
          <div />
          {Array.from({ length: STEPS }, (_, i) => (
            <div key={i} className="text-center" style={{ color: i % 4 === 0 ? '#3a5a7a' : '#1b2d47', fontSize: 9 }}>
              {i % 4 === 0 ? i / 4 + 1 : '·'}
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="px-5 pb-5 space-y-1.5">
        {ROWS.map((row, ri) => (
          <div key={row.id} className="grid items-center gap-1"
            style={{ gridTemplateColumns: `64px repeat(${STEPS}, 1fr)` }}>

            <span className="text-xs font-semibold pr-1 truncate" style={{ color: row.color, fontSize: 10 }}>
              {row.label}
            </span>

            {grid[ri].map((on, si) => {
              const isActive = step === si && playing
              return (
                <button
                  key={si}
                  onClick={() => toggle(ri, si)}
                  className="rounded transition-all"
                  style={{
                    height: 28,
                    background: on
                      ? isActive ? row.color : row.color + 'aa'
                      : isActive ? '#1f3050' : '#0d1626',
                    border: `1px solid ${on ? row.color + '55' : '#1b2d47'}`,
                    boxShadow: on && isActive ? `0 0 8px ${row.color}88` : 'none',
                    transform: on && isActive ? 'scale(1.05)' : 'scale(1)',
                  }}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
