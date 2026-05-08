'use client'
import Image from 'next/image'
import { useNavigate } from '@/components/PageTransition'

export default function LogoHeader() {
  const navigate = useNavigate()
  return (
    <div className="flex justify-center pt-10 pb-2">
      <button onClick={() => navigate('/jef')}>
        <Image src="/logo.png" alt="Jong El Fuerte" width={80} height={72} priority />
      </button>
    </div>
  )
}
