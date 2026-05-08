'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Music2, CalendarDays, Timer, Drum, Bot } from 'lucide-react'

const tabs = [
  { href: '/muziek',     label: 'Muziek',     icon: Music2 },
  { href: '/oefeningen', label: 'Oefeningen', icon: Drum },
  { href: '/planning',   label: 'Planning',   icon: CalendarDays },
  { href: '/metronoom',  label: 'Metronoom',  icon: Timer },
  { href: '/assistent',  label: 'Assistent',  icon: Bot },
]

export default function BottomNav() {
  const path = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 flex justify-around items-center py-2 z-50"
      style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = path.startsWith(href)
        return (
          <Link key={href} href={href}
            className="flex flex-col items-center gap-0.5 px-2 py-1 transition"
            style={{ color: active ? 'var(--accent)' : '#4a6a8a' }}>
            <Icon size={20} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
