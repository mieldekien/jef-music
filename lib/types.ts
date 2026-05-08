export type Song = {
  id: string
  title: string
  composer: string | null
  bpm: number | null
  category: string | null
  difficulty: 1 | 2 | 3 | null
  instruments: string[]
  pdf_url: string | null
  audio_url: string | null
  mp3_url: string | null
  midi_url: string | null
  xml_url: string | null
  section: 'slagwerk' | 'melodisch' | null
  show: string | null
  created_at: string
}

export type Exercise = {
  id: string
  title: string
  description: string | null
  category: string | null
  difficulty: 1 | 2 | 3 | null
  xml_url: string | null
  video_url: string | null
  midi_url: string | null
  created_by_name: string | null
  created_at: string
}

export type ChatMessage = {
  id: string
  content: string
  user_id: string | null
  user_name: string
  is_crew: boolean
  created_at: string
}
