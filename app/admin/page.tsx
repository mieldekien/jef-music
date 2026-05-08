'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import { Upload, Plus, Trash2 } from 'lucide-react'

const CATEGORIES = ['Mars', 'Showstuk', 'Finale', 'Oefenstuk', 'Andere']
const INSTRUMENTS = ['Drum', 'Bugel', 'Lier', 'Slagwerk', 'Andere']

export default function AdminPage() {
  const supabase = createClient()
  const [form, setForm] = useState({
    title: '', composer: '', bpm: '', category: 'Mars',
    difficulty: '2', instruments: [] as string[],
  })
  const [pdfFile, setPdfFile]   = useState<File | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [midiFile, setMidiFile]   = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  function toggleInstrument(i: string) {
    setForm(f => ({
      ...f,
      instruments: f.instruments.includes(i) ? f.instruments.filter(x => x !== i) : [...f.instruments, i]
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      // Insert song record
      const { data: song, error: songErr } = await supabase.from('songs').insert({
        title: form.title,
        composer: form.composer || null,
        bpm: form.bpm ? parseInt(form.bpm) : null,
        category: form.category,
        difficulty: parseInt(form.difficulty),
        instruments: form.instruments,
      }).select().single()
      if (songErr) throw songErr

      // Upload PDF
      if (pdfFile) {
        const { error: pdfErr } = await supabase.storage
          .from('songs')
          .upload(`${song.id}/partituur.pdf`, pdfFile, { upsert: true })
        if (pdfErr) throw pdfErr
        const { data: pdfUrl } = supabase.storage.from('songs').getPublicUrl(`${song.id}/partituur.pdf`)
        await supabase.from('songs').update({ pdf_url: pdfUrl.publicUrl }).eq('id', song.id)
      }

      // Upload audio
      if (audioFile) {
        const ext = audioFile.name.split('.').pop()
        const { error: audioErr } = await supabase.storage
          .from('songs')
          .upload(`${song.id}/audio.${ext}`, audioFile, { upsert: true })
        if (audioErr) throw audioErr
        const { data: audioUrl } = supabase.storage.from('songs').getPublicUrl(`${song.id}/audio.${ext}`)
        await supabase.from('songs').update({ audio_url: audioUrl.publicUrl }).eq('id', song.id)
      }

      setSuccess(true)
      // Upload MIDI
      if (midiFile) {
        const { error: midiErr } = await supabase.storage
          .from('songs')
          .upload(`${song.id}/partituur.mid`, midiFile, { upsert: true })
        if (midiErr) throw midiErr
        const { data: midiUrl } = supabase.storage.from('songs').getPublicUrl(`${song.id}/partituur.mid`)
        await supabase.from('songs').update({ midi_url: midiUrl.publicUrl }).eq('id', song.id)
      }

      setForm({ title: '', composer: '', bpm: '', category: 'Mars', difficulty: '2', instruments: [] })
      setPdfFile(null)
      setAudioFile(null)
      setMidiFile(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Onbekende fout')
    } finally {
      setSaving(false)
    }
  }

  const field = (label: string, key: keyof typeof form, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: '#7a9ab8' }}>{label}</label>
      <input type={type} value={form[key] as string} placeholder={placeholder}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
    </div>
  )

  const fileInput = (label: string, accept: string, file: File | null, setFile: (f: File | null) => void) => (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: '#7a9ab8' }}>{label}</label>
      <label className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition hover:opacity-80"
        style={{ background: '#111', border: `1px solid ${file ? 'var(--accent)' : 'var(--border)'}` }}>
        <Upload size={18} style={{ color: file ? 'var(--accent)' : '#555' }} />
        <span className="text-sm" style={{ color: file ? 'var(--accent)' : '#555' }}>
          {file ? file.name : 'Kies bestand...'}
        </span>
        <input type="file" accept={accept} className="hidden"
          onChange={e => setFile(e.target.files?.[0] || null)} />
      </label>
    </div>
  )

  return (
    <div className="min-h-screen pb-24 px-5" style={{ background: 'var(--bg)' }}>
      <div className="pt-12 pb-6">
        <h1 className="text-2xl font-bold text-white">🛠 Admin</h1>
        <p className="text-sm mt-0.5" style={{ color: '#4a6a8a' }}>Nummers beheren</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {field('Titel *', 'title', 'text', 'El Fuerte March')}
        {field('Componist', 'composer', 'text', 'Jan Pieters')}

        <div className="grid grid-cols-2 gap-4">
          {field('BPM', 'bpm', 'number', '120')}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#7a9ab8' }}>Moeilijkheid</label>
            <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <option value="1">● Makkelijk</option>
              <option value="2">●● Gemiddeld</option>
              <option value="3">●●● Moeilijk</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#7a9ab8' }}>Categorie</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c} type="button" onClick={() => setForm(f => ({ ...f, category: c }))}
                className="px-3 py-1.5 rounded-full text-sm font-medium transition"
                style={{ background: form.category === c ? 'var(--accent)' : 'var(--border)', color: form.category === c ? 'white' : '#888' }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#7a9ab8' }}>Instrumenten</label>
          <div className="flex flex-wrap gap-2">
            {INSTRUMENTS.map(i => (
              <button key={i} type="button" onClick={() => toggleInstrument(i)}
                className="px-3 py-1.5 rounded-full text-sm font-medium transition"
                style={{ background: form.instruments.includes(i) ? 'var(--accent)' : 'var(--border)', color: form.instruments.includes(i) ? 'white' : '#888' }}>
                {i}
              </button>
            ))}
          </div>
        </div>

        {fileInput('Partituur (PDF)', '.pdf', pdfFile, setPdfFile)}
        {fileInput('Play-along audio (MP3/WAV)', '.mp3,.wav,.m4a', audioFile, setAudioFile)}
        {fileInput('MIDI partituur (.mid)', '.mid,.midi', midiFile, setMidiFile)}

        {error && <p className="text-red-400 text-sm">{error}</p>}
        {success && <p className="text-green-400 text-sm">✓ Nummer toegevoegd!</p>}

        <button type="submit" disabled={saving || !form.title}
          className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition"
          style={{ background: saving || !form.title ? '#333' : 'var(--accent)', cursor: saving || !form.title ? 'not-allowed' : 'pointer' }}>
          <Plus size={20} />
          {saving ? 'Opslaan...' : 'Nummer toevoegen'}
        </button>
      </form>

      <BottomNav />
    </div>
  )
}
