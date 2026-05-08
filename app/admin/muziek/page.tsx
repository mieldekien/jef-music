'use client'
import { useState } from 'react'
import { useNavigate } from '@/components/PageTransition'
import { ArrowLeft, Upload, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const CATEGORIES  = ['Mars', 'Showstuk', 'Finale', 'Oefenstuk', 'Andere']
const INSTRUMENTS = ['Drum', 'Bugel', 'Lier', 'Slagwerk', 'Andere']
const SECTIONS    = [{ val: 'slagwerk', label: 'Slagwerk' }, { val: 'melodisch', label: 'Melodisch' }]
const SHOWS       = ['Show 1', 'Show 2', 'Show 3']
const DIFFICULTIES = [{ val: '1', label: '● Makkelijk' }, { val: '2', label: '●● Gemiddeld' }, { val: '3', label: '●●● Moeilijk' }]

export default function AdminMuziekPage() {
  const navigate = useNavigate()
  const supabase = createClient()

  const [form, setForm] = useState({
    title: '', composer: '', bpm: '', category: 'Mars',
    difficulty: '2', section: 'slagwerk', show: 'Show 1', instruments: [] as string[],
  })
  const [xmlFile,   setXmlFile]   = useState<File | null>(null)
  const [pdfFile,   setPdfFile]   = useState<File | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [midiFile,  setMidiFile]  = useState<File | null>(null)
  const [saving,  setSaving]  = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState('')

  function toggleInstrument(i: string) {
    setForm(f => ({
      ...f,
      instruments: f.instruments.includes(i) ? f.instruments.filter(x => x !== i) : [...f.instruments, i],
    }))
  }

  function fileInput(label: string, accept: string, file: File | null, setFile: (f: File | null) => void, hint = '') {
    return (
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#7a9ab8' }}>{label}</label>
        {hint && <p className="text-xs mb-1.5" style={{ color: '#3a5a7a' }}>{hint}</p>}
        <label className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition hover:opacity-80"
          style={{ background: 'var(--surface)', border: `1px solid ${file ? 'var(--accent)' : 'var(--border)'}` }}>
          <Upload size={16} style={{ color: file ? 'var(--accent)' : '#4a6a8a' }} />
          <span className="text-sm" style={{ color: file ? 'var(--accent)' : '#4a6a8a' }}>
            {file ? file.name : 'Kies bestand…'}
          </span>
          <input type="file" accept={accept} className="hidden"
            onChange={e => setFile(e.target.files?.[0] || null)} />
        </label>
      </div>
    )
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title) return
    setSaving(true); setError('')
    try {
      const { data: song, error: err } = await supabase.from('songs').insert({
        title: form.title, composer: form.composer || null,
        bpm: form.bpm ? parseInt(form.bpm) : null,
        category: form.category, difficulty: parseInt(form.difficulty),
        instruments: form.instruments, section: form.section, show: form.show,
      }).select().single()
      if (err) throw err

      async function upload(file: File, path: string, col: string) {
        const { error: e } = await supabase.storage.from('songs').upload(path, file, { upsert: true })
        if (e) throw e
        const { data } = supabase.storage.from('songs').getPublicUrl(path)
        await supabase.from('songs').update({ [col]: data.publicUrl }).eq('id', song.id)
      }

      if (xmlFile)   await upload(xmlFile,   `${song.id}/partituur.xml`,                      'xml_url')
      if (pdfFile)   await upload(pdfFile,   `${song.id}/partituur.pdf`,                      'pdf_url')
      if (audioFile) await upload(audioFile, `${song.id}/audio.${audioFile.name.split('.').pop()}`, 'audio_url')
      if (midiFile)  await upload(midiFile,  `${song.id}/partituur.mid`,                      'midi_url')

      setSuccess(true)
      setForm({ title: '', composer: '', bpm: '', category: 'Mars', difficulty: '2', section: 'slagwerk', show: 'Show 1', instruments: [] })
      setXmlFile(null); setPdfFile(null); setAudioFile(null); setMidiFile(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen px-5 pb-16" style={{ background: 'var(--bg)' }}>
      <div className="flex items-center gap-3 pt-12 pb-6">
        <button onClick={() => navigate('/admin')} style={{ color: '#7a9ab8' }}><ArrowLeft size={22} /></button>
        <div>
          <h1 className="text-xl font-bold text-white">Muzieknummer toevoegen</h1>
          <p className="text-xs" style={{ color: '#4a6a8a' }}>CREW — Admin</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {/* Titel */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#7a9ab8' }}>Titel *</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="bv. El Fuerte March"
            className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#7a9ab8' }}>Componist</label>
            <input value={form.composer} onChange={e => setForm(f => ({ ...f, composer: e.target.value }))}
              placeholder="bv. Jan Pieters"
              className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#7a9ab8' }}>BPM</label>
            <input type="number" value={form.bpm} onChange={e => setForm(f => ({ ...f, bpm: e.target.value }))}
              placeholder="120"
              className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
          </div>
        </div>

        {/* Sectie */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#7a9ab8' }}>Sectie</label>
          <div className="flex gap-2">
            {SECTIONS.map(s => (
              <button key={s.val} type="button" onClick={() => setForm(f => ({ ...f, section: s.val }))}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition"
                style={{ background: form.section === s.val ? 'var(--accent)' : 'var(--border)', color: form.section === s.val ? 'white' : '#7a9ab8' }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Show */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#7a9ab8' }}>Map (Show)</label>
          <div className="flex gap-2 flex-wrap">
            {SHOWS.map(s => (
              <button key={s} type="button" onClick={() => setForm(f => ({ ...f, show: s }))}
                className="px-4 py-2 rounded-xl text-sm font-medium transition"
                style={{ background: form.show === s ? '#1b3a5a' : 'var(--border)', color: form.show === s ? 'var(--accent)' : '#7a9ab8', border: `1px solid ${form.show === s ? 'var(--accent)' : 'transparent'}` }}>
                📁 {s}
              </button>
            ))}
          </div>
        </div>

        {/* Categorie */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#7a9ab8' }}>Categorie</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c} type="button" onClick={() => setForm(f => ({ ...f, category: c }))}
                className="px-3 py-1.5 rounded-full text-sm font-medium transition"
                style={{ background: form.category === c ? 'var(--accent)' : 'var(--border)', color: form.category === c ? 'white' : '#7a9ab8' }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Moeilijkheid */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#7a9ab8' }}>Moeilijkheid</label>
          <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            {DIFFICULTIES.map(d => <option key={d.val} value={d.val}>{d.label}</option>)}
          </select>
        </div>

        {/* Instrumenten */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#7a9ab8' }}>Instrumenten</label>
          <div className="flex flex-wrap gap-2">
            {INSTRUMENTS.map(i => (
              <button key={i} type="button" onClick={() => toggleInstrument(i)}
                className="px-3 py-1.5 rounded-full text-sm font-medium transition"
                style={{ background: form.instruments.includes(i) ? 'var(--accent)' : 'var(--border)', color: form.instruments.includes(i) ? 'white' : '#7a9ab8' }}>
                {i}
              </button>
            ))}
          </div>
        </div>

        {fileInput('Partituur (MusicXML) *', '.xml,.musicxml,.mxl', xmlFile, setXmlFile, 'In MuseScore: Bestand → Exporteren → MusicXML')}
        {fileInput('Partituur (PDF)', '.pdf', pdfFile, setPdfFile)}
        {fileInput('Play-along audio', '.mp3,.wav,.m4a', audioFile, setAudioFile)}
        {fileInput('MIDI (optioneel)', '.mid,.midi', midiFile, setMidiFile)}

        {error   && <p className="text-red-400 text-sm">{error}</p>}
        {success && <p className="text-sm" style={{ color: '#4ade80' }}>✓ Nummer toegevoegd!</p>}

        <button type="submit" disabled={saving || !form.title}
          className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition"
          style={{ background: saving || !form.title ? '#333' : 'var(--accent)', cursor: saving || !form.title ? 'not-allowed' : 'pointer' }}>
          <Plus size={20} />
          {saving ? 'Opslaan…' : 'Nummer toevoegen'}
        </button>
      </form>
    </div>
  )
}
