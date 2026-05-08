'use client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Music, Drum, ChevronRight, Upload, FileMusic, Video, FileText } from 'lucide-react'

const MUSIC_STEPS = [
  { icon: FileText, label: 'Titel & info invullen', sub: 'Naam, componist, BPM, categorie' },
  { icon: FileMusic, label: 'MusicXML uploaden', sub: 'Exporteer vanuit MuseScore als .xml' },
  { icon: Upload, label: 'Audio toevoegen (optioneel)', sub: 'MP3 of WAV play-along bestand' },
]

const OEF_STEPS = [
  { icon: FileText, label: 'Titel & beschrijving', sub: 'Naam, categorie, moeilijkheid' },
  { icon: FileMusic, label: 'Partituur uploaden', sub: 'MusicXML bestand (.xml)' },
  { icon: Video, label: 'Video toevoegen (optioneel)', sub: 'MP4 demonstratievideo' },
]

function StepCard({ steps, title, color, onClick }: {
  steps: typeof MUSIC_STEPS
  title: string
  color: string
  onClick: () => void
}) {
  return (
    <button onClick={onClick}
      className="w-full text-left rounded-3xl p-5 transition hover:opacity-90"
      style={{ background: 'var(--surface)', border: `1px solid ${color}33` }}>

      <div className="flex items-center justify-between mb-4">
        <span className="text-base font-bold text-white">{title}</span>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: color + '22', color }}>
          Toevoegen <ChevronRight size={12} />
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: color + '18' }}>
              <s.icon size={16} style={{ color }} />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{s.label}</p>
              <p className="text-xs" style={{ color: '#4a6a8a' }}>{s.sub}</p>
            </div>
            <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
              style={{ background: color + '22', color }}>
              {i + 1}
            </div>
          </div>
        ))}
      </div>
    </button>
  )
}

export default function AdminPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen px-5 pb-16" style={{ background: 'var(--bg)' }}>
      <div className="flex items-center gap-3 pt-12 pb-6">
        <button onClick={() => router.back()} style={{ color: '#7a9ab8' }}>
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-xs" style={{ color: '#4a6a8a' }}>CREW — Beheer</p>
        </div>
      </div>

      {/* Tip box */}
      <div className="rounded-2xl p-4 mb-6" style={{ background: '#0a1828', border: '1px solid #1b3a5a' }}>
        <p className="text-sm font-semibold text-white mb-1">💡 Hoe werkt het?</p>
        <p className="text-xs leading-relaxed" style={{ color: '#5a8ab0' }}>
          Kies wat je wilt toevoegen. Vul de stappen in, upload de bestanden en sla op. De content verschijnt meteen in de app voor alle leden.
        </p>
      </div>

      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#3a5a7a' }}>
        Wat wil je toevoegen?
      </p>

      <div className="space-y-4">
        <StepCard
          title="🎵 Muzieknummer"
          steps={MUSIC_STEPS}
          color="#50B4E4"
          onClick={() => router.push('/admin/muziek')}
        />
        <StepCard
          title="🥁 Oefening"
          steps={OEF_STEPS}
          color="#DAD74D"
          onClick={() => router.push('/admin/oefening')}
        />
      </div>

      {/* Quick tips */}
      <div className="mt-6 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#3a5a7a' }}>Tips</p>
        {[
          ['MuseScore → Export', 'Bestand → Exporteren → MusicXML (.xml)'],
          ['Video comprimeren', 'Gebruik HandBrake voor kleinere MP4 bestanden'],
          ['Sectie & Show', 'Kies bij muziek de juiste map (Show 1 / Show 2)'],
        ].map(([t, s]) => (
          <div key={t} className="flex gap-3 p-3 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="text-sm font-semibold text-white w-36 flex-shrink-0">{t}</div>
            <div className="text-xs" style={{ color: '#4a6a8a' }}>{s}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
