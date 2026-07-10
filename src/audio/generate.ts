import type { TtsProvider } from './tts.js'
import { audioObjectKey } from './tts.js'

export interface AudioStorage {
  put: (key: string, data: Uint8Array, contentType: string) => Promise<string>
}

export async function generateLessonAudio(
  provider: TtsProvider,
  storage: AudioStorage,
  input: { text: string, voice: string, version: string },
) {
  const key = audioObjectKey(input)
  const data = await provider.synthesize({ text: input.text, locale: 'en-US', voice: input.voice })
  const audioUrl = await storage.put(key, data, 'audio/mpeg')
  return { key, audioUrl }
}
