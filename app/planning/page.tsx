'use client'
import { useEffect, useState } from 'react'
import BottomNav from '@/components/BottomNav'
import LogoHeader from '@/components/LogoHeader'
import { MapPin, Clock, RefreshCw } from 'lucide-react'

interface Event {
  id:          string
  heading:     string
  description: string | null
  start:       string
  end:         string
  location:    string | null
  type:        string
}

const NL_DAYS   = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za']
const NL_MONTHS = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec']

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${NL_DAYS[d.getDay()]} ${d.getDate()} ${NL_MONTHS[d.getMonth()]}`
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })
}

function monthLabel(iso: string) {
  const d = new Date(iso)
  const monthStr = d.toLocaleString('nl-BE', { month: 'long' })
  return `${monthStr.charAt(0).toUpperCase()}${monthStr.slice(1)} ${d.getFullYear()}`
}

function typeColor(type: string): string {
  const t = type.toLowerCase()
  if (t.includes('match') || t.includes('optreden') || t.includes('game')) return '#DAD74D'
  if (t.includes('train') || t.includes('repetit') || t.includes('practice')) return '#50B4E4'
  return '#7a9ab8'
}

function typeLabel(type: string): string {
  const t = type.toLowerCase()
  if (t.includes('match') || t.includes('game'))  return 'Optreden'
  if (t.includes('train') || t.includes('event')) return 'Repetitie'
  return 'Event'
}

export default function PlanningPage() {
  const [events,  setEvents]  = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [demo,    setDemo]    = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/planning')
      const data = await res.json()
      if (data.demo) setDemo(true)
      setEvents(data.events ?? [])
    } catch {
      setError('Kon planning niet laden')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Group events by month
  const grouped: Record<string, Event[]> = {}
  for (const e of events) {
    const key = monthLabel(e.start)
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(e)
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg)' }}>
      <LogoHeader />

      <div className="px-5 pt-2 pb-4 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white">Planning</h1>
          <p className="text-sm mt-0.5" style={{ color: '#4a6a8a' }}>
            {demo ? 'Voeg SPOND-gegevens toe in .env.local' : 'Volgende activiteiten via SPOND'}
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="p-2 rounded-xl transition hover:opacity-80"
          style={{ color: '#4a6a8a' }}>
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="px-5">
        {loading && (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'var(--surface)' }} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="p-4 rounded-2xl text-sm" style={{ background: '#1a0d0d', border: '1px solid #3a1515', color: '#f87171' }}>
            {error}
          </div>
        )}

        {!loading && demo && (
          <div className="p-4 rounded-2xl mb-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-sm font-semibold text-white mb-1">SPOND koppelen</p>
            <p className="text-xs" style={{ color: '#4a6a8a' }}>
              Voeg de volgende variabelen toe aan <code className="text-white">.env.local</code>:
            </p>
            <pre className="mt-2 text-xs rounded-xl p-3 overflow-x-auto" style={{ background: '#080c18', color: '#50B4E4' }}>
{`SPOND_EMAIL=jouw@email.be
SPOND_PASSWORD=jouwwachtwoord
SPOND_GROUP_ID=groep-id`}
            </pre>
          </div>
        )}

        {!loading && !error && events.length === 0 && !demo && (
          <div className="flex flex-col items-center py-16 gap-3">
            <p className="font-semibold text-white">Geen activiteiten gepland</p>
            <p className="text-sm" style={{ color: '#4a6a8a' }}>De komende 90 dagen staan er geen events in SPOND.</p>
          </div>
        )}

        {!loading && Object.entries(grouped).map(([month, evts]) => (
          <div key={month} className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#3a5a7a' }}>
              {month}
            </p>
            <div className="space-y-3">
              {evts.map(evt => {
                const color = typeColor(evt.type)
                const isToday = new Date(evt.start).toDateString() === new Date().toDateString()
                return (
                  <div key={evt.id}
                    className="flex gap-4 p-4 rounded-2xl"
                    style={{ background: 'var(--surface)', border: `1px solid ${isToday ? color + '55' : 'var(--border)'}` }}>

                    {/* Date column */}
                    <div className="flex flex-col items-center justify-center w-12 flex-shrink-0 text-center">
                      <span className="text-xl font-black text-white leading-none">
                        {new Date(evt.start).getDate()}
                      </span>
                      <span className="text-xs font-medium uppercase" style={{ color: '#4a6a8a' }}>
                        {NL_DAYS[new Date(evt.start).getDay()]}
                      </span>
                    </div>

                    {/* Divider */}
                    <div className="w-px flex-shrink-0 rounded-full" style={{ background: color + '66' }} />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-white leading-tight">{evt.heading}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium"
                          style={{ background: color + '22', color }}>
                          {typeLabel(evt.type)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                        <span className="flex items-center gap-1 text-xs" style={{ color: '#4a6a8a' }}>
                          <Clock size={11} />
                          {formatTime(evt.start)} – {formatTime(evt.end)}
                        </span>
                        {evt.location && (
                          <span className="flex items-center gap-1 text-xs" style={{ color: '#4a6a8a' }}>
                            <MapPin size={11} />
                            {evt.location}
                          </span>
                        )}
                      </div>

                      {evt.description && (
                        <p className="text-xs mt-1.5 line-clamp-2" style={{ color: '#4a6a8a' }}>
                          {evt.description}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  )
}
