'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Play, Pause, RotateCcw, Music2 } from 'lucide-react'

// ── WAF types ─────────────────────────────────────────────────────
interface WafZone {
  keyRangeLow: number; keyRangeHigh: number
  originalPitch: number; coarseTune: number; fineTune: number
  loopStart: number; loopEnd: number; sampleRate: number
  file: string; buffer?: AudioBuffer
}
interface WafInst { zones: WafZone[] }

interface MidiNote {
  time: number; midi: number; duration: number; velocity: number
  trackIdx: number; percussion: boolean; wafFile: string
}

interface Props {
  xmlUrl: string
  mp3Url?: string | null
  midiUrl?: string | null
  // External control
  noBar?: boolean
  looping?: boolean
  toggleCount?: number
  resetCount?: number
  externalPracticeMode?: boolean
  mutedTracks?: number[]
  visibleInstruments?: number[]       // OSMD part indices to show; empty = show all
  disableScroll?: boolean
  disableHighlight?: boolean
  onPlayingChange?: (playing: boolean) => void
  onCanPlayChange?: (canPlay: boolean) => void
  onTracksReady?: (names: string[]) => void
  onInstrumentsReady?: (names: string[]) => void
  onMeasureChange?: (measure: number) => void
}

// ── Module-level WAF cache ────────────────────────────────────────
const wafCache = new Map<string, WafInst>()

function wafVarName(filename: string): string {
  // '12838_0_JCLive_sf2_file' → '_drum_38_0_JCLive_sf2_file'
  // '0120_JCLive_sf2_file'    → '_tone_0120_JCLive_sf2_file'
  return filename.startsWith('128')
    ? '_drum_' + filename.slice(3)
    : '_tone_' + filename
}

function loadWafScript(filename: string): Promise<WafInst | null> {
  if (wafCache.has(filename)) return Promise.resolve(wafCache.get(filename)!)
  const url = `https://surikov.github.io/webaudiofontdata/sound/${filename}.js`
  const varName = wafVarName(filename)
  return new Promise(resolve => {
    const script = document.createElement('script')
    script.src = url
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inst = (window as any)[varName] as WafInst | undefined
      if (inst) { wafCache.set(filename, inst); resolve(inst) }
      else resolve(null)
    }
    script.onerror = () => resolve(null)
    document.head.appendChild(script)
  })
}

async function decodeWafInst(ac: AudioContext, inst: WafInst): Promise<void> {
  await Promise.allSettled(inst.zones.map(async zone => {
    if (zone.buffer) return
    try {
      const b64 = zone.file
      const bin = atob(b64)
      const bytes = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
      zone.buffer = await ac.decodeAudioData(bytes.buffer.slice(0))
    } catch { /* ok */ }
  }))
}

function wafPlayNote(ac: AudioContext, inst: WafInst, note: number, when: number, dur: number, vel: number): void {
  const zone = inst.zones.find(z => z.keyRangeLow <= note && note <= z.keyRangeHigh)
  if (!zone?.buffer) return
  const src = ac.createBufferSource()
  src.buffer = zone.buffer
  const detune = (note - zone.originalPitch / 100) + zone.coarseTune + zone.fineTune / 100
  src.playbackRate.value = Math.pow(2, detune / 12)
  if (zone.loopStart > 0 && zone.loopEnd > 0) {
    src.loop = true
    src.loopStart = zone.loopStart / ac.sampleRate
    src.loopEnd   = zone.loopEnd   / ac.sampleRate
  }
  const g = ac.createGain(); g.gain.value = vel
  src.connect(g); g.connect(ac.destination)
  src.start(when); src.stop(when + dur)
}

// GM program → WAF melodic filename
function melodicWaf(program: number): string {
  const map: Record<number, string> = {
    9:  '0090_JCLive_sf2_file',  // glockenspiel (lyra)
    11: '0110_JCLive_sf2_file',  // vibraphone
    12: '0120_JCLive_sf2_file',  // marimba
    13: '0130_JCLive_sf2_file',  // xylophone
  }
  return map[program] ?? '0120_JCLive_sf2_file'
}

// Drum MIDI note → WAF filename
const drumWaf = (note: number) => `128${note}_0_JCLive_sf2_file`

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`
}

// ── Component ─────────────────────────────────────────────────────
export default function ScorePlayer({
  xmlUrl, mp3Url, midiUrl,
  noBar, looping, toggleCount, resetCount, externalPracticeMode,
  mutedTracks, visibleInstruments, disableScroll, disableHighlight,
  onPlayingChange, onCanPlayChange, onTracksReady, onInstrumentsReady, onMeasureChange,
}: Props) {
  const scoreRef           = useRef<HTMLDivElement>(null)
  const scoreContainerRef  = useRef<HTMLDivElement>(null)
  const prevColoredEls     = useRef<Array<{ el: SVGElement; origFill: string }>>([])
  const prevCursorAbsTop    = useRef(-999)
  const lastMeasureRef      = useRef(-1)
  const disableScrollRef    = useRef(!!disableScroll)
  const disableHighlightRef = useRef(!!disableHighlight)
  const onMeasureChangeRef  = useRef(onMeasureChange)
  const [scoreStatus, setScoreStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  const [playing,         setPlayingState]     = useState(false)
  const playingRef = useRef(false)
  function setPlaying(v: boolean) {
    playingRef.current = v
    setPlayingState(v)
    onPlayingChange?.(v)
  }
  const [progress,        setProgress]        = useState(0)
  const [elapsed,         setElapsed]         = useState(0)
  const [duration,        setDuration]        = useState(0)
  const [audioReady,      setAudioReady]      = useState(false)
  const [practiceMode,    setPracticeMode]    = useState(false)
  const [practiceLoading, setPracticeLoading] = useState(false)
  const [practiceReady,   setPracticeReady]   = useState(false)
  const [trackNames,      setTrackNames]      = useState<string[]>([])
  const [, forceUpdate] = useState(0)

  const mutedRef        = useRef<Set<number>>(new Set())
  const mutedTracksRef  = useRef<Set<number>>(new Set())

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rt = useRef<{
    mode: 'mp3' | 'practice'
    osmd: any; cursor: any
    cursorTimes: number[]; cursorIdx: number
    bpm: number; totalDuration: number; raf: number
    // MP3
    audio: HTMLAudioElement | null
    // Practice
    practiceAc: AudioContext | null
    wafInsts: Map<string, WafInst | null>
    allNotes: MidiNote[]; noteIdx: number
    practiceOffset: number; practiceAcStart: number
    schedulerTimer: ReturnType<typeof setInterval> | null
  }>({
    mode: 'mp3',
    osmd: null, cursor: null,
    cursorTimes: [], cursorIdx: 0,
    bpm: 120, totalDuration: 0, raf: 0,
    audio: null,
    practiceAc: null, wafInsts: new Map(),
    allNotes: [], noteIdx: 0,
    practiceOffset: 0, practiceAcStart: 0,
    schedulerTimer: null,
  })

  // Keep refs in sync with props (avoids stale closures in tick/rAF)
  disableScrollRef.current    = !!disableScroll
  disableHighlightRef.current = !!disableHighlight
  onMeasureChangeRef.current  = onMeasureChange

  // ── Cursor styling helper ─────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function applyCursorStyle(osmd: any) {
    try {
      const cursor = osmd.cursor
      cursor.show(); cursor.reset()
      rt.current.cursor = cursor
      rt.current.cursorIdx = 0
      setTimeout(() => {
        try {
          const el = cursor.cursorElement as HTMLElement
          if (!el) return
          el.style.opacity = '0.55'; el.style.width = '3px'; el.style.overflow = 'hidden'
          el.querySelectorAll('*').forEach((c: Element) => {
            const s = (c as HTMLElement).style
            if (s) { s.fill = '#2563eb'; s.stroke = 'none' }
          })
        } catch { /* ok */ }
      }, 200)
    } catch { /* ok */ }
  }

  // ── 1a. OSMD load (parse only, before div is visible) ───────────
  useEffect(() => {
    if (!scoreRef.current || !xmlUrl) return
    let cancelled = false
    setScoreStatus('loading')
    ;(async () => {
      try {
        const { OpenSheetMusicDisplay } = await import('opensheetmusicdisplay')
        if (cancelled) return
        const osmd = new OpenSheetMusicDisplay(scoreRef.current!, {
          autoResize: true, backend: 'svg',
          drawingParameters: 'default',
          defaultColorMusic: '#1a1a1a',
          pageFormat: 'Endless',
          drawTitle: true, drawSubtitle: false,
          drawComposer: true, drawLyricist: false,
        })
        await osmd.load(xmlUrl)
        if (cancelled) return
        rt.current.osmd = osmd
        setScoreStatus('ready')  // div becomes display:block → render in next effect
      } catch (e) {
        console.error('OSMD error:', e)
        if (!cancelled) setScoreStatus('error')
      }
    })()
    return () => { cancelled = true }
  }, [xmlUrl])

  // ── 1b. OSMD render (after div is visible in DOM) ─────────────
  useEffect(() => {
    if (scoreStatus !== 'ready' || !rt.current.osmd) return
    const osmd = rt.current.osmd
    const containerWidth = scoreRef.current?.offsetWidth ?? 800
    const isMobile = containerWidth < 600
    osmd.zoom = isMobile ? 0.40 : 0.75
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rules = (osmd as any).DrawingParameters?.Rules
      if (rules) {
        rules.PageTopMargin = 5; rules.PageBottomMargin = 5
        rules.PageLeftMargin = isMobile ? 0 : 12
        rules.PageRightMargin = isMobile ? 0 : 12
      }
    } catch { /* ok */ }
    try { osmd.render() } catch (e) { console.error('OSMD render error:', e) }
    applyCursorStyle(osmd)

    // Report instrument/part names from MusicXML
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const insts = (osmd as any).Sheet?.Instruments as any[] | undefined
      if (insts) onInstrumentsReady?.(insts.map((inst, i) => inst.Name || `Part ${i + 1}`))
    } catch { /* ok */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoreStatus])

  // ── 1c. OSMD instrument visibility filter ────────────────────────
  useEffect(() => {
    if (scoreStatus !== 'ready' || !rt.current.osmd) return
    const osmd = rt.current.osmd
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const insts = (osmd as any).Sheet?.Instruments as any[] | undefined
      if (!insts) return
      insts.forEach((inst: any, i: number) => {
        inst.Visible = !visibleInstruments || visibleInstruments.length === 0 || visibleInstruments.includes(i)
      })
      const savedIdx = rt.current.cursorIdx
      osmd.render()
      if (rt.current.bpm) buildCursorMap(rt.current.bpm)
      applyCursorStyle(osmd)
      // Restore cursor to saved position
      try {
        const cursor = osmd.cursor
        cursor.show(); cursor.reset()
        rt.current.cursor = cursor
        for (let i = 0; i < savedIdx; i++) cursor.next()
        rt.current.cursorIdx = savedIdx
      } catch { /* ok */ }
    } catch (e) { console.error('OSMD filter error:', e) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleInstruments])

  // ── 2. MIDI metadata + note list ─────────────────────────────────
  useEffect(() => {
    if (!midiUrl) return
    ;(async () => {
      try {
        const { Midi } = await import('@tonejs/midi')
        const buf  = await fetch(midiUrl).then(r => r.arrayBuffer())
        const midi = new Midi(buf)
        const bpm  = midi.header.tempos[0]?.bpm ?? 120
        rt.current.bpm           = bpm
        rt.current.totalDuration = midi.duration

        const activeTracks = midi.tracks.filter(t => t.notes.length > 0)
        const names = activeTracks.map((t, i) => t.name || t.instrument.name || `Track ${i + 1}`)
        setTrackNames(names)
        onTracksReady?.(names)

        rt.current.allNotes = activeTracks
          .flatMap((track, idx) => {
            const perc = track.instrument.percussion
            const prog = track.instrument.number
            return track.notes.map(n => ({
              time: n.time, midi: n.midi,
              duration: Math.max(n.duration, 0.05),
              velocity: n.velocity,
              trackIdx: idx, percussion: perc,
              wafFile: perc ? drumWaf(n.midi) : melodicWaf(prog),
            }))
          })
          .sort((a, b) => a.time - b.time)

        buildCursorMap(bpm)
      } catch (e) { console.error('MIDI error:', e) }
    })()
  }, [midiUrl])

  useEffect(() => {
    if (scoreStatus === 'ready' && rt.current.bpm) buildCursorMap(rt.current.bpm)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoreStatus])

  // ── Unmount cleanup ──────────────────────────────────────────────
  useEffect(() => {
    return () => {
      const r = rt.current
      cancelAnimationFrame(r.raf)
      if (r.schedulerTimer) clearInterval(r.schedulerTimer)
      r.audio?.pause()
      r.practiceAc?.close().catch(() => { /* ok */ })
    }
  }, [])

  // ── 3. MP3 ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!mp3Url) return
    const audio = new Audio(mp3Url)
    audio.preload = 'metadata'
    rt.current.audio = audio
    audio.onloadedmetadata = () => {
      setDuration(audio.duration)
      if (!rt.current.totalDuration) rt.current.totalDuration = audio.duration
      setAudioReady(true)
      onCanPlayChange?.(true)
    }
    audio.onended = () => {
      if (audio.loop) return  // loop handled by browser
      cancelAnimationFrame(rt.current.raf)
      setPlaying(false)
    }
    return () => { audio.pause(); rt.current.audio = null; setAudioReady(false); onCanPlayChange?.(false) }
  }, [mp3Url])

  // ── Looping ──────────────────────────────────────────────────────
  useEffect(() => {
    if (rt.current.audio) rt.current.audio.loop = !!looping
  }, [looping])

  // ── Sync external muted tracks ────────────────────────────────────
  useEffect(() => {
    mutedTracksRef.current = new Set(mutedTracks ?? [])
  }, [mutedTracks])

  // ── External toggleCount / resetCount ─────────────────────────────
  const prevToggle = useRef(0)
  useEffect(() => {
    if (!toggleCount || toggleCount === prevToggle.current) return
    prevToggle.current = toggleCount
    togglePlay()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toggleCount])

  const prevReset = useRef(0)
  useEffect(() => {
    if (!resetCount || resetCount === prevReset.current) return
    prevReset.current = resetCount
    reset()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetCount])

  // ── External practice mode ────────────────────────────────────────
  const prevExtPractice = useRef<boolean | undefined>(undefined)
  useEffect(() => {
    if (externalPracticeMode === undefined) return
    if (externalPracticeMode === prevExtPractice.current) return
    prevExtPractice.current = externalPracticeMode
    switchMode(externalPracticeMode)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalPracticeMode])

  // ── Helpers ───────────────────────────────────────────────────────
  function buildCursorMap(bpm: number) {
    const cursor = rt.current.cursor
    if (!cursor) return
    const spb = 60 / bpm
    const times: number[] = []
    try {
      cursor.reset()
      while (!cursor.Iterator.EndReached) {
        times.push(cursor.Iterator.currentTimeStamp.RealValue * 4 * spb)
        cursor.next()
      }
      cursor.reset()
    } catch { /* ok */ }
    rt.current.cursorTimes = times
    rt.current.cursorIdx   = 0
  }

  function getPracticeElapsed(): number {
    const r = rt.current
    if (!r.practiceAc || r.practiceAcStart === 0) return r.practiceOffset
    return r.practiceAc.currentTime - r.practiceAcStart + r.practiceOffset
  }

  function schedulePractice() {
    const r = rt.current
    if (!r.practiceAc) return
    const el    = getPracticeElapsed()
    const until = el + 0.1

    while (r.noteIdx < r.allNotes.length && r.allNotes[r.noteIdx].time < until) {
      const n = r.allNotes[r.noteIdx]
      const activeMuted = mutedTracks !== undefined ? mutedTracksRef.current : mutedRef.current
      if (!activeMuted.has(n.trackIdx)) {
        const when = r.practiceAcStart + n.time - r.practiceOffset
        if (when >= r.practiceAc.currentTime - 0.01) {
          const inst = r.wafInsts.get(n.wafFile)
          if (inst) wafPlayNote(r.practiceAc, inst, n.midi, when, n.duration, n.velocity)
        }
      }
      r.noteIdx++
    }
    if (el >= r.totalDuration) stopAll()
  }

  function highlightNotesAtCursor() {
    // Reset previous highlights
    prevColoredEls.current.forEach(({ el, origFill }) => { el.style.fill = origFill })
    prevColoredEls.current = []

    // Run after browser paints so cursor element has its new position
    requestAnimationFrame(() => {
      const cursorEl = rt.current.cursor?.cursorElement as HTMLElement | undefined
      if (!cursorEl || !scoreRef.current) return

      const cursorRect = cursorEl.getBoundingClientRect()
      if (!cursorRect.height) return
      const cursorCenterX = (cursorRect.left + cursorRect.right) / 2
      const tolerance = 18

      const svg = scoreRef.current.querySelector('svg')
      if (!svg) return

      svg.querySelectorAll<SVGElement>('ellipse, path').forEach(el => {
        if (cursorEl.contains(el as unknown as Node)) return
        const rect = el.getBoundingClientRect()
        // Noteheads are small; skip large shapes (staff lines, barlines, beams)
        if (!rect.width || !rect.height) return
        if (rect.width > 40 || rect.height > 40) return

        const cx = (rect.left + rect.right) / 2
        if (Math.abs(cx - cursorCenterX) > tolerance) return

        // Save original fill (inline style or attribute)
        const origFill = el.style.fill || el.getAttribute('fill') || ''
        el.style.fill = '#2563eb'
        prevColoredEls.current.push({ el, origFill })
      })
    })
  }

  function scrollCursorIntoView() {
    const cursorEl = rt.current.cursor?.cursorElement as HTMLElement | undefined
    if (!cursorEl) return

    function findScrollable(el: HTMLElement): HTMLElement | null {
      let cur = el.parentElement
      while (cur && cur !== document.body) {
        const oy = window.getComputedStyle(cur).overflowY
        if (oy === 'auto' || oy === 'scroll') return cur
        cur = cur.parentElement
      }
      return null
    }

    const container = noBar ? findScrollable(cursorEl) : scoreContainerRef.current
    if (!container) return

    const containerRect = container.getBoundingClientRect()
    const cursorRect    = cursorEl.getBoundingClientRect()
    const cursorAbsTop  = cursorRect.top - containerRect.top + container.scrollTop

    const prev = prevCursorAbsTop.current
    prevCursorAbsTop.current = cursorAbsTop

    // Same system: cursor moved horizontally, y barely changed — skip scroll
    if (Math.abs(cursorAbsTop - prev) < 30) return

    // New system row detected: scroll so its top sits near the top of the container
    container.scrollTo({ top: Math.max(0, cursorAbsTop - 30), behavior: 'smooth' })
  }

  const tick = useCallback(() => {
    const r = rt.current
    let t = 0
    if (r.mode === 'practice') {
      t = getPracticeElapsed()
    } else {
      t = r.audio?.currentTime ?? 0
    }
    setElapsed(Math.min(t, r.totalDuration))
    setProgress(r.totalDuration > 0 ? Math.min(t / r.totalDuration, 1) : 0)

    if (r.cursor && r.cursorTimes.length) {
      let advanced = false
      while (r.cursorIdx < r.cursorTimes.length - 1 && t >= r.cursorTimes[r.cursorIdx + 1]) {
        try { r.cursor.next() } catch { /* ok */ }
        r.cursorIdx++
        advanced = true
      }
      if (advanced) {
        if (!disableHighlightRef.current) highlightNotesAtCursor()
        if (!disableScrollRef.current)    scrollCursorIntoView()
        try {
          const m = (r.cursor.Iterator?.CurrentMeasureIndex ?? -1) + 1
          if (m !== lastMeasureRef.current) {
            lastMeasureRef.current = m
            onMeasureChangeRef.current?.(m)
          }
        } catch { /* ok */ }
      }
    }
    r.raf = requestAnimationFrame(tick)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function stopAll() {
    const r = rt.current
    cancelAnimationFrame(r.raf)
    if (r.schedulerTimer) { clearInterval(r.schedulerTimer); r.schedulerTimer = null }
    r.audio?.pause()
    setPlaying(false)
  }

  // ── Load WAF instruments ──────────────────────────────────────────
  async function loadPractice() {
    const r = rt.current
    if (r.allNotes.length === 0) return
    setPracticeLoading(true)
    try {
      if (!r.practiceAc) r.practiceAc = new AudioContext()
      const ac = r.practiceAc
      if (ac.state === 'suspended') await ac.resume()

      const needed = new Set(r.allNotes.map(n => n.wafFile))
      await Promise.allSettled([...needed].map(async filename => {
        if (!r.wafInsts.has(filename)) {
          const inst = await loadWafScript(filename)
          r.wafInsts.set(filename, inst)
        }
        const inst = r.wafInsts.get(filename)
        if (inst) await decodeWafInst(ac, inst)
      }))

      rt.current.totalDuration = rt.current.allNotes.length
        ? Math.max(
            rt.current.totalDuration,
            rt.current.allNotes[rt.current.allNotes.length - 1].time + 1
          )
        : rt.current.totalDuration
      setDuration(rt.current.totalDuration)
      setPracticeReady(true)
    } catch (e) {
      console.error('WAF load error:', e)
    } finally {
      setPracticeLoading(false)
    }
  }

  // ── Controls ─────────────────────────────────────────────────────
  async function togglePlay() {
    const r = rt.current
    if (playing) {
      if (r.mode === 'practice') r.practiceOffset = getPracticeElapsed()
      stopAll()
    } else {
      if (r.mode === 'practice') {
        if (!r.practiceAc) return
        if (r.practiceAc.state === 'suspended') await r.practiceAc.resume()
        r.practiceAcStart = r.practiceAc.currentTime
        r.noteIdx = Math.max(0, r.allNotes.findIndex(n => n.time >= r.practiceOffset - 0.05))
        r.schedulerTimer = setInterval(schedulePractice, 25)
      } else {
        r.audio?.play().catch(console.error)
      }
      r.raf = requestAnimationFrame(tick)
      setPlaying(true)
    }
  }

  function reset() {
    const r = rt.current
    stopAll()
    r.practiceOffset = 0; r.practiceAcStart = 0; r.noteIdx = 0
    if (r.audio) r.audio.currentTime = 0
    setProgress(0); setElapsed(0)
    prevColoredEls.current.forEach(({ el, origFill }) => { el.style.fill = origFill })
    prevColoredEls.current = []
    prevCursorAbsTop.current = -999
    lastMeasureRef.current = -1
    try { r.cursor?.reset(); r.cursorIdx = 0 } catch { /* ok */ }
    // Scroll back to top — scoreContainerRef in embedded, scrollable parent in noBar
    if (noBar) {
      const el = scoreRef.current
      if (el) {
        const findScrollable = (n: HTMLElement): HTMLElement | null => {
          let cur = n.parentElement
          while (cur && cur !== document.body) {
            if (['auto', 'scroll'].includes(window.getComputedStyle(cur).overflowY)) return cur
            cur = cur.parentElement
          }
          return null
        }
        findScrollable(el)?.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } else if (scoreContainerRef.current) {
      scoreContainerRef.current.scrollTop = 0
    }
  }

  function seekTo(pct: number) {
    const r = rt.current
    const t = pct * r.totalDuration
    setElapsed(t); setProgress(pct)

    if (r.mode === 'practice') {
      r.practiceOffset = t
      if (playing && r.practiceAc) {
        if (r.schedulerTimer) clearInterval(r.schedulerTimer)
        r.practiceAcStart = r.practiceAc.currentTime
        r.noteIdx = Math.max(0, r.allNotes.findIndex(n => n.time >= t - 0.05))
        r.schedulerTimer = setInterval(schedulePractice, 25)
      }
    } else {
      if (r.audio) r.audio.currentTime = t
    }

    if (r.cursor && r.cursorTimes.length) {
      try {
        let idx = r.cursorTimes.findIndex((_, i) =>
          i === r.cursorTimes.length - 1 || r.cursorTimes[i + 1] > t
        )
        if (idx < 0) idx = 0
        r.cursor.reset()
        for (let i = 0; i < idx; i++) r.cursor.next()
        r.cursorIdx = idx
      } catch { /* ok */ }
    }
  }

  async function switchMode(toPractice: boolean) {
    stopAll()
    rt.current.practiceOffset = 0; rt.current.practiceAcStart = 0; rt.current.noteIdx = 0
    if (rt.current.audio) rt.current.audio.currentTime = 0
    setProgress(0); setElapsed(0)
    try { rt.current.cursor?.reset(); rt.current.cursorIdx = 0 } catch { /* ok */ }

    rt.current.mode = toPractice ? 'practice' : 'mp3'
    setPracticeMode(toPractice)

    if (toPractice && !practiceReady) await loadPractice()
  }

  function toggleMute(idx: number) {
    const next = new Set(mutedRef.current)
    if (next.has(idx)) next.delete(idx); else next.add(idx)
    mutedRef.current = next
    forceUpdate(n => n + 1)
  }

  const canPlay  = practiceMode ? (practiceReady && !!midiUrl) : audioReady
  const showMode = !!(mp3Url && midiUrl)

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div>
      {/* Player bar — hidden when noBar=true (external controls) */}
      {!noBar && (mp3Url || midiUrl) && (
        <div className="flex items-center gap-3 px-4 py-3 mb-3 rounded-2xl"
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>

          <button onClick={reset}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: '#e2e8f0' }}>
            <RotateCcw size={13} color="#64748b" />
          </button>

          <button onClick={togglePlay} disabled={!canPlay}
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition"
            style={{ background: !canPlay ? '#e2e8f0' : playing ? '#dc2626' : '#2563eb' }}>
            {(!canPlay && (practiceLoading || !audioReady))
              ? <div className="w-4 h-4 rounded-full border-2 animate-spin"
                  style={{ borderColor: '#94a3b8', borderTopColor: 'transparent' }} />
              : playing
                ? <Pause size={18} color="white" />
                : <Play  size={18} color="white" fill="white" />
            }
          </button>

          <div className="flex-1">
            <div className="relative h-2 rounded-full overflow-hidden cursor-pointer mb-1"
              style={{ background: '#e2e8f0' }}
              onClick={e => {
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                seekTo(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)))
              }}>
              <div className="absolute left-0 top-0 h-full rounded-full"
                style={{ width: `${progress * 100}%`, background: '#2563eb', transition: 'width .04s linear' }} />
            </div>
            <div className="flex justify-between text-[10px]" style={{ color: '#94a3b8' }}>
              <span>{fmt(elapsed)}</span>
              <span>{fmt(duration)}</span>
            </div>
          </div>

          {/* Mode toggle */}
          {showMode && (
            <div className="flex rounded-xl overflow-hidden flex-shrink-0"
              style={{ border: '1px solid #e2e8f0' }}>
              <button onClick={() => switchMode(false)}
                className="px-2.5 py-1.5 text-[11px] font-semibold transition"
                style={{ background: !practiceMode ? '#2563eb' : '#f8fafc', color: !practiceMode ? 'white' : '#94a3b8' }}>
                Volledig
              </button>
              <button onClick={() => switchMode(true)} disabled={practiceLoading}
                className="px-2.5 py-1.5 text-[11px] font-semibold transition"
                style={{ background: practiceMode ? '#2563eb' : '#f8fafc', color: practiceMode ? 'white' : '#94a3b8' }}>
                {practiceLoading ? '…' : 'Oefenen'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Track mute chips — only in embedded mode with internal control */}
      {!noBar && practiceMode && trackNames.length > 1 && mutedTracks === undefined && (
        <div className="flex gap-2 flex-wrap mb-3">
          {trackNames.map((name, i) => {
            const muted = mutedRef.current.has(i)
            return (
              <button key={i} onClick={() => toggleMute(i)}
                className="px-3 py-1 rounded-full text-xs font-medium transition"
                style={{
                  background: muted ? '#f1f5f9' : '#2563eb',
                  color:      muted ? '#94a3b8' : 'white',
                  border:     `1px solid ${muted ? '#e2e8f0' : '#2563eb'}`,
                  textDecoration: muted ? 'line-through' : 'none',
                }}>
                {name}
              </button>
            )
          })}
        </div>
      )}

      {/* Score */}
      <div style={noBar ? { position: 'relative' } : {
        position: 'relative', borderRadius: 16, background: '#ffffff',
        border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        minHeight: scoreStatus !== 'ready' ? 160 : undefined, overflow: 'hidden',
      }}>
        {scoreStatus === 'loading' && (
          <div className="flex flex-col items-center justify-center gap-3"
            style={{ position: 'absolute', inset: 0, background: 'white', zIndex: 2 }}>
            <div className="w-6 h-6 rounded-full border-2 animate-spin"
              style={{ borderColor: '#2563eb', borderTopColor: 'transparent' }} />
            <p className="text-xs" style={{ color: '#94a3b8' }}>Partituur laden…</p>
          </div>
        )}
        {scoreStatus === 'error' && (
          <div className="p-8 text-center"
            style={{ position: 'absolute', inset: 0, background: 'white', zIndex: 2 }}>
            <Music2 size={36} className="mx-auto mb-3" style={{ color: '#94a3b8' }} />
            <p className="text-sm font-semibold" style={{ color: '#1e293b' }}>Kon partituur niet laden</p>
          </div>
        )}
        {/* Always in DOM so OSMD can measure width. In noBar mode the page itself scrolls. */}
        <div ref={scoreContainerRef}
          style={noBar ? {} : { maxHeight: '65vh', overflowY: 'auto', overflowX: 'hidden' }}>
          <div ref={scoreRef} style={{ padding: '16px 40px 12px 10px', background: 'white' }} />
        </div>
      </div>
    </div>
  )
}
