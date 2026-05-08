'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient, supabaseConfigured } from '@/lib/supabase'
import { ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const [email,   setEmail]   = useState('')
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const router    = useRouter()
  const supabase  = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!supabaseConfigured) {
      // demo mode — skip auth
      router.replace('/nummers')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col px-5 pt-12 pb-10" style={{ background: 'var(--bg)' }}>

      <button onClick={() => router.back()}
        className="flex items-center gap-2 mb-8 w-fit"
        style={{ color: '#4a6a8a' }}>
        <ArrowLeft size={18} /> Terug
      </button>

      <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto">
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

        {sent ? (
          <div className="text-center p-6 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="text-4xl mb-3">📧</div>
            <p className="font-semibold text-white">Check jouw e-mail!</p>
            <p className="text-sm mt-2" style={{ color: '#4a6a8a' }}>
              Inloglink verstuurd naar <strong className="text-white">{email}</strong>
            </p>
          </div>
        ) : (
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
              {loading ? 'Versturen…' : supabaseConfigured ? 'Inloggen met e-mail link' : 'Doorgaan (demo)'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
