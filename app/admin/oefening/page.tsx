'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const CATS       = ['Rudiment', 'Marching', 'Techniek', 'Show', 'Andere']
const DIFFICULTIES = [{ val:'1', label:'● Makkelijk' }, { val:'2', label:'●● Gemiddeld' }, { val:'3', label:'●●● Moeilijk' }]

export default function AddOefeningPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({ title:'', description:'', category:'Rudiment', difficulty:'2' })
  const [xmlFile,   setXmlFile]   = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [midiFile,  setMidiFile]  = useState<File | null>(null)
  const [saving,  setSaving]  = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState('')

  function f(label: string, key: keyof typeof form, placeholder = '', multiline = false) {
    return (
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: '#7a9ab8' }}>{label}</label>
        {multiline
          ? <textarea rows={3} value={form[key]}
              onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
              placeholder={placeholder}
              className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none resize-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
          : <input value={form[key]}
              onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
              placeholder={placeholder}
              className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
        }
      </div>
    )
  }

  function fileInput(label: string, accept: string, file: File | null, setFile: (f: File|null) => void) {
    return (
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: '#7a9ab8' }}>{label}</label>
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
      const { data: ex, error: exErr } = await supabase.from('exercises').insert({
        title: form.title, description: form.description || null,
        category: form.category, difficulty: parseInt(form.difficulty),
      }).select().single()
      if (exErr) throw exErr

      async function upload(file: File, path: string, col: string) {
        const { error: e } = await supabase.storage.from('exercises').upload(path, file, { upsert: true })
        if (e) throw e
        const { data } = supabase.storage.from('exercises').getPublicUrl(path)
        await supabase.from('exercises').update({ [col]: data.publicUrl }).eq('id', ex.id)
      }

      if (xmlFile)   await upload(xmlFile,   `${ex.id}/partituur.xml`, 'xml_url')
      if (videoFile) await upload(videoFile, `${ex.id}/video.${videoFile.name.split('.').pop()}`, 'video_url')
      if (midiFile)  await upload(midiFile,  `${ex.id}/partituur.mid`, 'midi_url')

      setSuccess(true)
      setForm({ title:'', description:'', category:'Rudiment', difficulty:'2' })
      setXmlFile(null); setVideoFile(null); setMidiFile(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen px-5 pb-16" style={{ background: 'var(--bg)' }}>
      <div className="flex items-center gap-3 pt-12 pb-6">
        <button onClick={() => router.back()} style={{ color: '#7a9ab8' }}><ArrowLeft size={22} /></button>
        <div>
          <h1 className="text-xl font-bold text-white">Oefening toevoegen</h1>
          <p className="text-xs" style={{ color: '#4a6a8a' }}>CREW — Admin</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {f('Titel *', 'title', 'bv. Paradiddle in 4/4')}
        {f('Beschrijving', 'description', 'Uitleg over de oefening…', true)}

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#7a9ab8' }}>Categorie</label>
          <div className="flex flex-wrap gap-2">
            {CATS.map(c => (
              <button key={c} type="button" onClick={() => setForm(p => ({ ...p, category: c }))}
                className="px-3 py-1.5 rounded-full text-sm font-medium transition"
                style={{ background: form.category === c ? 'var(--accent)' : 'var(--border)', color: form.category === c ? 'white' : '#7a9ab8' }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#7a9ab8' }}>Moeilijkheid</label>
          <select value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            {DIFFICULTIES.map(d => <option key={d.val} value={d.val}>{d.label}</option>)}
          </select>
        </div>

        {fileInput('Partituur (MusicXML)',       '.xml,.musicxml,.mxl', xmlFile,   setXmlFile)}
        {fileInput('Video demonstratie',         '.mp4,.mov,.webm',     videoFile, setVideoFile)}
        {fileInput('MIDI (optioneel)',            '.mid,.midi',          midiFile,  setMidiFile)}

        {error   && <p className="text-red-400 text-sm">{error}</p>}
        {success && <p className="text-sm" style={{ color: '#4ade80' }}>✓ Oefening toegevoegd!</p>}

        <button type="submit" disabled={saving || !form.title}
          className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition"
          style={{ background: saving || !form.title ? '#333' : 'var(--accent)', cursor: saving || !form.title ? 'not-allowed' : 'pointer' }}>
          <Plus size={20} />
          {saving ? 'Opslaan…' : 'Oefening toevoegen'}
        </button>
      </form>
    </div>
  )
}
