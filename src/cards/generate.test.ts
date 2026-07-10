import { describe, expect, it, vi } from 'vitest'
import { generateLessonAudio } from '../audio/generate.js'
import { audioObjectKey } from '../audio/tts.js'
import { createLessonCard } from './generate.js'

describe('lesson card generation', () => {
  const sentence = {
    id: 1,
    normalizedText: 'Could I get a latte, please?',
    license: 'CC0-1.0',
    sourceUrl: 'https://tatoeba.org/en/downloads',
  }
  const override = {
    sentenceId: 1,
    approved: true,
    translationZh: '我可以要一杯拿铁吗？',
    cefrLevel: 'A1' as const,
    sceneKey: 'coffee_and_food',
  }

  it('creates drills only from an editor-approved source sentence', () => {
    const card = createLessonCard(sentence, override)
    expect(card.drills.map(item => item.kind)).toEqual(['shadow', 'substitution'])
    expect(() => createLessonCard(sentence, { ...override, approved: false })).toThrow('Only reviewed')
  })

  it('uses a stable content-addressed key for generated audio', async () => {
    const key = audioObjectKey({ text: sentence.normalizedText, voice: 'en-US-female-1', version: 'v1' })
    expect(key).toMatch(/^lesson-audio\/v1\/en-US-female-1\/[a-f0-9]{64}\.mp3$/)
    const synthesize = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]))
    const put = vi.fn().mockResolvedValue(`https://cdn.example.com/${key}`)
    await expect(generateLessonAudio({ synthesize }, { put }, {
      text: sentence.normalizedText,
      voice: 'en-US-female-1',
      version: 'v1',
    })).resolves.toEqual({ key, audioUrl: `https://cdn.example.com/${key}` })
    expect(synthesize).toHaveBeenCalledTimes(1)
    expect(put).toHaveBeenCalledWith(key, new Uint8Array([1, 2, 3]), 'audio/mpeg')
  })
})
