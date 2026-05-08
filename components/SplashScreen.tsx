'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function SplashScreen() {
  const [visible, setVisible]   = useState(true)
  const [fading, setFading]     = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 1800)
    const t2 = setTimeout(() => setVisible(false), 2500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-6"
      style={{
        background: '#1C244B',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.65s ease',
        pointerEvents: fading ? 'none' : 'all',
      }}
    >
      <Image
        src="/logo.png"
        alt="Jong El Fuerte"
        width={220}
        height={200}
        priority
        className="drop-shadow-2xl"
      />
      <p className="text-sm font-semibold tracking-[0.25em] uppercase" style={{ color: '#C8D5DC' }}>
        Muziekstand
      </p>
    </div>
  )
}
