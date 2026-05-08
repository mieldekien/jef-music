import Image from 'next/image'

export default function LogoHeader() {
  return (
    <div className="flex justify-center pt-10 pb-2">
      <Image src="/logo.png" alt="Jong El Fuerte" width={80} height={72} priority />
    </div>
  )
}
