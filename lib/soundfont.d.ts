declare module 'soundfont-player' {
  interface PlayOptions {
    duration?: number
    gain?: number
    loop?: boolean
  }
  interface Player {
    play(note: number | string, when?: number, options?: PlayOptions): AudioBufferSourceNode
    stop(when?: number): void
  }
  function instrument(
    audioContext: AudioContext,
    name: string,
    options?: { soundfont?: string; format?: string }
  ): Promise<Player>
  export default { instrument }
}
