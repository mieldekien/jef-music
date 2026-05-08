import BottomNav from '@/components/BottomNav'
import LogoHeader from '@/components/LogoHeader'
import { Globe, ExternalLink, Mail } from 'lucide-react'

const links = [
  { label: 'Website', sub: 'de-jeftjes.be', icon: Globe, href: 'https://www.de-jeftjes.be' },
  { label: 'Instagram', sub: '@jongelFuerte', icon: ExternalLink, href: 'https://www.instagram.com' },
  { label: 'Facebook', sub: 'Jong El Fuerte', icon: ExternalLink, href: 'https://www.facebook.com' },
  { label: 'YouTube', sub: 'Jong El Fuerte', icon: ExternalLink, href: 'https://www.youtube.com' },
  { label: 'Contact', sub: 'info@de-jeftjes.be', icon: Mail, href: 'mailto:info@de-jeftjes.be' },
]

export default function InfoPage() {
  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg)' }}>
      <LogoHeader />

      <div className="px-5 pt-4 pb-4">
        <h1 className="text-2xl font-bold text-white">Jong El Fuerte</h1>
        <p className="text-sm mt-0.5" style={{ color: '#4a6a8a' }}>Digitale muziekstand</p>
      </div>

      <div className="px-5 space-y-3">
        <div className="p-4 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-sm leading-relaxed" style={{ color: '#7a9ab8' }}>
            Jong El Fuerte is een jeugdtamboerkorps uit Adinkerke. De muziekstand-app is een digitale tool voor leden om partituren, audio en de metronoom bij de hand te hebben tijdens repetities en optredens.
          </p>
        </div>

        <div className="space-y-2 pt-2">
          {links.map(({ label, sub, icon: Icon, href }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-2xl transition hover:opacity-80"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: '#0d1e35' }}>
                <Icon size={20} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">{label}</p>
                <p className="text-xs mt-0.5" style={{ color: '#4a6a8a' }}>{sub}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
