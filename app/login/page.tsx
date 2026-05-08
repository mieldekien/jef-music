'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useNavigate } from '@/components/PageTransition'
import Image from 'next/image'
import { createClient, supabaseConfigured } from '@/lib/supabase'
import { ArrowLeft, CheckCircle2, Shield, Star } from 'lucide-react'

const INSTRUMENT_GROUPS = [
  {
    label: 'Slagwerk',
    color: '#DAD74D',
    bg: '#1a1c0a',
    instruments: ['Snare', 'Cymbaal', 'Bongo', 'Quint', 'Bassdrum'],
  },
  {
    label: 'Melodisch',
    color: '#7ac4a0',
    bg: '#0a1a14',
    instruments: ['Lyra', 'Marimba'],
  },
]

type Step = 'email' | 'instrument'

function LoginContent() {
  const searchParams = useSearchParams()
  const [step,       setStep]       = useState<Step>(searchParams.get('step') === 'instrument' ? 'instrument' : 'email')
  const [email,      setEmail]      = useState('')
  const [sent,       setSent]       = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [instrument, setInstrument] = useState('')
  const navigate = useNavigate()
  const supabase = createClient()

  useEffect(() => {
    if (searchParams.get('step') === 'instrument') setStep('instrument')
  }, [searchParams])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!supabaseConfigured) {
      setStep('instrument')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSent(true)
    setStep('instrument')
    setLoading(false)
  }

  async function handleInstrument() {
    if (!instrument) return
    if (supabaseConfigured) {
      await supabase.auth.updateUser({ data: { instrument } })
    }
    navigate('/jef')
  }

  return (
    <div className="min-h-screen flex flex-col px-5 pt-12 pb-10" style={{ background: 'var(--bg)' }}>

      <button onClick={() => step === 'instrument' ? setStep('email') : navigate('/')}
        className="flex items-center gap-2 mb-8 w-fit"
        style={{ color: '#4a6a8a' }}>
        <ArrowLeft size={18} /> Terug
      </button>

      <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto">

        {/* ── Step 1: Email ───────────────────────── */}
        {step === 'email' && (
          <>
            <div className="flex justify-center mb-8">
              <Image src="/logo.png" alt="Jong El Fuerte" width={100} height={90} priority />
            </div>
            <h1 className="text-2xl font-bold text-white text-center mb-1">JEF inloggen</h1>
            <p className="text-sm text-center mb-8" style={{ color: '#4a6a8a' }}>Leden van Jong El Fuerte</p>

            {!supabaseConfigured && (
              <div className="p-3 rounded-xl mb-4 text-xs text-center" style={{ background: '#0d1e35', color: '#50B4E4', border: '1px solid #1b2d47' }}>
                Demo modus — Supabase nog niet ingesteld
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {supabaseConfigured && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#7a9ab8' }}>E-mailadres</label>
                  <input
                    type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="jouw@email.be"
                    className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                  />
                </div>
              )}
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-4 rounded-2xl font-bold text-white transition"
                style={{ background: loading ? '#333' : 'var(--accent)', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Versturen…' : supabaseConfigured ? 'Inloggen met e-mail link' : 'Doorgaan'}
              </button>
            </form>

            {/* Role legend */}
            <div className="mt-8 space-y-2">
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: '#0a1626', border: '1px solid #1b2d47' }}>
                <CheckCircle2 size={16} style={{ color: '#50B4E4' }} />
                <div>
                  <p className="text-xs font-semibold text-white">Lid</p>
                  <p className="text-[11px]" style={{ color: '#3a5a7a' }}>Muziek lezen, chat, metronoom</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: '#0a1626', border: '1px solid #1b3a5a' }}>
                <Shield size={16} style={{ color: '#50B4E4' }} />
                <div>
                  <p className="text-xs font-semibold text-white">Crew</p>
                  <p className="text-[11px]" style={{ color: '#3a5a7a' }}>Muziek & oefeningen toevoegen, chat beheren</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: '#0a1626', border: '1px solid #2a1a50' }}>
                <Star size={16} style={{ color: '#DAD74D' }} />
                <div>
                  <p className="text-xs font-semibold text-white">Admin</p>
                  <p className="text-[11px]" style={{ color: '#3a5a7a' }}>Volledige toegang + ledenbeheer</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Step 2: Instrument ──────────────────── */}
        {step === 'instrument' && (
          <>
            {sent && (
              <div className="flex items-center gap-2 p-3 rounded-xl mb-6 text-xs"
                style={{ background: '#0a2010', border: '1px solid #1a4025', color: '#7ac4a0' }}>
                <span>📧</span>
                <span>Inloglink verstuurd naar <strong className="text-white">{email}</strong></span>
              </div>
            )}

            <h1 className="text-xl font-bold text-white mb-1">Welk instrument speel jij?</h1>
            <p className="text-sm mb-6" style={{ color: '#4a6a8a' }}>Kies je instrumentgroep</p>

            {INSTRUMENT_GROUPS.map(group => (
              <div key={group.label} className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: group.color }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: group.color }}>
                    {group.label}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.instruments.map(inst => {
                    const selected = instrument === inst
                    return (
                      <button key={inst} onClick={() => setInstrument(inst)}
                        className="px-4 py-2.5 rounded-2xl text-sm font-semibold transition"
                        style={{
                          background: selected ? group.color + '22' : 'var(--surface)',
                          color: selected ? group.color : '#7a9ab8',
                          border: `1.5px solid ${selected ? group.color : 'var(--border)'}`,
                          transform: selected ? 'scale(1.04)' : 'scale(1)',
                        }}>
                        {selected && <span className="mr-1.5">✓</span>}
                        {inst}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            <button onClick={handleInstrument} disabled={!instrument}
              className="w-full py-4 rounded-2xl font-bold text-white mt-4 transition"
              style={{ background: instrument ? 'var(--accent)' : '#1b2d47', cursor: instrument ? 'pointer' : 'not-allowed' }}>
              {instrument ? `Doorgaan als ${instrument}` : 'Kies een instrument'}
            </button>

            <button onClick={() => handleInstrument()} className="w-full py-3 text-sm mt-2" style={{ color: '#3a5a7a' }}>
              Overslaan
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense><LoginContent /></Suspense>
}
