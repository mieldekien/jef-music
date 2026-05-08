'use client'
import Image from 'next/image'
import { useState } from 'react'
import BottomNav from '@/components/BottomNav'
import { useNavigate } from '@/components/PageTransition'
import { Music2, MessageCircle, KeyRound, X, Shield } from 'lucide-react'

// Custom analogue metronome SVG icon
function MetronomeIcon({ size = 28, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 21 L9 3 H15 L19 21 Z" />
      <line x1="12" y1="14" x2="16" y2="6" />
      <circle cx="16.3" cy="5.4" r="1.4" fill={color} stroke="none" />
      <line x1="7.2" y1="16.5" x2="9.8" y2="16.5" />
      <line x1="7.8" y1="12.5" x2="10.2" y2="12.5" />
    </svg>
  )
}

const TILES = [
  { label: 'Muziek',    icon: Music2,        href: '/muziek',    color: '#50B4E4', bg: '#0a1e35' },
  { label: 'Chat',      icon: MessageCircle, href: '/chat',      color: '#f0916a', bg: '#1f0d0a' },
  { label: 'Metronoom', icon: null,          href: '/metronoom', color: '#9b8ab8', bg: '#150d1f' },
]

const ROLE_COLOR: Record<string, string> = {
  Crew: '#50B4E4', Snare: '#DAD74D', Cymbaal: '#f0916a',
  Bongo: '#7ac4a0', Quint: '#9b8ab8', Bassdrum: '#e07070',
  Lyra: '#70b0e0', Marimba: '#c4a060',
}
const STATUS_COLOR = { online: '#3ba55d', away: '#faa61a', offline: '#747f8d' }
const ROLE_ORDER = ['Crew', 'Snare', 'Cymbaal', 'Bongo', 'Quint', 'Bassdrum', 'Lyra', 'Marimba']

const DEMO_MEMBERS = [
  { name: 'Jens V.',   role: 'Crew',     status: 'online'  },
  { name: 'Lore D.',   role: 'Snare',    status: 'online'  },
  { name: 'Amber K.',  role: 'Quint',    status: 'online'  },
  { name: 'Pieter S.', role: 'Cymbaal',  status: 'away'    },
  { name: 'Sara V.',   role: 'Lyra',     status: 'online'  },
  { name: 'Tom D.',    role: 'Marimba',  status: 'away'    },
  { name: 'Remi B.',   role: 'Bassdrum', status: 'offline' },
  { name: 'Nora M.',   role: 'Bongo',    status: 'offline' },
]

const onlineCount = DEMO_MEMBERS.filter(m => m.status === 'online').length
function dotColor() {
  if (onlineCount >= 4) return '#3ba55d'
  if (onlineCount >= 2) return '#faa61a'
  return '#ed4245'
}

export default function JefHubPage() {
  const navigate = useNavigate()
  const [members, setMembers] = useState(false)

  const grouped = ROLE_ORDER.reduce((acc, role) => {
    const list = DEMO_MEMBERS.filter(m => m.role === role)
    if (list.length) acc[role] = list
    return acc
  }, {} as Record<string, typeof DEMO_MEMBERS>)

  return (
    <div className="min-h-screen flex flex-col pb-24" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <div className="flex flex-col items-center pt-14 pb-6 px-5 relative">

        {/* Left: dot + key side by side */}
        <div className="absolute left-5 top-14 flex items-center gap-2">
          <button onClick={() => setMembers(true)}
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: '#0a1626', border: '1px solid #1b2d47' }}>
            <span className="relative flex">
              <span className="w-3.5 h-3.5 rounded-full block" style={{ background: dotColor() }} />
              <span className="absolute inset-0 rounded-full animate-ping opacity-50" style={{ background: dotColor() }} />
            </span>
          </button>

          <button onClick={() => navigate('/admin')}
            className="w-10 h-10 rounded-2xl flex items-center justify-center transition hover:opacity-80"
            style={{ background: '#0a1e35', border: '1px solid #1b3a5a' }}>
            <KeyRound size={18} style={{ color: '#50B4E4' }} />
          </button>
        </div>

        <Image src="/logo.png" alt="Jong El Fuerte" width={95} height={86} priority className="mb-4" />
        <h1 className="text-2xl font-black text-white tracking-tight">Jong El Fuerte</h1>
      </div>

      {/* Tiles — centered, full-width column */}
      <div className="flex-1 px-5 space-y-4">
        {TILES.map(({ label, icon: Icon, href, color, bg }) => (
          <button key={href} onClick={() => navigate(href)}
            className="w-full flex flex-col items-center justify-center gap-3 rounded-3xl py-8 transition active:scale-[0.98] hover:opacity-90"
            style={{ background: bg, border: `1px solid ${color}33` }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: color + '22' }}>
              {Icon
                ? <Icon size={28} style={{ color }} strokeWidth={1.7} />
                : <MetronomeIcon size={28} color={color} />
              }
            </div>
            <span className="text-lg font-bold text-white">{label}</span>
          </button>
        ))}
      </div>

      {/* Member panel — full screen */}
      {members && (
        <div className="fixed inset-0 z-[200] flex flex-col" style={{ background: 'var(--bg)' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-14 pb-4"
            style={{ borderBottom: '1px solid #1b2d47' }}>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: dotColor() }} />
              <span className="text-lg font-bold text-white">{onlineCount} online</span>
              <span className="text-sm" style={{ color: '#4a6a8a' }}>· {DEMO_MEMBERS.length} leden</span>
            </div>
            <button onClick={() => setMembers(false)}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: '#1b2d47' }}>
              <X size={16} color="#7a9ab8" />
            </button>
          </div>

          {/* Grouped list */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 pb-16">
            {ROLE_ORDER.filter(r => grouped[r]).map(role => (
              <div key={role}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: ROLE_COLOR[role] }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: ROLE_COLOR[role] }}>
                    {role}
                  </span>
                  <span className="text-xs" style={{ color: '#3a5a7a' }}>
                    — {grouped[role].length}
                  </span>
                </div>
                <div className="space-y-2">
                  {grouped[role].map(m => (
                    <div key={m.name} className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                      style={{ background: '#0a1220', border: '1px solid #1b2d47' }}>
                      <div className="relative flex-shrink-0">
                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{ background: ROLE_COLOR[m.role] + '22', color: ROLE_COLOR[m.role] }}>
                          {m.name.split(' ').map(w => w[0]).join('')}
                        </div>
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2"
                          style={{ background: STATUS_COLOR[m.status as keyof typeof STATUS_COLOR], borderColor: '#0a1220' }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{m.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {m.role === 'Crew' && <Shield size={10} style={{ color: ROLE_COLOR[m.role] }} />}
                          <span className="text-xs" style={{ color: '#4a6a8a' }}>
                            {m.status === 'online' ? 'Online' : m.status === 'away' ? 'Afwezig' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
