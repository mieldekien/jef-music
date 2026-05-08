'use client'
import { useEffect, useState } from 'react'
import { useNavigate } from '@/components/PageTransition'
import { createClient, supabaseConfigured } from '@/lib/supabase'
import { ArrowLeft, Music, ChevronRight, Upload, FileMusic, FileText, Shield, Star, Users, CheckCircle2 } from 'lucide-react'

const MUSIC_STEPS = [
  { icon: FileText,  label: 'Titel & info invullen', sub: 'Naam, componist, BPM, categorie' },
  { icon: FileMusic, label: 'MusicXML uploaden',     sub: 'Exporteer vanuit MuseScore als .xml' },
  { icon: Upload,    label: 'Audio toevoegen',       sub: 'MP3 of WAV play-along bestand' },
]

interface Member {
  id: string
  email: string
  full_name: string
  instrument: string
  is_crew: boolean
  is_admin: boolean
}

const DEMO_MEMBERS: Member[] = [
  { id: '1', email: 'jens@jef.be',   full_name: 'Jens V.',   instrument: 'Snare',    is_crew: true,  is_admin: true  },
  { id: '2', email: 'lore@jef.be',   full_name: 'Lore D.',   instrument: 'Snare',    is_crew: false, is_admin: false },
  { id: '3', email: 'amber@jef.be',  full_name: 'Amber K.',  instrument: 'Quint',    is_crew: false, is_admin: false },
  { id: '4', email: 'pieter@jef.be', full_name: 'Pieter S.', instrument: 'Cymbaal',  is_crew: true,  is_admin: false },
  { id: '5', email: 'sara@jef.be',   full_name: 'Sara V.',   instrument: 'Lyra',     is_crew: false, is_admin: false },
  { id: '6', email: 'tom@jef.be',    full_name: 'Tom D.',    instrument: 'Marimba',  is_crew: false, is_admin: false },
  { id: '7', email: 'remi@jef.be',   full_name: 'Remi B.',   instrument: 'Bassdrum', is_crew: false, is_admin: false },
  { id: '8', email: 'nora@jef.be',   full_name: 'Nora M.',   instrument: 'Bongo',    is_crew: false, is_admin: false },
]

function StepCard({ steps, title, color, onClick }: { steps: typeof MUSIC_STEPS; title: string; color: string; onClick: () => void }) {
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
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '18' }}>
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
  const navigate = useNavigate()
  const supabase = createClient()

  const [isAdmin,  setIsAdmin]  = useState(!supabaseConfigured) // demo: always admin
  const [members,  setMembers]  = useState<Member[]>(DEMO_MEMBERS)
  const [tab,      setTab]      = useState<'content' | 'users'>('content')

  useEffect(() => {
    if (!supabaseConfigured) return
    supabase.auth.getUser().then(({ data }) => {
      setIsAdmin(data.user?.user_metadata?.is_admin === true)
    })
  }, [])

  function toggleRole(id: string, role: 'is_crew' | 'is_admin') {
    setMembers(ms => ms.map(m => m.id === id ? { ...m, [role]: !m[role] } : m))
    // TODO: supabase.auth.admin.updateUserById(id, { user_metadata: { [role]: !current } })
  }

  return (
    <div className="min-h-screen pb-16" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button onClick={() => navigate('/jef')} style={{ color: '#7a9ab8' }}>
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">Beheer</h1>
          <p className="text-xs" style={{ color: '#4a6a8a' }}>
            {isAdmin ? 'Admin — Volledige toegang' : 'Crew — Content beheer'}
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{ background: isAdmin ? '#1a1005' : '#0a1e35', border: `1px solid ${isAdmin ? '#DAD74D44' : '#50B4E444'}` }}>
          {isAdmin
            ? <><Star size={12} style={{ color: '#DAD74D' }} /><span className="text-[11px] font-bold" style={{ color: '#DAD74D' }}>Admin</span></>
            : <><Shield size={12} style={{ color: '#50B4E4' }} /><span className="text-[11px] font-bold" style={{ color: '#50B4E4' }}>Crew</span></>
          }
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-5 mb-5">
        {[
          { id: 'content', label: 'Content', icon: Music },
          ...(isAdmin ? [{ id: 'users', label: 'Leden', icon: Users }] : []),
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition"
            style={{
              background: tab === t.id ? 'var(--accent)' : 'var(--surface)',
              color: tab === t.id ? 'white' : '#4a6a8a',
              border: '1px solid var(--border)',
            }}>
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-5">

        {/* ── Content tab ─────────────────────────── */}
        {tab === 'content' && (
          <>
            <div className="rounded-2xl p-4 mb-5" style={{ background: '#0a1828', border: '1px solid #1b3a5a' }}>
              <p className="text-sm font-semibold text-white mb-1">💡 Hoe werkt het?</p>
              <p className="text-xs leading-relaxed" style={{ color: '#5a8ab0' }}>
                Kies wat je wilt toevoegen. Vul de stappen in, upload de bestanden en sla op.
              </p>
            </div>

            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#3a5a7a' }}>
              Toevoegen
            </p>

            <div className="space-y-4">
              <StepCard title="🎵 Muzieknummer" steps={MUSIC_STEPS} color="#50B4E4" onClick={() => navigate('/admin/muziek')} />
            </div>

            <div className="mt-6 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#3a5a7a' }}>Tips</p>
              {[
                ['MuseScore → Export', 'Bestand → Exporteren → MusicXML (.xml)'],
                ['Sectie & Show',      'Kies bij muziek de juiste map (Show 1 / Show 2)'],
              ].map(([t, s]) => (
                <div key={t} className="flex gap-3 p-3 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="text-sm font-semibold text-white w-36 flex-shrink-0">{t}</div>
                  <div className="text-xs" style={{ color: '#4a6a8a' }}>{s}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Users tab (admin only) ───────────────── */}
        {tab === 'users' && isAdmin && (
          <>
            <div className="flex gap-4 mb-4">
              {[
                { icon: CheckCircle2, color: '#4a6a8a', label: 'Lid',   desc: 'Lezen & chatten' },
                { icon: Shield,       color: '#50B4E4', label: 'Crew',  desc: 'Content toevoegen' },
                { icon: Star,         color: '#DAD74D', label: 'Admin', desc: 'Volledige toegang' },
              ].map(r => (
                <div key={r.label} className="flex-1 p-3 rounded-2xl flex flex-col items-center gap-1"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <r.icon size={16} style={{ color: r.color }} />
                  <span className="text-xs font-bold text-white">{r.label}</span>
                  <span className="text-[10px] text-center" style={{ color: '#3a5a7a' }}>{r.desc}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{ background: '#0a1220', border: '1px solid #1b2d47' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: '#1b2d47', color: '#7a9ab8' }}>
                    {m.full_name.split(' ').map(w => w[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{m.full_name}</p>
                    <p className="text-xs truncate" style={{ color: '#4a6a8a' }}>{m.instrument}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Crew toggle */}
                    <button onClick={() => toggleRole(m.id, 'is_crew')}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition"
                      style={{
                        background: m.is_crew ? '#0a1e35' : 'var(--surface)',
                        color:      m.is_crew ? '#50B4E4' : '#3a5a7a',
                        border:     `1px solid ${m.is_crew ? '#50B4E4' : '#1b2d47'}`,
                      }}>
                      <Shield size={10} /> Crew
                    </button>
                    {/* Admin toggle */}
                    <button onClick={() => toggleRole(m.id, 'is_admin')}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition"
                      style={{
                        background: m.is_admin ? '#1a1005' : 'var(--surface)',
                        color:      m.is_admin ? '#DAD74D' : '#3a5a7a',
                        border:     `1px solid ${m.is_admin ? '#DAD74D' : '#1b2d47'}`,
                      }}>
                      <Star size={10} /> Admin
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-center mt-4" style={{ color: '#2a4060' }}>
              Wijzigingen worden live opgeslagen via Supabase
            </p>
          </>
        )}
      </div>
    </div>
  )
}
