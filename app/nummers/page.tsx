'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NummersRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/muziek') }, [])
  return null
}
