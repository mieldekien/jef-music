import Metronome from '@/components/Metronome'
import BottomNav from '@/components/BottomNav'
import LogoHeader from '@/components/LogoHeader'

export default function MetronoomPage() {
  return (
    <div className="min-h-screen pb-24 px-5" style={{ background: 'var(--bg)' }}>
      <LogoHeader />
      <div className="pt-2 pb-6">
        <h1 className="text-2xl font-bold text-white">Metronoom</h1>
        <p className="text-sm mt-0.5" style={{ color: '#4a6a8a' }}>Tik op play om te starten</p>
      </div>
      <Metronome defaultBpm={120} />
      <BottomNav />
    </div>
  )
}
