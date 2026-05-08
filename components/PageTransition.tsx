'use client'
import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

type NavFn = (href: string) => void
const Ctx = createContext<NavFn>(() => {})

export function useNavigate() {
  return useContext(Ctx)
}

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const router  = useRouter()
  const [phase, setPhase] = useState<'idle' | 'in' | 'out'>('idle')
  const busy    = useRef(false)

  const navigate = useCallback((href: string) => {
    if (busy.current) return
    busy.current = true
    setPhase('in')
    setTimeout(() => {
      router.push(href)
      setPhase('out')
      setTimeout(() => { setPhase('idle'); busy.current = false }, 250)
    }, 200)
  }, [router])

  return (
    <Ctx.Provider value={navigate}>
      {children}
      {phase !== 'idle' && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center"
          style={{
            background: '#1C244B',
            animation: `${phase === 'in' ? 'page-in' : 'page-out'} 220ms ease forwards`,
            pointerEvents: 'none',
          }}>
          <Image src="/logo.png" alt="" width={100} height={90} priority />
        </div>
      )}
    </Ctx.Provider>
  )
}
