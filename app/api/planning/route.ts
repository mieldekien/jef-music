import { NextResponse } from 'next/server'

const API = 'https://api.spond.com/core/v1'

// Module-level token cache (survives across requests in the same server process)
let cachedToken: string | null = null
let tokenExpiry = 0

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken

  const res = await fetch(`${API}/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: process.env.SPOND_EMAIL, password: process.env.SPOND_PASSWORD }),
  })
  if (!res.ok) throw new Error(`SPOND login failed: ${res.status}`)
  const data = await res.json()
  if (!data.loginToken) throw new Error('No loginToken in SPOND response')

  cachedToken = data.loginToken
  tokenExpiry = Date.now() + 55 * 60 * 1000  // cache 55 min
  return cachedToken as string
}

export async function GET() {
  // Demo mode — no credentials configured
  if (!process.env.SPOND_EMAIL || !process.env.SPOND_PASSWORD) {
    return NextResponse.json({ events: [], demo: true })
  }

  try {
    const token = await getToken()

    const now    = new Date().toISOString()
    const future = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()

    const params = new URLSearchParams({
      order:             'asc',
      scheduled:         'true',
      minStartTimestamp: now,
      maxStartTimestamp: future,
      max:               '50',
    })
    if (process.env.SPOND_GROUP_ID) params.set('groupId', process.env.SPOND_GROUP_ID)

    const res = await fetch(`${API}/sponds/?${params}`, {
      headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      next: { revalidate: 300 }, // cache 5 min
    })

    if (res.status === 401) {
      // Token expired — clear cache and retry once
      cachedToken = null
      return GET()
    }
    if (!res.ok) throw new Error(`SPOND events failed: ${res.status}`)

    const raw: SpondEvent[] = await res.json()

    const events = raw.map(e => ({
      id:          e.id,
      heading:     e.heading,
      description: e.description ?? null,
      start:       e.startTimestamp,
      end:         e.endTimestamp,
      location:    e.location?.feature?.description ?? e.location?.address ?? null,
      type:        e.spondType ?? 'EVENT',
    }))

    return NextResponse.json({ events })
  } catch (err) {
    return NextResponse.json({ events: [], error: String(err) }, { status: 502 })
  }
}

// ── minimal SPOND shape ──────────────────────────────────────────
interface SpondEvent {
  id:             string
  heading:        string
  description?:   string
  startTimestamp: string
  endTimestamp:   string
  spondType?:     string
  location?: {
    feature?: { description?: string }
    address?: string
  }
}
