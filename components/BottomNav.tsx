'use client'
import { usePathname } from 'next/navigation'
import { Music2, CalendarDays, Timer, Drum, MessageCircle } from 'lucide-react'
import { useNavigate } from '@/components/PageTransition'

const tabs = [
  { href: '/muziek',    icon: Music2 },
  { href: '/chat',      icon: MessageCircle },
  { href: '/metronoom', icon: Timer },
]

export default function BottomNav() {
  const path     = usePathname()
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-0 left-0 right-0 flex justify-around items-center z-50"
      style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', paddingBottom: 'env(safe-area-inset-bottom)', height: 64 }}>
      {tabs.map(({ href, icon: Icon }) => {
        const active = path.startsWith(href)
        return (
          <button key={href} onClick={() => navigate(href)}
            className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition"
            style={{ color: active ? 'var(--accent)' : '#3a5a7a' }}>
            <Icon size={active ? 24 : 22} strokeWidth={active ? 2.5 : 1.8} />
            {active && <div className="w-1 h-1 rounded-full mt-0.5" style={{ background: 'var(--accent)' }} />}
          </button>
        )
      })}
    </nav>
  )
}
