import { createHash } from 'node:crypto'

export interface TtsProvider {
  synthesize: (input: { text: string, locale: 'en-US', voice: string }) => Promise<Uint8Array>
}

export function audioObjectKey(input: { text: string, voice: string, version: string }) {
  const digest = createHash('sha256').update(`${input.version}\n${input.voice}\n${input.text}`).digest('hex')
  return `lesson-audio/${input.version}/${input.voice}/${digest}.mp3`
}
