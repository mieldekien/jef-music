import type { Metadata, Viewport } from 'next'
import { Poppins } from 'next/font/google'
import SplashScreen from '@/components/SplashScreen'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '900'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Jong El Fuerte — Muziekstand',
  description: 'Digitale muziekstand voor Jong El Fuerte',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'JEF Music' },
}

export const viewport: Viewport = {
  themeColor: '#1C244B',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={poppins.variable}>
      <body className="min-h-screen">
          <SplashScreen />
          {children}
        </body>
    </html>
  )
}
