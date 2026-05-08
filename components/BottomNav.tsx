'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Music2, CalendarDays, Timer, Drum, MessageCircle } from 'lucide-react'

const tabs = [
  { href: '/muziek',     icon: Music2 },
  { href: '/oefeningen', icon: Drum },
  { href: '/chat',       icon: MessageCircle },
  { href: '/planning',   icon: CalendarDays },
  { href: '/metronoom',  icon: Timer },
]

export default function BottomNav() {
  const path = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 flex justify-around items-center z-50"
      style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', paddingBottom: 'env(safe-area-inset-bottom)', height: 64 }}>
      {tabs.map(({ href, icon: Icon }) => {
        const active = path.startsWith(href)
        return (
          <Link key={href} href={href}
            className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition"
            style={{ color: active ? 'var(--accent)' : '#3a5a7a' }}>
            <Icon size={active ? 24 : 22} strokeWidth={active ? 2.5 : 1.8} />
            {active && <div className="w-1 h-1 rounded-full mt-0.5" style={{ background: 'var(--accent)' }} />}
          </Link>
        )
      })}
    </nav>
  )
}
