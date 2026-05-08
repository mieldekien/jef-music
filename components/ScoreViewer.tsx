'use client'
import { useEffect, useRef, useState } from 'react'

interface Props {
  xmlUrl: string
  darkMode?: boolean
}

export default function ScoreViewer({ xmlUrl, darkMode = true }: Props) {
  const ref      = useRef<HTMLDivElement>(null)
  const osmdRef  = useRef<unknown>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [err,    setErr]    = useState('')

  useEffect(() => {
    if (!ref.current || !xmlUrl) return
    let cancelled = false

    async function load() {
      setStatus('loading')
      try {
        const { OpenSheetMusicDisplay } = await import('opensheetmusicdisplay')
        if (cancelled) return

        const osmd = new OpenSheetMusicDisplay(ref.current!, {
          autoResize: true,
          drawingParameters: 'compact',
          backend: 'svg',
          defaultColorMusic: darkMode ? '#e8edf5' : '#111',
          pageFormat: 'Endless',
          drawTitle: false,
          drawSubtitle: false,
          drawComposer: false,
          drawLyricist: false,
        })
        osmdRef.current = osmd
        await osmd.load(xmlUrl)
        if (cancelled) return
        osmd.render()
        setStatus('ready')
      } catch (e) {
        if (!cancelled) { setStatus('error'); setErr(String(e)) }
      }
    }
    load()
    return () => { cancelled = true }
  }, [xmlUrl, darkMode])

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: darkMode ? '#0d1626' : '#f9f9f9', border: '1px solid var(--border)', minHeight: 120 }}>
      {status === 'loading' && (
        <div className="flex items-center justify-center py-10">
          <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        </div>
      )}
      {status === 'error' && (
        <div className="p-4 text-xs" style={{ color: '#f87171' }}>
          Kon partituur niet laden. Controleer het XML-bestand.<br />
          <span className="opacity-50">{err}</span>
        </div>
      )}
      <div ref={ref} className={status !== 'ready' ? 'hidden' : ''} style={{ padding: '16px 12px' }} />
    </div>
  )
}
