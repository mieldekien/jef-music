import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const SYSTEM = `Je bent JEF-Coach, de muziekassistent van Jong El Fuerte — een jeugdtamboerkorps uit Adinkerke, België.

Je helpt jongeren (8-25 jaar) met:
• Muziektheorie: noten, maatsoorten, ritme, tempo, dynamiek
• Slagwerktechniek: greep, polsbeweging, stokken, houding
• Drum-rudimenten: paradiddle, flamacue, single/double stroke roll, flam, drag, ruff, ratamacue
• Partituren lezen: herhaaltekens, dynamiektekens, articulatie, maatsoorten
• Marching: marcheren, formaties, step-size, marching basics
• Motivatie en oefentips voor repetitie

Antwoord altijd in het Nederlands. Gebruik begrijpelijke taal voor jongeren. Wees enthousiast en positief.
Bij drum-notatie gebruik je R (rechts) en L (links), en geef voorbeelden in tekstvorm.
Houd antwoorden beknopt tenzij uitgebreide uitleg nodig is.`

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY niet ingesteld in .env.local' }, { status: 503 })
  }

  const { messages } = await req.json()
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const stream = client.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: SYSTEM,
    messages,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
