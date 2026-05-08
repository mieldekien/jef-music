'use client'
import { useState, useRef, useEffect } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'

// MIDI drum note → row index (0=snare R, 1=snare L, 2=bass, 3=hihat)
const DRUM_MAP: Record<number, number> = {
  36: 2, 35: 2,                    // bass drum
  38: 0, 40: 0, 37: 0,             // snare
  42: 3, 44: 3, 46: 3,             // hi-hat
  49: 3, 51: 3, 53: 3, 57: 3,     // crash / ride
}

function noteFreq(midi: number) {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

function playNote(ctx: AudioContext, time: number, midi: number, velocity: number, duration: number, isDrum: boolean) {
  if (isDrum) {
    const row = DRUM_MAP[midi] ?? 0
    // reuse same logic as DrumGrid: simple noise/sine combos
    if (row === 2) {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.setValueAtTime(80, time)
      osc.frequency.exponentialRampToValueAtTime(40, time + 0.15)
      gain.gain.setValueAtTime(0.7 * velocity, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2)
      osc.connect(gain); gain.connect(ctx.destination)
      osc.start(time); osc.stop(time + 0.22)
    } else if (row === 3) {
      const buf  = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
      const src  = ctx.createBufferSource()
      src.buffer = buf
      const bp   = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 8000
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.3 * velocity, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05)
      src.connect(bp); bp.connect(gain); gain.connect(ctx.destination)
      src.start(time); src.stop(time + 0.06)
    } else {
      const buf  = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
      const src  = ctx.createBufferSource(); src.buffer = buf
      const hp   = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1600
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.5 * velocity, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.13)
      const osc  = ctx.createOscillator()
      const og   = ctx.createGain()
      osc.frequency.value = 200
      og.gain.setValueAtTime(0.35 * velocity, time)
      og.gain.exponentialRampToValueAtTime(0.001, time + 0.07)
      src.connect(hp); hp.connect(gain); gain.connect(ctx.destination)
      osc.connect(og); og.connect(ctx.destination)
      src.start(time); src.stop(time + 0.15)
      osc.start(time); osc.stop(time + 0.09)
    }
  } else {
    // melodic note: simple sine + triangle
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = noteFreq(midi)
    osc.type = 'triangle'
    const dur = Math.min(duration, 1.5)
    gain.gain.setValueAtTime(0.3 * velocity, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur)
    osc.connect(gain); gain.connect(ctx.destination)
    osc.start(time); osc.stop(time + dur + 0.05)
  }
}

interface Props {
  midiUrl: string
  label?: string
}

export default function MidiPlayer({ midiUrl, label = 'MIDI Afspelen' }: Props) {
  const [playing,   setPlaying]   = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [progress,  setProgress]  = useState(0)   // 0-1
  const [duration,  setDuration]  = useState(0)
  const [error,     setError]     = useState('')

  const ctx      = useRef<AudioContext | null>(null)
  const startAt  = useRef(0)   // AudioContext time when playback started
  const totalDur = useRef(0)
  const rafRef   = useRef<number>(0)
  const stoppedRef = useRef(false)

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current)
    ctx.current?.close()
  }, [])

  async function loadAndPlay() {
    if (playing) return stop()

    setLoading(true)
    setError('')

    try {
      if (!ctx.current) ctx.current = new AudioContext()
      if (ctx.current.state === 'suspended') await ctx.current.resume()

      // Dynamically import @tonejs/midi to keep bundle lean
      const { Midi } = await import('@tonejs/midi')
      const res  = await fetch(midiUrl)
      const buf  = await res.arrayBuffer()
      const midi = new Midi(buf)

      const now   = ctx.current.currentTime + 0.1
      let   maxT  = 0

      for (const track of midi.tracks) {
        const isDrum = track.channel === 9
        for (const note of track.notes) {
          const t = now + note.time
          playNote(ctx.current, t, note.midi, note.velocity, note.duration, isDrum)
          maxT = Math.max(maxT, t + note.duration)
        }
      }

      totalDur.current = maxT - now
      setDuration(totalDur.current)
      startAt.current  = now
      stoppedRef.current = false
      setPlaying(true)

      function tick() {
        if (stoppedRef.current || !ctx.current) return
        const elapsed = ctx.current.currentTime - startAt.current
        const p = Math.min(elapsed / totalDur.current, 1)
        setProgress(p)
        if (p < 1) {
          rafRef.current = requestAnimationFrame(tick)
        } else {
          setPlaying(false)
          setProgress(0)
        }
      }
      rafRef.current = requestAnimationFrame(tick)

    } catch (e) {
      setError('Kon MIDI niet laden: ' + String(e))
    } finally {
      setLoading(false)
    }
  }

  function stop() {
    stoppedRef.current = true
    cancelAnimationFrame(rafRef.current)
    ctx.current?.close()
    ctx.current = null
    setPlaying(false)
    setProgress(0)
  }

  function fmt(s: number) {
    const m = Math.floor(s / 60)
    return `${m}:${String(Math.floor(s % 60)).padStart(2,'0')}`
  }

  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-3">
        <button onClick={loadAndPlay} disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition"
          style={{ background: loading ? '#333' : playing ? '#dc2626' : 'var(--accent)' }}>
          {loading ? '●●●' : playing ? <><Pause size={16} />Stop</> : <><Play size={16} />{label}</>}
        </button>

        {playing && (
          <button onClick={stop}
            className="p-2 rounded-xl"
            style={{ background: 'var(--border)', color: '#7a9ab8' }}>
            <RotateCcw size={15} />
          </button>
        )}

        {duration > 0 && (
          <span className="text-xs tabular-nums ml-auto" style={{ color: '#4a6a8a' }}>
            {fmt(progress * duration)} / {fmt(duration)}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {(playing || progress > 0) && (
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1b2d47' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${progress * 100}%`, background: 'var(--accent)' }} />
        </div>
      )}

      {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}
    </div>
  )
}
