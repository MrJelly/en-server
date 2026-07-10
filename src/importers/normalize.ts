import type { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'

export interface NormalizedSentence {
  normalizedText: string
  textSha256: Buffer
  wordCount: number
  sampleBucket: number
}

export class SentenceRejectedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SentenceRejectedError'
  }
}

function crc32(value: Buffer) {
  let crc = 0xFFFFFFFF
  for (const byte of value) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0)
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

export function normalizeSentence(input: { text: string, license: string, sourceUrl: string }): NormalizedSentence {
  if (!input.license.trim())
    throw new SentenceRejectedError('Sentence license is required')
  if (!input.sourceUrl.trim())
    throw new SentenceRejectedError('Sentence source URL is required')
  if (Array.from(input.text).some((character) => {
    const code = character.charCodeAt(0)
    return code <= 31 || code === 127
  })) {
    throw new SentenceRejectedError('Sentence contains control characters')
  }
  if (/https?:\/\//i.test(input.text))
    throw new SentenceRejectedError('Sentence contains a URL')
  if (/<[^>]+>/.test(input.text))
    throw new SentenceRejectedError('Sentence contains markup')

  const normalizedText = input.text.normalize('NFKC').replace(/\s+/g, ' ').trim()
  const characterCount = Array.from(normalizedText).length
  if (characterCount < 3 || characterCount > 180)
    throw new SentenceRejectedError('Sentence length must be between 3 and 180 characters')

  const words = normalizedText.match(/[A-Z]+(?:'[A-Z]+)?/gi) ?? []
  if (words.length === 0)
    throw new SentenceRejectedError('Sentence must include English words')

  const textSha256 = createHash('sha256').update(normalizedText, 'utf8').digest()
  return {
    normalizedText,
    textSha256,
    wordCount: words.length,
    sampleBucket: crc32(textSha256) % 1000,
  }
}
