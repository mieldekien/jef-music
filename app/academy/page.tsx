'use client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, GraduationCap } from 'lucide-react'

export default function AcademyPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen flex flex-col px-5 pt-12 pb-10" style={{ background: 'var(--bg)' }}>
      <button onClick={() => router.back()}
        className="flex items-center gap-2 mb-8 w-fit"
        style={{ color: '#4a6a8a' }}>
        <ArrowLeft size={18} /> Terug
      </button>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
        <Image src="/logo.png" alt="Jong El Fuerte" width={90} height={81} />

        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: '#1a1a0d', border: '1px solid #3a3a1b' }}>
          <GraduationCap size={30} style={{ color: '#DAD74D' }} />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white mb-1">JEF Academy</h1>
          <p className="text-sm" style={{ color: '#4a6a8a' }}>Jong El Fuerte Muziekschool</p>
        </div>

        <div className="p-5 rounded-2xl max-w-xs w-full"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="font-semibold text-white mb-2">Binnenkort beschikbaar</p>
          <p className="text-sm leading-relaxed" style={{ color: '#4a6a8a' }}>
            JEF Academy biedt muziekopleiding voor beginners en jonge leden. Deze module is momenteel in ontwikkeling.
          </p>
        </div>
      </div>
    </div>
  )
}
