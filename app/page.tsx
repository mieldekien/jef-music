'use client'
import Image from 'next/image'
import { useNavigate } from '@/components/PageTransition'
import { ChevronRight } from 'lucide-react'

const groups = [
  {
    id:    'jef',
    name:  'JEF',
    full:  'Jong El Fuerte',
    desc:  'Partituren, planning & oefeningen voor leden',
    href:  '/jef',
    badge: null,
    accent: 'var(--accent)',
    bg:    '#0d1e35',
    border:'#1b3a5a',
  },
  {
    id:    'academy',
    name:  'JEF ACADEMY',
    full:  'Jong El Fuerte Academy',
    desc:  'Muziekschool voor beginners & jeugd',
    href:  '/academy',
    badge: 'Binnenkort',
    accent:'#DAD74D',
    bg:    '#1a1a0d',
    border:'#3a3a1b',
  },
]

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center px-5 pt-14 pb-10"
      style={{ background: 'var(--bg)' }}>

      {/* Logo */}
      <div className="mb-10 flex flex-col items-center gap-3">
        <Image src="/logo.png" alt="Jong El Fuerte" width={110} height={99} priority />
        <p className="text-sm font-medium tracking-widest uppercase" style={{ color: '#4a6a8a' }}>
          Kies jouw groep
        </p>
      </div>

      {/* Group cards */}
      <div className="w-full max-w-sm space-y-4">
        {groups.map(g => (
          <button
            key={g.id}
            onClick={() => navigate(g.href)}
            className="w-full text-left rounded-3xl p-6 transition active:scale-[0.98] hover:opacity-90"
            style={{ background: g.bg, border: `1.5px solid ${g.border}` }}>

            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl font-black text-white tracking-tight">{g.name}</span>
                  {g.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: g.accent + '22', color: g.accent }}>
                      {g.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm mb-3" style={{ color: '#7a9ab8' }}>{g.full}</p>
                <p className="text-sm leading-relaxed" style={{ color: '#4a6a8a' }}>{g.desc}</p>
              </div>

              <div className="flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center mt-1"
                style={{ background: g.accent + '22' }}>
                <ChevronRight size={18} style={{ color: g.accent }} />
              </div>
            </div>

            {/* Bottom accent bar */}
            <div className="mt-5 h-0.5 rounded-full w-16" style={{ background: g.accent + '55' }} />
          </button>
        ))}
      </div>

      <p className="mt-auto pt-10 text-xs" style={{ color: '#2a4060' }}>
        Jong El Fuerte · Adinkerke
      </p>
    </div>
  )
}
